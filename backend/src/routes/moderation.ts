import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authGuard, RequestWithUser } from '../middleware/auth.js';
import { prisma } from '../config/db.js';
import { redisClient } from '../config/redis.js';

const router = Router();

/**
 * 1. Submit User Report
 */
router.post('/report', authGuard, async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  const { reportedId, reason, roomId } = req.body;

  if (!reportedId || !reason) {
    return res.status(400).json({ error: 'reportedId and reason are required' });
  }

  try {
    // Check if user is repeatedly reporting the same target (Report Spam prevention)
    const activeCooldown = await redisClient.get(`report_cooldown:${user.userId}:${reportedId}`);
    if (activeCooldown) {
      return res.status(429).json({ error: 'You have reported this user recently. Please wait.' });
    }

    // Resolve room ID if not provided
    let finalRoomId = roomId;
    if (!finalRoomId) {
      const sharedRoom = await prisma.chatRoom.findFirst({
        where: {
          members: {
            some: { userId: user.userId }
          },
          AND: {
            members: {
              some: { userId: reportedId }
            }
          }
        }
      });
      finalRoomId = sharedRoom?.id || 'FRIENDS_REPORT';
    }

    // Save report to database
    const report = await prisma.report.create({
      data: {
        reporterId: user.userId,
        reportedId,
        reason,
        roomId: finalRoomId
      }
    });

    // Track report count for auto-mute (3+ reports triggers mute)
    const reportCount = await prisma.report.count({
      where: { reportedId, createdAt: { gte: new Date(Date.now() - 86400000) } }
    });
    if (reportCount >= 3) {
      await redisClient.set(`mute:${reportedId}`, 'true', { EX: 1800 });
      await prisma.auditLog.create({
        data: {
          userId: reportedId,
          action: 'AUTO_MUTE',
          description: `User automatically muted due to ${reportCount} reports in 24h`
        }
      });
    }

    // Set 60 seconds report rate limit between these two users
    await redisClient.set(`report_cooldown:${user.userId}:${reportedId}`, 'true', { EX: 60 });

    return res.json({ status: 'success', reportId: report.id });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * 2. Block User
 */
router.post('/block', authGuard, async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  const { blockedId } = req.body;

  if (!blockedId) {
    return res.status(400).json({ error: 'blockedId is required' });
  }

  try {
    const block = await prisma.block.create({
      data: {
        blockerId: user.userId,
        blockedId
      }
    });

    // Delete any friend relationships between the two users
    await prisma.friend.deleteMany({
      where: {
        OR: [
          { userId1: user.userId, userId2: blockedId },
          { userId1: blockedId, userId2: user.userId }
        ]
      }
    });

    // Delete any friend requests between the two users
    await prisma.friendRequest.deleteMany({
      where: {
        OR: [
          { senderId: user.userId, receiverId: blockedId },
          { senderId: blockedId, receiverId: user.userId }
        ]
      }
    });

    return res.json({ status: 'success', blockId: block.id });
  } catch (error: any) {
    // If block already exists (Unique constraint violation)
    if (error.code === 'P2002') {
      // Still make sure we clean up friendships/requests just in case
      await prisma.friend.deleteMany({
        where: {
          OR: [
            { userId1: user.userId, userId2: blockedId },
            { userId1: blockedId, userId2: user.userId }
          ]
        }
      });
      await prisma.friendRequest.deleteMany({
        where: {
          OR: [
            { senderId: user.userId, receiverId: blockedId },
            { senderId: blockedId, receiverId: user.userId }
          ]
        }
      });
      return res.json({ status: 'success', message: 'User already blocked' });
    }
    return res.status(500).json({ error: error.message });
  }
});

/**
 * 3. Submit Appeal
 */
router.post('/appeal', authGuard, async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ error: 'reason is required' });
  }

  try {
    // Check if user already has a pending appeal
    const activeAppeal = await prisma.appeal.findFirst({
      where: { userId: user.userId, status: 'PENDING' }
    });

    if (activeAppeal) {
      return res.status(400).json({ error: 'You already have an active pending appeal.' });
    }

    const appeal = await prisma.appeal.create({
      data: {
        userId: user.userId,
        reason
      }
    });

    return res.json({ status: 'success', appealId: appeal.id });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * 4. Fetch User Enforcement History
 */
router.get('/history', authGuard, async (req: RequestWithUser, res: Response) => {
  const user = req.user!;

  try {
    const appeals = await prisma.appeal.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' }
    });

    const isMuted = await redisClient.get(`mute:${user.userId}`);

    return res.json({
      userId: user.userId,
      isCurrentlyMuted: isMuted === 'true',
      appeals
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * 5. CAPTCHA Endpoint (Arithmetic verification stubs)
 */
router.get('/captcha', async (req, res) => {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const sum = num1 + num2;

  const captchaId = uuidv4();
  // Cache the answer in Redis for 5 minutes
  await redisClient.set(`captcha:${captchaId}`, sum.toString(), { EX: 300 });

  return res.json({
    captchaId,
    question: `Please solve: ${num1} + ${num2} = ?`
  });
});

export default router;
