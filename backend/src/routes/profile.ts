import { Router, Response } from 'express';
import { prisma } from '../config/db.js';
import { authGuard, RequestWithUser } from '../middleware/auth.js';

const router = Router();

/**
 * Fetch Current User Settings & Profile
 */
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

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      userId: user.id,
      email: user.email,
      registrationType: user.registrationType,
      reputationScore: user.reputationScore,
      experiencePoints: user.experiencePoints,
      level: user.level,
      role: user.role?.name,
      settings: user.settings,
      achievements: user.achievements,
      badges: user.badges,
      avatarUrl: user.avatarUrl,
      linkedProviders: user.linkedProviders
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return res.status(500).json({ error: 'Failed to retrieve profile data' });
  }
});

/**
 * Update User Settings
 */
router.put('/settings', authGuard, async (req: RequestWithUser, res: Response) => {
  const userPayload = req.user;
  if (!userPayload) return res.status(401).json({ error: 'Unauthorized' });

  const { theme, languagePref, soundEnabled, defaultVideoEnabled, discoverable } = req.body;

  try {
    const updatedSettings = await prisma.userSettings.upsert({
      where: { userId: userPayload.userId },
      update: {
        theme,
        languagePref,
        soundEnabled,
        defaultVideoEnabled,
        discoverable
      },
      create: {
        userId: userPayload.userId,
        theme: theme || 'dark',
        languagePref: languagePref || 'en',
        soundEnabled: soundEnabled ?? true,
        defaultVideoEnabled: defaultVideoEnabled ?? false,
        discoverable: discoverable ?? true
      }
    });

    return res.json({ settings: updatedSettings });
  } catch (error) {
    console.error('Settings update error:', error);
    return res.status(500).json({ error: 'Failed to update user settings' });
  }
});

/**
 * GDPR: Right to Portability (Data Export)
 */
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

/**
 * GDPR: Right to be Forgotten (Account Deletion)
 */
router.delete('/delete', authGuard, async (req: RequestWithUser, res: Response) => {
  const userPayload = req.user!;
  try {
    // Delete user from database (cascades automatically delete settings, sessions, tokens, etc.)
    await prisma.user.delete({
      where: { id: userPayload.userId }
    });

    // Write audit log indicating account deletion (anonymized user ID logged)
    await prisma.auditLog.create({
      data: {
        action: 'GDPR_DELETE',
        description: `Account deletion executed for User ID: ${userPayload.userId}`
      }
    });

    return res.json({ status: 'success', message: 'Account and associated records deleted permanently.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
