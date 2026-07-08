import { Router, Response } from 'express';
import { prisma } from '../config/db.js';
import { authGuard, RequestWithUser } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/v1/onboarding/status
 * Returns whether onboarding has been completed for the current user.
 */
router.get('/status', authGuard, async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  try {
    const onboarding = await prisma.userOnboarding.findUnique({
      where: { userId: user.userId }
    });
    return res.json({
      completed: !!onboarding,
      data: onboarding ? { ageRange: onboarding.ageRange, gender: onboarding.gender } : null
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/v1/onboarding/complete
 * Saves the user's onboarding data (age range + gender).
 */
router.post('/complete', authGuard, async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  const { ageRange, gender } = req.body;

  const validAgeRanges = ['UNDER_18', 'AGE_18_24', 'AGE_25_34', 'AGE_35_44', 'AGE_45_PLUS'];
  const validGenders = ['MALE', 'FEMALE', 'PREFER_NOT_TO_SAY'];

  if (!ageRange || !validAgeRanges.includes(ageRange)) {
    return res.status(400).json({ error: 'Invalid age range. Must be one of: ' + validAgeRanges.join(', ') });
  }
  if (!gender || !validGenders.includes(gender)) {
    return res.status(400).json({ error: 'Invalid gender. Must be one of: ' + validGenders.join(', ') });
  }

  try {
    const onboarding = await prisma.userOnboarding.upsert({
      where: { userId: user.userId },
      create: { userId: user.userId, ageRange, gender },
      update: { ageRange, gender, completedAt: new Date() }
    });
    return res.json({ success: true, onboarding });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
