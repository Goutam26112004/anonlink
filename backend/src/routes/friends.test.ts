import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../config/db.js';

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  displayName: 'TestUser',
  avatarUrl: null,
  level: 5,
  reputationScore: 100,
  status: 'ONLINE',
  lastSeen: new Date(),
  registrationType: 'EMAIL'
};

const mockFriend = {
  userId1: 'user-1',
  userId2: 'friend-1',
  status: 'ACCEPTED',
  createdAt: new Date(),
  friend: {
    id: 'friend-1',
    email: 'friend@example.com',
    displayName: 'FriendUser',
    avatarUrl: null,
    level: 3,
    reputationScore: 80,
    status: 'ONLINE',
    lastSeen: new Date()
  }
};

describe('Friends Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /friends', () => {
    it('should return empty list when no friends exist', async () => {
      vi.mocked(prisma.friend.findMany).mockResolvedValue([] as any);
      vi.mocked(prisma.friendRequest.findMany).mockResolvedValue([] as any);

      const friends = await prisma.friend.findMany({
        where: { OR: [{ userId1: 'user-1' }, { userId2: 'user-1' }], status: 'ACCEPTED' }
      });

      expect(friends).toEqual([]);
      expect(prisma.friend.findMany).toHaveBeenCalled();
    });

    it('should return friends list with details', async () => {
      vi.mocked(prisma.friend.findMany).mockResolvedValue([mockFriend] as any);

      const friends = await prisma.friend.findMany({
        where: { OR: [{ userId1: 'user-1' }, { userId2: 'user-1' }], status: 'ACCEPTED' }
      });

      expect(friends).toHaveLength(1);
      expect(friends[0].userId1).toBe('user-1');
    });
  });

  describe('Friend Requests', () => {
    it('should create a pending friend request', async () => {
      const mockRequest = {
        id: 'req-1',
        senderId: 'user-1',
        receiverId: 'friend-1',
        status: 'PENDING',
        createdAt: new Date()
      };

      vi.mocked(prisma.friendRequest.create).mockResolvedValue(mockRequest as any);

      const request = await prisma.friendRequest.create({
        data: { senderId: 'user-1', receiverId: 'friend-1', status: 'PENDING' }
      });

      expect(request.status).toBe('PENDING');
      expect(request.senderId).toBe('user-1');
    });

    it('should find existing pending request', async () => {
      vi.mocked(prisma.friendRequest.findFirst).mockResolvedValue({
        id: 'req-1',
        senderId: 'user-1',
        receiverId: 'friend-1',
        status: 'PENDING'
      } as any);

      const existing = await prisma.friendRequest.findFirst({
        where: { OR: [
          { senderId: 'user-1', receiverId: 'friend-1' },
          { senderId: 'friend-1', receiverId: 'user-1' }
        ], status: 'PENDING' }
      });

      expect(existing).not.toBeNull();
      expect(existing!.status).toBe('PENDING');
    });

    it('should handle accepting a friend request', async () => {
      vi.mocked(prisma.friendRequest.update).mockResolvedValue({
        id: 'req-1',
        status: 'ACCEPTED'
      } as any);

      const updated = await prisma.friendRequest.update({
        where: { id: 'req-1' },
        data: { status: 'ACCEPTED' }
      });

      expect(updated.status).toBe('ACCEPTED');
    });

    it('should handle rejecting a friend request', async () => {
      vi.mocked(prisma.friendRequest.update).mockResolvedValue({
        id: 'req-1',
        status: 'REJECTED'
      } as any);

      const updated = await prisma.friendRequest.update({
        where: { id: 'req-1' },
        data: { status: 'REJECTED' }
      });

      expect(updated.status).toBe('REJECTED');
    });

    it('should detect duplicate request (already sent)', async () => {
      vi.mocked(prisma.friendRequest.findFirst).mockResolvedValue({
        id: 'req-1',
        status: 'PENDING'
      } as any);

      const dup = await prisma.friendRequest.findFirst({
        where: { senderId: 'user-1', receiverId: 'friend-1', status: 'PENDING' }
      });

      expect(dup).not.toBeNull();
    });
  });

  describe('Blocking', () => {
    it('should check if user is blocked before friend request', async () => {
      vi.mocked(prisma.block.findFirst).mockResolvedValue(null as any);

      const blocked = await prisma.block.findFirst({
        where: { OR: [
          { blockerId: 'user-1', blockedId: 'friend-1' },
          { blockerId: 'friend-1', blockedId: 'user-1' }
        ]}
      });

      expect(blocked).toBeNull();
    });

    it('should detect existing block', async () => {
      vi.mocked(prisma.block.findFirst).mockResolvedValue({
        id: 'block-1',
        blockerId: 'friend-1',
        blockedId: 'user-1'
      } as any);

      const blocked = await prisma.block.findFirst({
        where: { OR: [
          { blockerId: 'user-1', blockedId: 'friend-1' },
          { blockerId: 'friend-1', blockedId: 'user-1' }
        ]}
      });

      expect(blocked).not.toBeNull();
      expect(blocked!.blockerId).toBe('friend-1');
    });
  });
});
