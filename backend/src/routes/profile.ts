import { Router, Response } from 'express';
import { prisma } from '../config/db.js';
import { authGuard, RequestWithUser } from '../middleware/auth.js';
import argon2 from 'argon2';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const router = Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(process.cwd(), 'tmp', 'avatars');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, GIF, WebP allowed.'));
  }
});

router.get('/me', authGuard, async (req: RequestWithUser, res: Response) => {
  const userPayload = req.user;
  if (!userPayload) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const user = await prisma.user.findUnique({
      where: { id: userPayload.userId },
      include: {
        settings: true,
        achievements: { include: { achievement: true } },
        badges: { include: { badge: true } },
        role: true
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({
      userId: user.id,
      email: user.email,
      registrationType: user.registrationType,
      userType: user.userType,
      reputationScore: user.reputationScore,
      experiencePoints: user.experiencePoints,
      level: user.level,
      role: user.role?.name,
      settings: user.settings,
      achievements: user.achievements,
      badges: user.badges,
      avatarUrl: user.avatarUrl,
      displayName: user.displayName,
      bio: user.bio,
      status: user.status,
      lastSeen: user.lastSeen.toISOString(),
      linkedProviders: user.linkedProviders,
      createdAt: user.createdAt.toISOString()
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return res.status(500).json({ error: 'Failed to retrieve profile data' });
  }
});

router.put('/update', authGuard, async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  const { displayName, bio } = req.body;

  try {
    const updated = await prisma.user.update({
      where: { id: user.userId },
      data: {
        displayName: displayName !== undefined ? displayName : undefined,
        bio: bio !== undefined ? bio : undefined
      }
    });

    return res.json({
      userId: updated.id,
      displayName: updated.displayName,
      bio: updated.bio,
      avatarUrl: updated.avatarUrl
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

router.post('/avatar', authGuard, upload.single('avatar'), async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  if (!req.file) return res.status(400).json({ error: 'No image provided.' });

  try {
    const avatarUrl = `/api/v1/profile/avatar/${req.file.filename}`;

    const currentUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (currentUser?.avatarUrl) {
      const oldPath = path.join(process.cwd(), 'tmp', 'avatars', path.basename(currentUser.avatarUrl));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    await prisma.user.update({
      where: { id: user.userId },
      data: { avatarUrl }
    });

    return res.json({ avatarUrl });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to upload avatar.' });
  }
});

router.get('/avatar/:filename', async (req, res) => {
  const filePath = path.join(process.cwd(), 'tmp', 'avatars', req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Avatar not found.' });
  res.sendFile(filePath);
});

router.put('/password', authGuard, async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Current password and new password (min 6 chars) required.' });
  }

  try {
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser || !dbUser.passwordHash) {
      return res.status(400).json({ error: 'Cannot change password for OAuth-only accounts.' });
    }

    const valid = await argon2.verify(dbUser.passwordHash, currentPassword);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect.' });

    const newHash = await argon2.hash(newPassword);
    await prisma.user.update({
      where: { id: user.userId },
      data: { passwordHash: newHash }
    });

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to change password.' });
  }
});

router.put('/settings', authGuard, async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  const { theme, languagePref, soundEnabled, defaultVideoEnabled, discoverable, notificationsEnabled, showLastSeen, showOnlineStatus } = req.body;

  try {
    const updatedSettings = await prisma.userSettings.upsert({
      where: { userId: user.userId },
      update: {
        theme, languagePref, soundEnabled, defaultVideoEnabled, discoverable,
        notificationsEnabled, showLastSeen, showOnlineStatus
      },
      create: {
        userId: user.userId,
        theme: theme || 'dark',
        languagePref: languagePref || 'en',
        soundEnabled: soundEnabled ?? true,
        defaultVideoEnabled: defaultVideoEnabled ?? false,
        discoverable: discoverable ?? true,
        notificationsEnabled: notificationsEnabled ?? true,
        showLastSeen: showLastSeen ?? true,
        showOnlineStatus: showOnlineStatus ?? true
      }
    });

    return res.json({ settings: updatedSettings });
  } catch (error) {
    console.error('Settings update error:', error);
    return res.status(500).json({ error: 'Failed to update settings' });
  }
});

router.get('/sessions', authGuard, async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  try {
    const sessions = await prisma.refreshToken.findMany({
      where: { userId: user.userId, isRevoked: false },
      select: { id: true, deviceHash: true, createdAt: true, expiresAt: true }
    });
    return res.json({ sessions });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch sessions.' });
  }
});

router.delete('/sessions/:sessionId', authGuard, async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  try {
    await prisma.refreshToken.updateMany({
      where: { id: req.params.sessionId, userId: user.userId },
      data: { isRevoked: true }
    });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to revoke session.' });
  }
});

router.get('/export', authGuard, async (req: RequestWithUser, res: Response) => {
  const userPayload = req.user!;
  try {
    const data = await prisma.user.findUnique({
      where: { id: userPayload.userId },
      include: {
        settings: true,
        achievements: { include: { achievement: true } },
        badges: { include: { badge: true } },
        auditLogs: true
      }
    });
    return res.json({ export: data });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.delete('/delete', authGuard, async (req: RequestWithUser, res: Response) => {
  const userPayload = req.user!;
  try {
    await prisma.user.delete({ where: { id: userPayload.userId } });
    await prisma.auditLog.create({
      data: { action: 'GDPR_DELETE', description: `Account deletion for User ID: ${userPayload.userId}` }
    });
    return res.json({ status: 'success', message: 'Account deleted permanently.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/notifications', authGuard, async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    return res.json({ notifications });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

router.post('/notifications/read', authGuard, async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  const { notificationId } = req.body;

  try {
    if (notificationId) {
      await prisma.notification.updateMany({
        where: { id: notificationId, userId: user.userId },
        data: { isRead: true }
      });
    } else {
      await prisma.notification.updateMany({
        where: { userId: user.userId },
        data: { isRead: true }
      });
    }
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update notifications.' });
  }
});

export default router;
