import { Router, Response } from 'express';
import { prisma } from '../config/db.js';
import { authGuard, RequestWithUser } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(process.cwd(), 'tmp', 'friend-media');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, GIF, WebP images allowed.'));
  }
});

router.use(authGuard);

router.get('/rooms', async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  try {
    const memberships = await prisma.chatRoomMember.findMany({
      where: { userId: user.userId },
      include: {
        room: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true, email: true, displayName: true, avatarUrl: true,
                    level: true, status: true, lastSeen: true
                  }
                }
              }
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    const rooms = memberships.map((m: any) => {
      const room = m.room;
      const otherMember = room.members.find((mem: any) => mem.userId !== user.userId);
      const lastMsg = room.messages[0];
      return {
        id: room.id,
        type: room.type,
        otherUser: otherMember ? {
          id: otherMember.user.id,
          email: otherMember.user.email,
          displayName: otherMember.user.displayName,
          avatarUrl: otherMember.user.avatarUrl,
          level: otherMember.user.level,
          status: otherMember.user.status,
          lastSeen: otherMember.user.lastSeen.toISOString()
        } : null,
        lastMessage: lastMsg ? {
          id: lastMsg.id,
          text: lastMsg.text,
          senderId: lastMsg.senderId,
          status: lastMsg.status,
          createdAt: lastMsg.createdAt.toISOString()
        } : null,
        createdAt: room.createdAt.toISOString()
      };
    });

    rooms.sort((a: any, b: any) => {
      if (a.lastMessage && b.lastMessage) {
        return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
      }
      if (a.lastMessage) return -1;
      if (b.lastMessage) return 1;
      return 0;
    });

    return res.json({ rooms });
  } catch (error) {
    console.error('Chat rooms error:', error);
    return res.status(500).json({ error: 'Failed to fetch chat rooms.' });
  }
});

router.get('/rooms/:roomId', async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  const { roomId } = req.params;
  const { before, limit = '50' } = req.query;

  try {
    const member = await prisma.chatRoomMember.findFirst({
      where: { roomId, userId: user.userId }
    });
    if (!member) return res.status(403).json({ error: 'Access denied.' });

    const where: any = { roomId };
    if (before) where.createdAt = { lt: new Date(before as string) };

    const messages = await prisma.privateMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      include: {
        sender: { select: { id: true, displayName: true, avatarUrl: true } }
      }
    });

    return res.json({ messages: messages.reverse() });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

router.post('/rooms/:roomId/read', async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  const { roomId } = req.params;

  try {
    await prisma.privateMessage.updateMany({
      where: {
        roomId,
        receiverId: user.userId,
        status: { in: ['SENDING', 'SENT', 'DELIVERED'] }
      },
      data: { status: 'SEEN' }
    });

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to mark as read.' });
  }
});

router.post('/rooms/:roomId/image', upload.single('image'), async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  const { roomId } = req.params;

  if (!req.file) return res.status(400).json({ error: 'No image file provided.' });

  try {
    const member = await prisma.chatRoomMember.findFirst({
      where: { roomId, userId: user.userId }
    });
    if (!member) return res.status(403).json({ error: 'Access denied.' });

    const otherMember = await prisma.chatRoomMember.findFirst({
      where: { roomId, userId: { not: user.userId } }
    });
    if (!otherMember) return res.status(400).json({ error: 'No other user in room.' });

    const message = await prisma.privateMessage.create({
      data: {
        roomId,
        senderId: user.userId,
        receiverId: otherMember.userId,
        text: '',
        imageUrl: `/api/v1/messages/media/${req.file.filename}`,
        status: 'SENT'
      }
    });

    const io = req.app.get('io');
    const receiverSocketId = await (await import('../services/matchmaker.js')).MatchmakerService.getActiveSocket(otherMember.userId);
    if (receiverSocketId && io) {
      io.to(receiverSocketId).emit('private:message', {
        ...message,
        createdAt: message.createdAt.toISOString()
      });
      io.to(receiverSocketId).emit('private:delivered', { messageId: message.id, roomId });
    }

    return res.status(201).json({
      ...message,
      createdAt: message.createdAt.toISOString()
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to upload image.' });
  }
});

router.put('/:messageId', async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  const { messageId } = req.params;
  const { text } = req.body;

  if (!text || !text.trim()) return res.status(400).json({ error: 'Text is required.' });

  try {
    const message = await prisma.privateMessage.findUnique({ where: { id: messageId } });
    if (!message || message.senderId !== user.userId) {
      return res.status(403).json({ error: 'Cannot edit this message.' });
    }

    const updated = await prisma.privateMessage.update({
      where: { id: messageId },
      data: { text, editedAt: new Date() }
    });

    const io = req.app.get('io');
    const receiverSocketId = await (await import('../services/matchmaker.js')).MatchmakerService.getActiveSocket(message.receiverId);
    if (receiverSocketId && io) {
      io.to(receiverSocketId).emit('private:edited', {
        messageId: updated.id,
        roomId: updated.roomId,
        text: updated.text,
        editedAt: updated.editedAt?.toISOString()
      });
    }

    return res.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      editedAt: updated.editedAt?.toISOString()
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to edit message.' });
  }
});

router.delete('/:messageId', async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  const { messageId } = req.params;

  try {
    const message = await prisma.privateMessage.findUnique({ where: { id: messageId } });
    if (!message || message.senderId !== user.userId) {
      return res.status(403).json({ error: 'Cannot delete this message.' });
    }

    await prisma.privateMessage.update({
      where: { id: messageId },
      data: { deletedAt: new Date(), text: '' }
    });

    const io = req.app.get('io');
    const receiverSocketId = await (await import('../services/matchmaker.js')).MatchmakerService.getActiveSocket(message.receiverId);
    if (receiverSocketId && io) {
      io.to(receiverSocketId).emit('private:deleted', {
        messageId: message.id,
        roomId: message.roomId
      });
    }

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete message.' });
  }
});

router.get('/media/:filename', async (req, res) => {
  const filePath = path.join(process.cwd(), 'tmp', 'friend-media', req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found.' });
  res.sendFile(filePath);
});

router.get('/search', async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  const { q, roomId } = req.query;

  if (!q || (q as string).length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters.' });
  }

  try {
    const member = roomId ? await prisma.chatRoomMember.findFirst({
      where: { roomId: roomId as string, userId: user.userId }
    }) : null;
    if (roomId && !member) return res.status(403).json({ error: 'Access denied.' });

    const where: any = {
      text: { contains: q as string, mode: 'insensitive' },
      deletedAt: null
    };
    if (roomId) where.roomId = roomId as string;
    else {
      const userRoomIds = (await prisma.chatRoomMember.findMany({
        where: { userId: user.userId },
        select: { roomId: true }
      })).map((m: any) => m.roomId);
      where.roomId = { in: userRoomIds };
    }

    const messages = await prisma.privateMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return res.json({ messages });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to search messages.' });
  }
});

export default router;
