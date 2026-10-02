import { prisma } from '../config/db.js';
import { redisClient } from '../config/redis.js';

/**
 * Data Cleanup Service
 * 
 * Definitions:
 * - Guest = user without a username (registrationType GUEST or no username set)
 * - User = has a username set
 * - Verified = Google auth users (registrationType OAUTH)
 */
export class CleanupService {

  /**
   * Delete a guest user and all their data immediately (called on logout)
   */
  static async deleteGuestUser(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return false;
      // Only delete if they have no username (guest definition)
      if (user.username) return false;

      await prisma.user.delete({ where: { id: userId } });
      await redisClient.del(`active_socket:${userId}`);
      console.log(`[Cleanup] Deleted guest user: ${userId}`);
      return true;
    } catch (e) {
      console.error('[Cleanup] Error deleting guest user:', e);
      return false;
    }
  }

  /**
   * Delete anonymous (non-DIRECT) chat messages after a chat session ends.
   * Private/DM chats (type=DIRECT) are preserved.
   */
  static async deleteAnonymousChatMessages(roomId: string): Promise<number> {
    try {
      const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
      if (!room || room.type === 'DIRECT') return 0;

      const result = await prisma.privateMessage.deleteMany({ where: { roomId } });
      await prisma.chatRoomMember.deleteMany({ where: { roomId } });
      await prisma.chatRoom.delete({ where: { id: roomId } }).catch(() => {});
      console.log(`[Cleanup] Deleted ${result.count} messages from room ${roomId}`);
      return result.count;
    } catch (e) {
      console.error('[Cleanup] Error deleting chat messages:', e);
      return 0;
    }
  }

  /**
   * Delete ALL guest accounts (no username).
   * Used by admin manual cleanup — ignores TTL.
   * Only deletes users who are currently OFFLINE.
   */
  static async deleteAllGuests(): Promise<number> {
    try {
      const guests = await prisma.user.findMany({
        where: {
          username: null,
          status: { not: 'ONLINE' },
        },
        select: { id: true },
      });

      if (guests.length === 0) return 0;

      for (const guest of guests) {
        await prisma.user.delete({ where: { id: guest.id } }).catch(() => {});
        await redisClient.del(`active_socket:${guest.id}`);
      }

      console.log(`[Cleanup] Deleted ${guests.length} guest accounts (no username)`);
      return guests.length;
    } catch (e) {
      console.error('[Cleanup] Error deleting guests:', e);
      return 0;
    }
  }

  /**
   * Delete guest accounts that have been offline for X hours (scheduled task).
   */
  static async deleteStaleGuests(): Promise<number> {
    const ttlHours = await this.getConfigValue('guest_ttl_hours', 24);
    const cutoff = new Date(Date.now() - ttlHours * 60 * 60 * 1000);
    try {
      const staleGuests = await prisma.user.findMany({
        where: {
          username: null, // Guest = no username
          status: { not: 'ONLINE' },
          lastSeen: { lt: cutoff },
        },
        select: { id: true },
      });

      if (staleGuests.length === 0) return 0;

      for (const guest of staleGuests) {
        await prisma.user.delete({ where: { id: guest.id } }).catch(() => {});
        await redisClient.del(`active_socket:${guest.id}`);
      }

      console.log(`[Cleanup] Deleted ${staleGuests.length} stale guest accounts (>${ttlHours}h)`);
      return staleGuests.length;
    } catch (e) {
      console.error('[Cleanup] Error deleting stale guests:', e);
      return 0;
    }
  }

  /**
   * Delete registered accounts inactive for X days.
   * Only deletes: non-admin, non-paid, non-subscribed users with a username.
   */
  static async deleteInactiveAccounts(days?: number): Promise<number> {
    const inactiveDays = days || await this.getConfigValue('inactive_days', 7);
    const cutoff = new Date(Date.now() - inactiveDays * 24 * 60 * 60 * 1000);

    try {
      const autoDeleteEnabled = await this.getConfigValue('auto_delete_inactive', 1);
      if (!autoDeleteEnabled && !days) return 0; // Skip if auto-delete disabled (unless manual with days param)

      const inactiveUsers = await prisma.user.findMany({
        where: {
          lastSeen: { lt: cutoff },
          username: { not: null }, // Only registered users (have username)
          userType: { not: 'PAID' },
          role: { name: 'USER' },
          subscriptions: { none: { status: 'ACTIVE' } },
        },
        select: { id: true, username: true, email: true },
      });

      if (inactiveUsers.length === 0) return 0;

      for (const user of inactiveUsers) {
        await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
        await redisClient.del(`active_socket:${user.id}`);
      }

      console.log(`[Cleanup] Deleted ${inactiveUsers.length} inactive accounts (>${inactiveDays} days)`);
      return inactiveUsers.length;
    } catch (e) {
      console.error('[Cleanup] Error deleting inactive accounts:', e);
      return 0;
    }
  }

  /**
   * Get a system config value
   */
  static async getConfigValue(key: string, defaultValue: number): Promise<number> {
    try {
      const config = await prisma.systemConfig.findUnique({ where: { key } });
      return config ? parseInt(config.value) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  /**
   * Set a system config value
   */
  static async setConfigValue(key: string, value: string): Promise<void> {
    await prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
}
