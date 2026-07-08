import { Response, NextFunction } from 'express';
import { RequestWithUser } from './auth.js';
import { SubscriptionService } from '../services/subscription.js';

export const requireFeature = (feature: 'voice' | 'video' | 'genderFilter') => {
  return async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const enabled = await SubscriptionService.isFeatureEnabled(user.userId, feature);
    if (!enabled) {
      return res.status(403).json({
        error: 'Feature not available',
        message: feature === 'voice' || feature === 'video'
          ? 'This feature requires an active paid subscription.'
          : 'Gender preference requires an active paid subscription.',
        requiredPlan: 'PAID',
        upgradeUrl: '/subscription'
      });
    }
    next();
  };
};
