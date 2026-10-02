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
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        registrationType: true,
        userType: true,
        emailVerified: true,
        isShadowBanned: true,
        status: true,
        lastSeen: true,
        createdAt: true,
        role: { select: { id: true, name: true } },
      },
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
  const { shadowBan } = req.body;

  try {
    const updateData: any = {};
    if (shadowBan !== undefined) updateData.isShadowBanned = shadowBan;

    const user = await prisma.user.update({
      where: { id },
      data: updateData
    });

    // Write audit log entry
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'BAN_MODIFICATION',
        description: `Moderator adjusted settings: shadowBan=${shadowBan}`
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
        reported: { select: { id: true, email: true } }
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
      include: { user: { select: { id: true, email: true } } },
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

    // If appeal approved, remove any active mutes
    if (status === 'APPROVED') {
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
 * Returns current feature access control states.
 */
router.get('/feature-flags', adminGuard, async (_req: Request, res: Response) => {
  try {
    const [voiceMode, videoMode, imageMode, genderFilterMode, guestAccess, registrationRequired] = await Promise.all([
      redisClient.get('feature:voice_mode'),
      redisClient.get('feature:video_mode'),
      redisClient.get('feature:image_mode'),
      redisClient.get('feature:gender_filter_mode'),
      redisClient.get('feature:guest_access'),
      redisClient.get('feature:registration_required'),
    ]);
    return res.json({
      voiceMode: voiceMode || 'premium',       // 'free' | 'premium' | 'disabled'
      videoMode: videoMode || 'premium',       // 'free' | 'premium' | 'disabled'
      imageMode: imageMode || 'free',          // 'free' | 'premium' | 'disabled'
      genderFilterMode: genderFilterMode || 'premium', // 'free' | 'premium' | 'disabled'
      guestAccess: guestAccess !== '0',        // true/false
      registrationRequired: registrationRequired === '1', // true/false
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/v1/admin/feature-flags
 * Update feature access modes.
 * Modes: 'free' (everyone), 'premium' (subscribers only), 'disabled' (no one)
 */
router.post('/feature-flags', superAdminGuard, async (req: RequestWithUser, res: Response) => {
  const { voiceMode, videoMode, imageMode, genderFilterMode, guestAccess, registrationRequired } = req.body;
  const adminId = req.user!.userId;

  try {
    const updates: string[] = [];
    const validModes = ['free', 'premium', 'disabled'];

    if (voiceMode && validModes.includes(voiceMode)) {
      await redisClient.set('feature:voice_mode', voiceMode);
      // Also set legacy flag for backward compat
      await redisClient.set('feature:voice_enabled', voiceMode === 'disabled' ? '0' : '1');
      updates.push(`voice=${voiceMode}`);
    }
    if (videoMode && validModes.includes(videoMode)) {
      await redisClient.set('feature:video_mode', videoMode);
      await redisClient.set('feature:video_enabled', videoMode === 'disabled' ? '0' : '1');
      updates.push(`video=${videoMode}`);
    }
    if (imageMode && validModes.includes(imageMode)) {
      await redisClient.set('feature:image_mode', imageMode);
      updates.push(`image=${imageMode}`);
    }
    if (genderFilterMode && validModes.includes(genderFilterMode)) {
      await redisClient.set('feature:gender_filter_mode', genderFilterMode);
      updates.push(`genderFilter=${genderFilterMode}`);
    }
    if (guestAccess !== undefined) {
      await redisClient.set('feature:guest_access', guestAccess ? '1' : '0');
      updates.push(`guestAccess=${guestAccess}`);
    }
    if (registrationRequired !== undefined) {
      await redisClient.set('feature:registration_required', registrationRequired ? '1' : '0');
      updates.push(`registrationRequired=${registrationRequired}`);
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

// ─── Admin: Dashboard Stats Overview ─────────────────────────────────────────

/**
 * GET /api/v1/admin/dashboard-stats
 * Comprehensive dashboard statistics for the admin overview.
 */
router.get('/dashboard-stats', adminGuard, async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers, guestUsers, registeredUsers, paidUsers,
      onlineUsers, newUsersToday, newUsersWeek,
      totalReportsPending, totalAppeals,
      activeSubs, totalFriendships, totalMessages
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { registrationType: 'GUEST' } }),
      prisma.user.count({ where: { registrationType: { not: 'GUEST' } } }),
      prisma.user.count({ where: { userType: 'PAID' } }),
      prisma.user.count({ where: { status: 'ONLINE' } }),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.appeal.count({ where: { status: 'PENDING' } }),
      prisma.userSubscription.count({ where: { status: 'ACTIVE', expiresAt: { gt: now } } }),
      prisma.friend.count({ where: { status: 'ACCEPTED' } }),
      prisma.privateMessage.count()
    ]);

    const bannedUsers = await prisma.user.count({ where: { isShadowBanned: true } });

    return res.json({
      users: { total: totalUsers, guests: guestUsers, registered: registeredUsers, paid: paidUsers, online: onlineUsers, banned: bannedUsers, newToday: newUsersToday, newWeek: newUsersWeek },
      moderation: { pendingReports: totalReportsPending, pendingAppeals: totalAppeals },
      subscriptions: { active: activeSubs },
      social: { friendships: totalFriendships, messages: totalMessages }
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ─── Admin: Mute User ────────────────────────────────────────────────────────

/**
 * POST /api/v1/admin/users/:id/mute
 * Mute a user for a specified duration (in seconds).
 */
router.post('/users/:id/mute', adminGuard, async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;
  const { duration } = req.body; // duration in seconds, default 3600 (1 hour)
  const muteDuration = duration || 3600;

  try {
    await redisClient.set(`mute:${id}`, '1', { EX: muteDuration });

    await prisma.auditLog.create({
      data: {
        userId: id,
        action: 'USER_MUTED',
        description: `User muted for ${muteDuration} seconds by admin ${req.user!.userId}`
      }
    });

    return res.json({ success: true, message: `User muted for ${muteDuration} seconds.` });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/v1/admin/users/:id/unmute
 * Remove mute from a user.
 */
router.post('/users/:id/unmute', adminGuard, async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;

  try {
    await redisClient.del(`mute:${id}`);

    await prisma.auditLog.create({
      data: {
        userId: id,
        action: 'USER_UNMUTED',
        description: `User unmuted by admin ${req.user!.userId}`
      }
    });

    return res.json({ success: true, message: 'User unmuted.' });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ─── Admin: Delete User ──────────────────────────────────────────────────────

/**
 * DELETE /api/v1/admin/users/:id
 * Permanently delete a user and all related data.
 */
router.delete('/users/:id', superAdminGuard, async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.user.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        action: 'USER_DELETED',
        description: `User ${id} permanently deleted by admin ${req.user!.userId}`
      }
    });

    return res.json({ success: true, message: 'User permanently deleted.' });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ─── Admin: Change User Role ─────────────────────────────────────────────────

/**
 * POST /api/v1/admin/users/:id/role
 * Change a user's role.
 */
router.post('/users/:id/role', superAdminGuard, async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;
  const { roleName } = req.body;

  if (!roleName) return res.status(400).json({ error: 'roleName is required.' });

  try {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) return res.status(404).json({ error: `Role "${roleName}" not found.` });

    const user = await prisma.user.update({
      where: { id },
      data: { roleId: role.id },
      include: { role: true }
    });

    await prisma.auditLog.create({
      data: {
        userId: id,
        action: 'ROLE_CHANGED',
        description: `User role changed to "${roleName}" by admin ${req.user!.userId}`
      }
    });

    return res.json({ success: true, user });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ─── Admin: Revoke Subscription ──────────────────────────────────────────────

/**
 * POST /api/v1/admin/subscriptions/:subscriptionId/revoke
 * Revoke/cancel an active subscription.
 */
router.post('/subscriptions/:subscriptionId/revoke', superAdminGuard, async (req: RequestWithUser, res: Response) => {
  const { subscriptionId } = req.params;

  try {
    const sub = await prisma.userSubscription.update({
      where: { id: subscriptionId },
      data: { status: 'CANCELLED' }
    });

    await prisma.auditLog.create({
      data: {
        userId: sub.userId,
        action: 'SUBSCRIPTION_REVOKED',
        description: `Subscription ${subscriptionId} revoked by admin ${req.user!.userId}`
      }
    });

    return res.json({ success: true, subscription: sub });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ─── Admin: Audit Log ────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/audit-logs
 * Fetch recent audit log entries.
 */
router.get('/audit-logs', adminGuard, async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = 50;
  const skip = (page - 1) * limit;

  try {
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        include: { user: { select: { id: true, email: true, displayName: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.auditLog.count()
    ]);

    return res.json({ logs, total, page, totalPages: Math.ceil(total / limit) });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ─── Admin: Get Roles ────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/roles
 * List all available roles.
 */
router.get('/roles', adminGuard, async (_req: Request, res: Response) => {
  try {
    const roles = await prisma.role.findMany({ orderBy: { name: 'asc' } });
    return res.json({ roles });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN: Tickets Management
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/tickets', adminGuard, async (_req: Request, res: Response) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: { select: { id: true, username: true, email: true, displayName: true } } },
    });
    return res.json({ tickets });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

router.put('/tickets/:id', adminGuard, async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;
  const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  try {
    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(adminNotes !== undefined && { adminNotes }),
        ...(status === 'RESOLVED' || status === 'CLOSED' ? { resolvedAt: new Date(), resolvedBy: req.user!.userId } : {}),
      }
    });
    return res.json({ ticket });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN: Appeals Management
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/appeals', adminGuard, async (_req: Request, res: Response) => {
  try {
    const appeals = await prisma.appeal.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: { select: { id: true, username: true, email: true, displayName: true, isShadowBanned: true } } },
    });
    return res.json({ appeals });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

router.put('/appeals/:id', adminGuard, async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;
  const { status, decisionLog, unbanUser } = req.body;
  const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  try {
    const appeal = await prisma.appeal.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(decisionLog !== undefined && { decisionLog }),
        ...(status !== 'PENDING' ? { resolvedAt: new Date() } : {}),
      }
    });
    // If approved and unbanUser is true, lift the ban
    if (status === 'APPROVED' && unbanUser) {
      await prisma.user.update({ where: { id: appeal.userId }, data: { isShadowBanned: false } });
    }
    return res.json({ appeal });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN: Error Logs
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/errors', adminGuard, async (req: Request, res: Response) => {
  const { page = '1', limit = '50' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  try {
    const [errors, total] = await Promise.all([
      prisma.errorLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip,
      }),
      prisma.errorLog.count(),
    ]);
    return res.json({ errors, total, page: parseInt(page as string) });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

router.delete('/errors/clear', superAdminGuard, async (_req: Request, res: Response) => {
  try {
    const { count } = await prisma.errorLog.deleteMany({});
    return res.json({ success: true, deleted: count });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN: VM Monitoring
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/monitoring', adminGuard, async (_req: Request, res: Response) => {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    const uptime = os.uptime();

    // Calculate CPU usage from load average
    const cpuCount = cpus.length;
    const cpuUsagePercent = Math.round((loadAvg[0] / cpuCount) * 100);

    // Process info
    const processMemory = process.memoryUsage();

    // Redis info
    let redisInfo: any = {};
    try {
      const info = await redisClient.info('memory');
      const usedMemMatch = info.match(/used_memory_human:(.+)/);
      redisInfo.usedMemory = usedMemMatch ? usedMemMatch[1].trim() : 'N/A';
    } catch { redisInfo.usedMemory = 'N/A'; }

    // DB stats
    const [totalUsers, onlineUsers, totalMessages, totalRooms] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ONLINE' } }),
      prisma.privateMessage.count(),
      prisma.chatRoom.count(),
    ]);

    return res.json({
      system: {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        uptime: Math.floor(uptime),
        uptimeFormatted: `${Math.floor(uptime / 86400)}d ${Math.floor((uptime % 86400) / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
      },
      memory: {
        totalGB: (totalMem / 1024 / 1024 / 1024).toFixed(2),
        usedGB: (usedMem / 1024 / 1024 / 1024).toFixed(2),
        freeGB: (freeMem / 1024 / 1024 / 1024).toFixed(2),
        usedPercent: Math.round((usedMem / totalMem) * 100),
      },
      cpu: {
        cores: cpuCount,
        model: cpus[0]?.model || 'N/A',
        loadAvg: loadAvg.map(l => l.toFixed(2)),
        usagePercent: Math.min(cpuUsagePercent, 100),
      },
      process: {
        pid: process.pid,
        heapUsedMB: (processMemory.heapUsed / 1024 / 1024).toFixed(1),
        heapTotalMB: (processMemory.heapTotal / 1024 / 1024).toFixed(1),
        rssMB: (processMemory.rss / 1024 / 1024).toFixed(1),
        uptimeSec: Math.floor(process.uptime()),
      },
      redis: redisInfo,
      database: { totalUsers, onlineUsers, totalMessages, totalRooms },
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN: Cleanup Controls
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/cleanup/config', adminGuard, async (_req: Request, res: Response) => {
  try {
    let configs: any[] = [];
    try {
      configs = await prisma.systemConfig.findMany();
    } catch {
      // Table might not exist yet - return defaults
    }
    const configMap: Record<string, string> = {};
    for (const c of configs) configMap[c.key] = c.value;

    return res.json({
      inactive_days: configMap['inactive_days'] || '7',
      auto_delete_inactive: configMap['auto_delete_inactive'] || '1',
      auto_delete_guests: configMap['auto_delete_guests'] || '1',
      guest_ttl_hours: configMap['guest_ttl_hours'] || '24',
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

router.put('/cleanup/config', superAdminGuard, async (req: RequestWithUser, res: Response) => {
  const { inactive_days, auto_delete_inactive, auto_delete_guests, guest_ttl_hours } = req.body;
  try {
    const { CleanupService } = await import('../services/cleanup.js');
    if (inactive_days !== undefined) await CleanupService.setConfigValue('inactive_days', String(inactive_days));
    if (auto_delete_inactive !== undefined) await CleanupService.setConfigValue('auto_delete_inactive', String(auto_delete_inactive));
    if (auto_delete_guests !== undefined) await CleanupService.setConfigValue('auto_delete_guests', String(auto_delete_guests));
    if (guest_ttl_hours !== undefined) await CleanupService.setConfigValue('guest_ttl_hours', String(guest_ttl_hours));

    return res.json({ success: true, message: 'Cleanup config updated.' });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

router.post('/cleanup/run', superAdminGuard, async (req: RequestWithUser, res: Response) => {
  const { action } = req.body; // 'guests' | 'inactive' | 'all'
  try {
    const { CleanupService } = await import('../services/cleanup.js');
    let guestsDeleted = 0;
    let inactiveDeleted = 0;

    if (action === 'guests' || action === 'all') {
      guestsDeleted = await CleanupService.deleteAllGuests(); // Immediate delete ALL offline guests
    }
    if (action === 'inactive' || action === 'all') {
      const days = await CleanupService.getConfigValue('inactive_days', 7);
      inactiveDeleted = await CleanupService.deleteInactiveAccounts(days);
    }

    return res.json({ success: true, guestsDeleted, inactiveDeleted });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
