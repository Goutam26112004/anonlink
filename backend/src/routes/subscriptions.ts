import { Router, Response } from 'express';
import { prisma } from '../config/db.js';
import { authGuard, RequestWithUser } from '../middleware/auth.js';
import { SubscriptionService } from '../services/subscription.js';
import { PaymentProviderFactory } from '../payment/paymentProvider.js';

const router = Router();

/**
 * GET /api/v1/subscriptions/plans
 * Returns all active subscription plans (public).
 */
router.get('/plans', async (_req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { priceInr: 'asc' }
    });
    return res.json({ plans });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/v1/subscriptions/my
 * Returns the current user's active subscription and history.
 */
router.get('/my', authGuard, async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  try {
    const active = await SubscriptionService.getActiveSubscription(user.userId);
    const history = await prisma.subscriptionHistory.findMany({
      where: { userId: user.userId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    let remainingSeconds: number | null = null;
    if (active) {
      remainingSeconds = Math.max(0, Math.floor((active.expiresAt.getTime() - Date.now()) / 1000));
    }

    return res.json({ active, remainingSeconds, history });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/v1/subscriptions/features
 * Returns the feature access flags for the current user.
 */
router.get('/features', authGuard, async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  try {
    const [canVoice, canVideo, canGenderFilter] = await Promise.all([
      SubscriptionService.isFeatureEnabled(user.userId, 'voice'),
      SubscriptionService.isFeatureEnabled(user.userId, 'video'),
      SubscriptionService.isFeatureEnabled(user.userId, 'genderFilter')
    ]);
    return res.json({ canVoice, canVideo, canGenderFilter });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/v1/subscriptions/initiate
 * Initiates the subscription purchase flow (payment stub).
 * Payment gateway integration will be added in a future phase.
 */
router.post('/initiate', authGuard, async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  const { planId } = req.body;

  if (!planId) return res.status(400).json({ error: 'planId is required' });

  try {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId, isActive: true } });
    if (!plan) return res.status(404).json({ error: 'Plan not found or inactive' });

    // Attempt to create payment order via configured provider
    try {
      const provider = PaymentProviderFactory.getProvider();
      const order = await provider.createOrder(Number(plan.priceInr), 'INR', {
        userId: user.userId,
        planId,
        planType: plan.type
      });
      return res.json({ order, plan });
    } catch (paymentError: any) {
      // Payment gateway not configured — return coming soon response
      return res.status(503).json({
        error: 'PAYMENT_NOT_CONFIGURED',
        message: 'Payment gateway integration coming soon. Contact admin for manual subscription activation.',
        plan: { id: plan.id, type: plan.type, priceInr: plan.priceInr }
      });
    }
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
