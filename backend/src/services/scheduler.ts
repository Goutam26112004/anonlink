import { TempMediaService } from './tempMedia.js';
import { SubscriptionService } from './subscription.js';
import { CleanupService } from './cleanup.js';

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

  // Delete stale guest accounts every hour
  setInterval(async () => {
    try {
      const count = await CleanupService.deleteStaleGuests();
      if (count > 0) console.log(`[Scheduler] Cleaned ${count} stale guest account(s).`);
    } catch (e) {
      console.error('[Scheduler] Guest cleanup error:', e);
    }
  }, 60 * 60_000);

  // Delete inactive registered accounts daily (check every 6 hours)
  setInterval(async () => {
    try {
      const count = await CleanupService.deleteInactiveAccounts();
      if (count > 0) console.log(`[Scheduler] Deleted ${count} inactive account(s).`);
    } catch (e) {
      console.error('[Scheduler] Inactive account cleanup error:', e);
    }
  }, 6 * 60 * 60_000);

  console.log('[Scheduler] Started: media cleanup (30s), subscription expiry (5min), guest cleanup (1h), inactive accounts (6h).');
}
