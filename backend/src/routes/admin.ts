import { Router, Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { redisClient } from '../config/redis.js';
import { authGuard, RequestWithUser } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';
import { SubscriptionService } from '../services/subscription.js';
import os from 'os';
import fs from 'fs';
import path from 'path';

const router = Router();

// Apply Auth and Role checks (Admin, Moderator, Super Admin roles)
const adminGuard = [authGuard, requireRole(['SUPER ADMIN', 'ADMIN', 'SENIOR MODERATOR', 'MODERATOR'])];
const superAdminGuard = [authGuard, requireRole(['SUPER ADMIN', 'ADMIN'])];

/**
 * 1. User List & Filtering
 */
router.get('/users', adminGuard, async (req: RequestWithUser, res: Response) => {
  const search = (req.query.search as string) || '';
  const page = parseInt(req.query.page as string) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { id: { contains: search } }
        ]
      },
      include: { role: true },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.user.count({
      where: {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { id: { contains: search } }
        ]
      }
    });

    return res.json({ users, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * 2. Force Logout & Ban Actions
 */
router.post('/users/:id/ban', adminGuard, async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;
  const { shadowBan, reputationPoints } = req.body;

  try {
    const updateData: any = {};
    if (shadowBan !== undefined) updateData.isShadowBanned = shadowBan;
    if (reputationPoints !== undefined) updateData.reputationScore = reputationPoints;

    const user = await prisma.user.update({
      where: { id },
      data: updateData
    });

    // Write audit log entry
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'BAN_MODIFICATION',
        description: `Moderator adjusted settings: shadowBan=${shadowBan}, reputation=${reputationPoints}`
      }
    });

    return res.json({ status: 'success', user });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * 3. Moderator Report Queue
 */
router.get('/reports', adminGuard, async (req: RequestWithUser, res: Response) => {
  const status = (req.query.status as string) || 'PENDING';

  try {
    const reports = await prisma.report.findMany({
      where: { status },
      include: {
        reporter: { select: { id: true, email: true } },
        reported: { select: { id: true, email: true, reputationScore: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ reports });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/reports/:id/resolve', adminGuard, async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;
  const { status, moderatorNotes } = req.body; // status: APPROVED or REJECTED

  try {
    const report = await prisma.report.update({
      where: { id },
      data: { status }
    });

    await prisma.auditLog.create({
      data: {
        action: 'REPORT_RESOLVED',
        description: `Report ${id} marked as ${status}. Notes: ${moderatorNotes || 'none'}`
      }
    });

    return res.json({ status: 'success', report });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * 4. User Appeals Queue
 */
router.get('/appeals', adminGuard, async (req: RequestWithUser, res: Response) => {
  try {
    const appeals = await prisma.appeal.findMany({
      include: { user: { select: { id: true, email: true, reputationScore: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ appeals });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/appeals/:id/resolve', adminGuard, async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;
  const { status, decisionLog } = req.body; // status: APPROVED or REJECTED

  try {
    const appeal = await prisma.appeal.update({
      where: { id },
      data: {
        status,
        resolvedAt: new Date(),
        decisionLog
      }
    });

    // If appeal approved, restore reputation back to 100
    if (status === 'APPROVED') {
      await prisma.user.update({
        where: { id: appeal.userId },
        data: { reputationScore: 100 }
      });
      // Remove any active mutes in Redis
      await redisClient.del(`mute:${appeal.userId}`);
    }

    await prisma.auditLog.create({
      data: {
        userId: appeal.userId,
        action: 'APPEAL_RESOLVED',
        description: `Appeal ${id} marked as ${status}. Notes: ${decisionLog || 'none'}`
      }
    });

    return res.json({ status: 'success', appeal });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * 5. Platform Config Updates
 */
router.get('/config', adminGuard, async (req: Request, res: Response) => {
  const matchThreshold = await redisClient.get('config:match_threshold') || '40';
  const fallbackTimeout = await redisClient.get('config:fallback_timeout') || '10';

  return res.json({
    matchThreshold: parseInt(matchThreshold),
    fallbackTimeout: parseInt(fallbackTimeout)
  });
});

router.post('/config', superAdminGuard, async (req: RequestWithUser, res: Response) => {
  const { matchThreshold, fallbackTimeout } = req.body;

  if (matchThreshold !== undefined) {
    await redisClient.set('config:match_threshold', matchThreshold.toString());
  }
  if (fallbackTimeout !== undefined) {
    await redisClient.set('config:fallback_timeout', fallbackTimeout.toString());
  }

  await prisma.auditLog.create({
    data: {
      action: 'CONFIG_CHANGED',
      description: `Platform config updated: matchThreshold=${matchThreshold}, fallbackTimeout=${fallbackTimeout}`
    }
  });

  return res.json({ status: 'success', message: 'Configurations saved successfully.' });
});

/**
 * 6. Site-wide Broadcast
 */
router.post('/broadcast', superAdminGuard, async (req: RequestWithUser, res: Response) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'message content is required' });
  }

  // Socket.IO instance can be accessed if bound to express app
  const io = req.app.get('io');
  if (io) {
    io.emit('system:info', { message: `ANNOUNCEMENT: ${message}` });
  }

  await prisma.auditLog.create({
    data: {
      action: 'SYSTEM_BROADCAST',
      description: `Site-wide broadcast: "${message}"`
    }
  });

  return res.json({ status: 'success', message: 'Announcement broadcasted.' });
});

/**
 * 7. System Resource Monitoring Stats
 */
router.get('/system/stats', adminGuard, async (req: Request, res: Response) => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const cpuCount = os.cpus().length;
  
  // Calculate average wait time stats in Redis
  const activeTextQueue = await redisClient.sCard('matchmaking:queue:text');
  const activeVoiceQueue = await redisClient.sCard('matchmaking:queue:voice');
  const activeVideoQueue = await redisClient.sCard('matchmaking:queue:video');

  return res.json({
    os: {
      platform: os.platform(),
      totalMemoryGB: (totalMem / 1024 / 1024 / 1024).toFixed(2),
      freeMemoryGB: (freeMem / 1024 / 1024 / 1024).toFixed(2),
      cpuCount
    },
    queues: {
      text: activeTextQueue,
      voice: activeVoiceQueue,
      video: activeVideoQueue
    }
  });
});

/**
 * 8. Dynamic Backups Manager (JSON table dumps export)
 */
router.post('/backups/export', superAdminGuard, async (req: RequestWithUser, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    const reports = await prisma.report.findMany();
    const auditLogs = await prisma.auditLog.findMany();

    const dataDump = {
      timestamp: new Date().toISOString(),
      users,
      reports,
      auditLogs
    };

    const dir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    const filename = `backup-${Date.now()}.json`;
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, JSON.stringify(dataDump, null, 2));

    await prisma.auditLog.create({
      data: {
        action: 'DB_BACKUP',
        description: `Exported JSON database backup: ${filename}`
      }
    });

    return res.json({ status: 'success', filename, filePath });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * 9. Submitting User Feedback / Bug Reports
 */
router.post('/feedback', authGuard, async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  const { category, message } = req.body;

  if (!category || !message) {
    return res.status(400).json({ error: 'category and message are required' });
  }

  try {
    const feedback = await prisma.feedback.create({
      data: {
        userId: user.userId,
        category,
        message
      }
    });
    return res.json({ status: 'success', feedbackId: feedback.id });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/feedback', adminGuard, async (req: RequestWithUser, res: Response) => {
  try {
    const feedbacks = await prisma.feedback.findMany({
      include: { user: { select: { id: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ feedbacks });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;

// ─── Admin: Subscription Management ─────────────────────────────────────────

/**
 * GET /api/v1/admin/subscriptions
 * List all subscriptions with user info and plan details.
 */
router.get('/subscriptions', adminGuard, async (_req: Request, res: Response) => {
  try {
    const subscriptions = await prisma.userSubscription.findMany({
      include: {
        user: { select: { id: true, email: true, userType: true } },
        plan: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    return res.json({ subscriptions });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/v1/admin/subscriptions/stats
 * Returns aggregate subscription statistics.
 */
router.get('/subscriptions/stats', adminGuard, async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const [active, expired, cancelled, total, paidUsers] = await Promise.all([
      prisma.userSubscription.count({ where: { status: 'ACTIVE', expiresAt: { gt: now } } }),
      prisma.userSubscription.count({ where: { status: 'EXPIRED' } }),
      prisma.userSubscription.count({ where: { status: 'CANCELLED' } }),
      prisma.userSubscription.count(),
      prisma.user.count({ where: { userType: 'PAID' } })
    ]);

    const byPlan = await prisma.userSubscription.groupBy({
      by: ['planId'],
      where: { status: 'ACTIVE', expiresAt: { gt: now } },
      _count: { id: true }
    });

    return res.json({ active, expired, cancelled, total, paidUsers, byPlan });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/v1/admin/subscriptions/:userId/grant
 * Manually grant a subscription to a user (admin provisioning).
 */
router.post('/subscriptions/:userId/grant', superAdminGuard, async (req: RequestWithUser, res: Response) => {
  const { userId } = req.params;
  const { planId, transactionRef } = req.body;
  const adminId = req.user!.userId;

  if (!planId) return res.status(400).json({ error: 'planId is required' });

  try {
    const subscription = await SubscriptionService.createManualSubscription(userId, planId, adminId, transactionRef);
    return res.json({ success: true, subscription });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ─── Admin: Subscription Plans ───────────────────────────────────────────────

/**
 * GET /api/v1/admin/plans
 * List all subscription plans (including inactive).
 */
router.get('/plans', adminGuard, async (_req: Request, res: Response) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({ orderBy: { priceInr: 'asc' } });
    return res.json({ plans });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/v1/admin/plans
 * Create a new subscription plan.
 */
router.post('/plans', superAdminGuard, async (req: RequestWithUser, res: Response) => {
  const { type, priceInr, validityDays, isVoiceEnabled, isVideoEnabled } = req.body;
  const validTypes = ['DAILY', 'WEEKLY', 'MONTHLY'];
  if (!type || !validTypes.includes(type)) return res.status(400).json({ error: 'Invalid plan type.' });
  if (!priceInr || !validityDays) return res.status(400).json({ error: 'priceInr and validityDays are required.' });

  try {
    const plan = await prisma.subscriptionPlan.upsert({
      where: { type },
      create: { type, priceInr, validityDays, isVoiceEnabled: isVoiceEnabled ?? true, isVideoEnabled: isVideoEnabled ?? true },
      update: { priceInr, validityDays, isVoiceEnabled: isVoiceEnabled ?? true, isVideoEnabled: isVideoEnabled ?? true }
    });
    return res.json({ success: true, plan });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/**
 * PUT /api/v1/admin/plans/:id
 * Update an existing plan (price, validity, active status, feature flags).
 */
router.put('/plans/:id', superAdminGuard, async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;
  const { priceInr, validityDays, isActive, isVoiceEnabled, isVideoEnabled } = req.body;

  try {
    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        ...(priceInr !== undefined && { priceInr }),
        ...(validityDays !== undefined && { validityDays }),
        ...(isActive !== undefined && { isActive }),
        ...(isVoiceEnabled !== undefined && { isVoiceEnabled }),
        ...(isVideoEnabled !== undefined && { isVideoEnabled })
      }
    });
    return res.json({ success: true, plan });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ─── Admin: Global Feature Flags ─────────────────────────────────────────────

/**
 * GET /api/v1/admin/feature-flags
 * Returns current global voice/video feature flag states.
 */
router.get('/feature-flags', adminGuard, async (_req: Request, res: Response) => {
  try {
    const [voiceFlag, videoFlag] = await Promise.all([
      redisClient.get('feature:voice_enabled'),
      redisClient.get('feature:video_enabled')
    ]);
    return res.json({
      voiceEnabled: voiceFlag !== '0',
      videoEnabled: videoFlag !== '0'
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/v1/admin/feature-flags
 * Toggle voice or video globally (0 = disabled, 1 = enabled).
 */
router.post('/feature-flags', superAdminGuard, async (req: RequestWithUser, res: Response) => {
  const { voiceEnabled, videoEnabled } = req.body;
  const adminId = req.user!.userId;

  try {
    const updates: string[] = [];
    if (voiceEnabled !== undefined) {
      await redisClient.set('feature:voice_enabled', voiceEnabled ? '1' : '0');
      updates.push(`voice=${voiceEnabled ? 'enabled' : 'disabled'}`);
    }
    if (videoEnabled !== undefined) {
      await redisClient.set('feature:video_enabled', videoEnabled ? '1' : '0');
      updates.push(`video=${videoEnabled ? 'enabled' : 'disabled'}`);
    }

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'FEATURE_FLAGS_CHANGED',
        description: `Global feature flags updated: ${updates.join(', ')}`
      }
    });

    return res.json({ success: true, message: `Updated: ${updates.join(', ')}` });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});
