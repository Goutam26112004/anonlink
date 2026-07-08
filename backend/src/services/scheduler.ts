import { TempMediaService } from './tempMedia.js';
import { SubscriptionService } from './subscription.js';

export function startScheduler() {
  // Clean up expired temp images every 30 seconds
  setInterval(async () => {
    try {
      const count = await TempMediaService.cleanupExpiredMedia();
      if (count > 0) console.log(`[Scheduler] Cleaned ${count} expired media file(s).`);
    } catch (e) {
      console.error('[Scheduler] Media cleanup error:', e);
    }
  }, 30_000);

  // Expire stale subscriptions every 5 minutes
  setInterval(async () => {
    try {
      const count = await SubscriptionService.expireStaleSubscriptions();
      if (count > 0) console.log(`[Scheduler] Expired ${count} subscription(s).`);
    } catch (e) {
      console.error('[Scheduler] Subscription expiry error:', e);
    }
  }, 5 * 60_000);

  console.log('[Scheduler] Started: media cleanup (30s), subscription expiry (5min).');
}
