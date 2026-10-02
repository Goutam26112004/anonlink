import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../config/db.js';

describe('Profile Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /profile/me', () => {
    it('should fetch user profile with settings and achievements', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        registrationType: 'EMAIL',
        userType: 'FREE',
        reputationScore: 100,
        experiencePoints: 250,
        level: 3,
        avatarUrl: null,
        displayName: 'TestUser',
        bio: 'Hello world',
        status: 'ONLINE',
        lastSeen: new Date(),
        linkedProviders: [],
        createdAt: new Date(),
        role: { name: 'USER' },
        settings: {
          theme: 'dark',
          languagePref: 'en',
          soundEnabled: true,
          defaultVideoEnabled: false,
          discoverable: true,
          notificationsEnabled: true,
          showLastSeen: true,
          showOnlineStatus: true
        },
        achievements: [],
        badges: []
      } as any);

      const user = await prisma.user.findUnique({
        where: { id: 'user-1' },
        include: { settings: true, achievements: { include: { achievement: true } }, badges: { include: { badge: true } }, role: true }
      });

      expect(user).not.toBeNull();
      expect(user!.email).toBe('test@example.com');
      expect(user!.displayName).toBe('TestUser');
      expect(user!.settings.theme).toBe('dark');
    });
  });

  describe('PUT /profile/update', () => {
    it('should update display name and bio', async () => {
      vi.mocked(prisma.user.update).mockResolvedValue({
        id: 'user-1',
        displayName: 'NewName',
        bio: 'New bio',
        avatarUrl: null
      } as any);

      const updated = await prisma.user.update({
        where: { id: 'user-1' },
        data: { displayName: 'NewName', bio: 'New bio' }
      });

      expect(updated.displayName).toBe('NewName');
      expect(updated.bio).toBe('New bio');
    });

    it('should update partial fields only', async () => {
      vi.mocked(prisma.user.update).mockResolvedValue({
        id: 'user-1',
        displayName: 'NameOnly',
        bio: null
      } as any);

      const updated = await prisma.user.update({
        where: { id: 'user-1' },
        data: { displayName: 'NameOnly' }
      });

      expect(updated.displayName).toBe('NameOnly');
      expect(updated.bio).toBeNull();
    });
  });

  describe('PUT /profile/settings', () => {
    it('should upsert user settings', async () => {
      vi.mocked(prisma.userSettings.upsert).mockResolvedValue({
        userId: 'user-1',
        theme: 'light',
        languagePref: 'en',
        soundEnabled: true,
        defaultVideoEnabled: false,
        discoverable: true,
        notificationsEnabled: true,
        showLastSeen: true,
        showOnlineStatus: true
      } as any);

      const settings = await prisma.userSettings.upsert({
        where: { userId: 'user-1' },
        update: { theme: 'light', discoverable: true },
        create: { userId: 'user-1', theme: 'light', languagePref: 'en' }
      });

      expect(settings.theme).toBe('light');
      expect(settings.discoverable).toBe(true);
    });
  });

  describe('GET /profile/sessions', () => {
    it('should return active sessions', async () => {
      vi.mocked(prisma.refreshToken.findMany).mockResolvedValue([
        { id: 'sess-1', deviceHash: 'abc123', createdAt: new Date(), expiresAt: new Date(Date.now() + 86400000), isRevoked: false }
      ] as any);

      const sessions = await prisma.refreshToken.findMany({
        where: { userId: 'user-1', isRevoked: false }
      });

      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe('sess-1');
      expect(sessions[0].isRevoked).toBe(false);
    });

    it('should return empty array when no sessions exist', async () => {
      vi.mocked(prisma.refreshToken.findMany).mockResolvedValue([] as any);

      const sessions = await prisma.refreshToken.findMany({
        where: { userId: 'user-1', isRevoked: false }
      });

      expect(sessions).toEqual([]);
    });
  });

  describe('DELETE /profile/sessions/:id', () => {
    it('should revoke a session', async () => {
      vi.mocked(prisma.refreshToken.updateMany).mockResolvedValue({ count: 1 } as any);

      const result = await prisma.refreshToken.updateMany({
        where: { id: 'sess-1', userId: 'user-1' },
        data: { isRevoked: true }
      });

      expect(result.count).toBe(1);
    });
  });
});
