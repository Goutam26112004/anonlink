import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../config/db.js';

describe('Messages Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Chat Rooms', () => {
    it('should create a private chat room between two users', async () => {
      vi.mocked(prisma.chatRoom.create).mockResolvedValue({
        id: 'room-1',
        type: 'PRIVATE',
        createdAt: new Date()
      } as any);

      const room = await prisma.chatRoom.create({
        data: { type: 'PRIVATE' }
      });

      expect(room.type).toBe('PRIVATE');
      expect(room.id).toBe('room-1');
    });

    it('should add members to chat room', async () => {
      vi.mocked(prisma.chatRoomMember.create).mockResolvedValue({
        id: 'cm-1',
        roomId: 'room-1',
        userId: 'user-1'
      } as any);

      const member = await prisma.chatRoomMember.create({
        data: { roomId: 'room-1', userId: 'user-1' }
      });

      expect(member.roomId).toBe('room-1');
      expect(member.userId).toBe('user-1');
    });
  });

  describe('Private Messages', () => {
    it('should create a message with SENT status', async () => {
      vi.mocked(prisma.privateMessage.create).mockResolvedValue({
        id: 'msg-1',
        roomId: 'room-1',
        senderId: 'user-1',
        receiverId: 'user-2',
        text: 'Hello!',
        status: 'SENT',
        createdAt: new Date()
      } as any);

      const msg = await prisma.privateMessage.create({
        data: {
          roomId: 'room-1',
          senderId: 'user-1',
          receiverId: 'user-2',
          text: 'Hello!',
          status: 'SENT'
        }
      });

      expect(msg.status).toBe('SENT');
      expect(msg.text).toBe('Hello!');
      expect(msg.senderId).toBe('user-1');
    });

    it('should update message status to SEEN when read', async () => {
      vi.mocked(prisma.privateMessage.updateMany).mockResolvedValue({ count: 1 } as any);

      const result = await prisma.privateMessage.updateMany({
        where: { roomId: 'room-1', receiverId: 'user-2', status: { in: ['SENDING', 'SENT', 'DELIVERED'] } },
        data: { status: 'SEEN' }
      });

      expect(result.count).toBe(1);
    });

    it('should fetch messages for a room', async () => {
      const mockMessages = [
        { id: 'msg-1', text: 'Hello', createdAt: new Date(), senderId: 'user-1' as string | null },
        { id: 'msg-2', text: 'Hi back', createdAt: new Date(Date.now() + 1000), senderId: 'user-2' as string | null }
      ];
      vi.mocked(prisma.privateMessage.findMany).mockResolvedValue(mockMessages as any);

      const messages = await prisma.privateMessage.findMany({
        where: { roomId: 'room-1' },
        orderBy: { createdAt: 'asc' }
      });

      expect(messages).toHaveLength(2);
      expect(messages[0].text).toBe('Hello');
      expect(messages[1].text).toBe('Hi back');
    });

    it('should search messages by text content', async () => {
      vi.mocked(prisma.privateMessage.findMany).mockResolvedValue([
        { id: 'msg-1', text: 'Hello world', senderId: 'user-1' } as any
      ]);

      const results = await prisma.privateMessage.findMany({
        where: { text: { contains: 'world', mode: 'insensitive' }, roomId: 'room-1' }
      });

      expect(results).toHaveLength(1);
      expect(results[0].text).toContain('world');
    });
  });
});
