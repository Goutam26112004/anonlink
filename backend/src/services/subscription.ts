import { prisma } from '../config/db.js';
import { redisClient } from '../config/redis.js';

export const SubscriptionService = {
  /**
   * Get the current active subscription for a user (checks expiry).
   */
  async getActiveSubscription(userId: string): Promise<any> {
    const now = new Date();
    const sub = await prisma.userSubscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        expiresAt: { gt: now }
      },
      include: { plan: true },
      orderBy: { expiresAt: 'desc' }
    });
    return sub;
  },

  /**
   * Check if a user has a specific feature enabled.
   * Global Redis flags take priority over subscription plan flags.
   */
  async isFeatureEnabled(userId: string, feature: 'voice' | 'video' | 'genderFilter'): Promise<boolean> {
    // Check global feature flags first
    if (feature === 'voice') {
      const globalFlag = await redisClient.get('feature:voice_enabled');
      if (globalFlag === '0') return false;
    }
    if (feature === 'video') {
      const globalFlag = await redisClient.get('feature:video_enabled');
      if (globalFlag === '0') return false;
    }

    // Check active subscription
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.userType !== 'PAID') return false;

    const sub = await this.getActiveSubscription(userId);
    if (!sub) return false;

    if (feature === 'voice') return sub.plan.isVoiceEnabled;
    if (feature === 'video') return sub.plan.isVideoEnabled;
    if (feature === 'genderFilter') return true;

    return false;
  },

  /**
   * Expire stale subscriptions — called by scheduler every 5 minutes.
   */
  async expireStaleSubscriptions(): Promise<number> {
    const now = new Date();
    const expired = await prisma.userSubscription.findMany({
      where: { status: 'ACTIVE', expiresAt: { lte: now } }
    });

    if (expired.length === 0) return 0;

    const expiredIds = expired.map((s: any) => s.id);
    const userIds = [...new Set(expired.map((s: any) => s.userId))] as string[];

    await prisma.userSubscription.updateMany({
      where: { id: { in: expiredIds } },
      data: { status: 'EXPIRED' }
    });

    for (const sub of expired) {
      await prisma.subscriptionHistory.create({
        data: {
          userId: sub.userId,
          planId: sub.planId,
          status: 'EXPIRED',
          purchasedAt: sub.purchasedAt,
          expiredAt: now,
          transactionRef: sub.transactionRef
        }
      });
    }

    // Downgrade user type for users without any remaining active subscriptions
    for (const userId of userIds) {
      const activeSub = await this.getActiveSubscription(userId);
      if (!activeSub) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const newType = user?.registrationType === 'GUEST' ? 'GUEST' : 'FREE';
        await prisma.user.update({ where: { id: userId }, data: { userType: newType } });
      }
    }

    return expired.length;
  },

  /**
   * Manually create a subscription — admin provisioning, no payment required.
   */
  async createManualSubscription(userId: string, planId: string, adminId: string, transactionRef?: string) {
    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error('Plan not found');

    const now = new Date();
    const expiresAt = new Date(now.getTime() + plan.validityDays * 24 * 60 * 60 * 1000);

    // Cancel any existing active subscriptions
    await prisma.userSubscription.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: { status: 'CANCELLED' }
    });

    const subscription = await prisma.userSubscription.create({
      data: {
        userId,
        planId,
        status: 'ACTIVE',
        purchasedAt: now,
        expiresAt,
        grantedByAdmin: true,
        transactionRef: transactionRef || null
      },
      include: { plan: true }
    });

    await prisma.user.update({ where: { id: userId }, data: { userType: 'PAID' } });

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'SUBSCRIPTION_GRANTED',
        description: `Admin granted ${plan.type} plan to user ${userId}. Expires: ${expiresAt.toISOString()}`
      }
    });

    return subscription;
  }
};
