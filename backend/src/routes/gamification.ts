import { Router, Response } from 'express';
import { prisma } from '../config/db.js';
import { authGuard, RequestWithUser } from '../middleware/auth.js';

const router = Router();

/**
 * 1. Retrieve User Stats
 */
router.get('/stats', authGuard, async (req: RequestWithUser, res: Response) => {
  const user = req.user!;

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        totalChats: true,
        voiceChats: true,
        videoChats: true,
        experiencePoints: true,
        level: true,
        reputationScore: true,
        createdAt: true
      }
    });

    return res.json({ stats: dbUser });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * 2. Retrieve Achievements List
 */
router.get('/achievements', authGuard, async (req: RequestWithUser, res: Response) => {
  const user = req.user!;

  try {
    const unlocked = await prisma.userAchievement.findMany({
      where: { userId: user.userId },
      include: { achievement: true }
    });

    return res.json({ achievements: unlocked.map((u) => u.achievement) });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * 3. Retrieve Badges List
 */
router.get('/badges', authGuard, async (req: RequestWithUser, res: Response) => {
  const user = req.user!;

  try {
    const badges = await prisma.userBadge.findMany({
      where: { userId: user.userId },
      include: { badge: true }
    });

    return res.json({ badges: badges.map((b) => b.badge) });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * 4. Toggle Favorite Friend
 */
router.post('/friends/:id/favorite', authGuard, async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;
  const { isFavorite } = req.body;

  try {
    const friendRelation = await prisma.friend.update({
      where: { id },
      data: { isFavorite: !!isFavorite }
    });

    return res.json({ status: 'success', friendRelation });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * 5. Update Friend Note
 */
router.post('/friends/:id/note', authGuard, async (req: RequestWithUser, res: Response) => {
  const { id } = req.params;
  const { note } = req.body;

  try {
    const friendRelation = await prisma.friend.update({
      where: { id },
      data: { note }
    });

    return res.json({ status: 'success', friendRelation });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
