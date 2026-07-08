import { Router, Response } from 'express';
import { prisma } from '../config/db.js';
import { authGuard, RequestWithUser } from '../middleware/auth.js';
import { MatchmakerService } from '../services/matchmaker.js';

const router = Router();

const registeredOnly = (req: RequestWithUser, res: Response, next: any) => {
  if (!req.user || !req.user.isRegistered) {
    return res.status(403).json({ error: 'Forbidden: Guests cannot use social features.' });
  }
  next();
};

router.use(authGuard, registeredOnly);

router.get('/', async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  try {
    const friendRelations = await prisma.friend.findMany({
      where: {
        OR: [
          { userId1: user.userId, status: 'ACCEPTED' },
          { userId2: user.userId, status: 'ACCEPTED' }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    const friendDetails = await Promise.all(
      friendRelations.map(async (f: any) => {
        const friendId = f.userId1 === user.userId ? f.userId2 : f.userId1;
        const details = await prisma.user.findUnique({
          where: { id: friendId },
          select: {
            id: true, email: true, level: true, reputationScore: true,
            displayName: true, avatarUrl: true, status: true, lastSeen: true
          }
        });
        if (!details) return null;
        return {
          id: f.id,
          userId: details.id,
          email: details.email,
          displayName: details.displayName,
          avatarUrl: details.avatarUrl,
          level: details.level,
          reputationScore: details.reputationScore,
          status: details.status,
          lastSeen: details.lastSeen.toISOString(),
          friendSince: f.createdAt.toISOString(),
          isFavorite: f.isFavorite,
          note: f.note
        };
      })
    );

    return res.json({ friends: friendDetails.filter(Boolean) });
  } catch (error) {
    console.error('Friends fetch error:', error);
    return res.status(500).json({ error: 'Failed to retrieve friends list' });
  }
});

router.get('/requests', async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  try {
    const sent = await prisma.friendRequest.findMany({
      where: { senderId: user.userId },
      include: {
        receiver: { select: { id: true, email: true, displayName: true, avatarUrl: true, level: true, status: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const received = await prisma.friendRequest.findMany({
      where: { receiverId: user.userId },
      include: {
        sender: { select: { id: true, email: true, displayName: true, avatarUrl: true, level: true, status: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      sent: sent.map((r: any) => ({
        id: r.id,
        senderId: r.senderId,
        receiverId: r.receiverId,
        status: r.status,
        receiver: r.receiver,
        createdAt: r.createdAt.toISOString()
      })),
      received: received.map((r: any) => ({
        id: r.id,
        senderId: r.senderId,
        receiverId: r.receiverId,
        status: r.status,
        sender: r.sender,
        createdAt: r.createdAt.toISOString()
      }))
    });
  } catch (error) {
    console.error('Friend requests fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch friend requests' });
  }
});

router.get('/requests/incoming', async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  try {
    const received = await prisma.friendRequest.findMany({
      where: { receiverId: user.userId, status: 'PENDING' },
      include: {
        sender: { select: { id: true, email: true, displayName: true, avatarUrl: true, level: true, status: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      requests: received.map((r: any) => ({
        id: r.id,
        senderId: r.senderId,
        receiverId: r.receiverId,
        status: r.status,
        sender: r.sender,
        createdAt: r.createdAt.toISOString()
      }))
    });
  } catch (error) {
    console.error('Incoming requests fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch incoming requests' });
  }
});

router.get('/requests/outgoing', async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  try {
    const sent = await prisma.friendRequest.findMany({
      where: { senderId: user.userId, status: 'PENDING' },
      include: {
        receiver: { select: { id: true, email: true, displayName: true, avatarUrl: true, level: true, status: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      requests: sent.map((r: any) => ({
        id: r.id,
        senderId: r.senderId,
        receiverId: r.receiverId,
        status: r.status,
        receiver: r.receiver,
        createdAt: r.createdAt.toISOString()
      }))
    });
  } catch (error) {
    console.error('Outgoing requests fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch outgoing requests' });
  }
});

router.post('/requests/:requestId/accept', async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  const { requestId } = req.params;

  try {
    const request = await prisma.friendRequest.findUnique({ where: { id: requestId } });
    if (!request || request.receiverId !== user.userId || request.status !== 'PENDING') {
      return res.status(400).json({ error: 'Invalid or unauthorized friend request.' });
    }

    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'ACCEPTED' }
    });

    await prisma.friend.create({
      data: {
        userId1: request.senderId,
        userId2: request.receiverId,
        status: 'ACCEPTED'
      }
    });

    let chatRoom = await prisma.chatRoom.findFirst({
      where: {
        type: 'private',
        members: {
          every: {
            userId: { in: [request.senderId, request.receiverId] }
          }
        }
      }
    });

    if (!chatRoom) {
      chatRoom = await prisma.chatRoom.create({
        data: {
          type: 'private',
          members: {
            create: [
              { userId: request.senderId },
              { userId: request.receiverId }
            ]
          }
        }
      });
    }

    const io = req.app.get('io');
    const senderSocketId = await MatchmakerService.getActiveSocket(request.senderId);
    if (senderSocketId && io) {
      const receiverInfo = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { id: true, email: true, displayName: true, avatarUrl: true, level: true, status: true }
      });
      io.to(senderSocketId).emit('friend:request_accepted', {
        requestId: request.id,
        chatRoomId: chatRoom.id,
        friend: receiverInfo
      });
    }

    const receiverInfo = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { id: true, email: true, displayName: true, avatarUrl: true, level: true, status: true }
    });

    return res.json({
      success: true,
      chatRoomId: chatRoom.id,
      friend: receiverInfo
    });
  } catch (error) {
    console.error('Accept request error:', error);
    return res.status(500).json({ error: 'Failed to accept request' });
  }
});

router.post('/requests/:requestId/reject', async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  const { requestId } = req.params;

  try {
    const request = await prisma.friendRequest.findUnique({ where: { id: requestId } });
    if (!request || request.receiverId !== user.userId || request.status !== 'PENDING') {
      return res.status(400).json({ error: 'Invalid or unauthorized request.' });
    }

    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' }
    });

    const io = req.app.get('io');
    const senderSocketId = await MatchmakerService.getActiveSocket(request.senderId);
    if (senderSocketId && io) {
      io.to(senderSocketId).emit('friend:request_rejected', {
        requestId: request.id
      });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Reject request error:', error);
    return res.status(500).json({ error: 'Failed to reject request' });
  }
});

router.post('/requests/:requestId/cancel', async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  const { requestId } = req.params;

  try {
    const request = await prisma.friendRequest.findUnique({ where: { id: requestId } });
    if (!request || request.senderId !== user.userId || request.status !== 'PENDING') {
      return res.status(400).json({ error: 'Invalid or unauthorized request.' });
    }

    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED' }
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Cancel request error:', error);
    return res.status(500).json({ error: 'Failed to cancel request' });
  }
});

router.post('/request', async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  let { receiverId, friendEmail } = req.body;

  if (!receiverId && !friendEmail) {
    return res.status(400).json({ error: 'receiverId or friendEmail is required.' });
  }

  if (friendEmail && !receiverId) {
    const target = await prisma.user.findUnique({ where: { email: friendEmail } });
    if (!target) {
      return res.status(404).json({ error: 'User with that email not found.' });
    }
    receiverId = target.id;
  }

  if (!receiverId) {
    return res.status(400).json({ error: 'Could not resolve receiver.' });
  }

  if (receiverId === user.userId) {
    return res.status(400).json({ error: 'You cannot send a friend request to yourself.' });
  }

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const blocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: user.userId, blockedId: receiverId },
          { blockerId: receiverId, blockedId: user.userId }
        ]
      }
    });
    if (blocked) {
      return res.status(403).json({ error: 'Cannot send friend request. User is blocked.' });
    }

    const existingFriend = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId1: user.userId, userId2: receiverId },
          { userId1: receiverId, userId2: user.userId }
        ],
        status: 'ACCEPTED'
      }
    });
    if (existingFriend) {
      return res.status(409).json({ error: 'Already friends with this user.' });
    }

    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: user.userId, receiverId },
          { senderId: receiverId, receiverId: user.userId }
        ],
        status: 'PENDING'
      }
    });
    if (existingRequest) {
      return res.status(409).json({ error: 'Friend request already pending.' });
    }

    const friendRequest = await prisma.friendRequest.create({
      data: {
        senderId: user.userId,
        receiverId,
        status: 'PENDING'
      }
    });

    const io = req.app.get('io');
    const receiverSocketId = await MatchmakerService.getActiveSocket(receiverId);
    if (receiverSocketId && io) {
      const senderInfo = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { id: true, email: true, displayName: true, avatarUrl: true, level: true, status: true }
      });
      io.to(receiverSocketId).emit('friend:request_received', {
        id: friendRequest.id,
        senderId: user.userId,
        receiverId,
        status: 'PENDING',
        sender: senderInfo,
        createdAt: friendRequest.createdAt.toISOString()
      });
    }

    return res.status(201).json({
      id: friendRequest.id,
      senderId: friendRequest.senderId,
      receiverId: friendRequest.receiverId,
      status: friendRequest.status,
      createdAt: friendRequest.createdAt.toISOString()
    });
  } catch (error) {
    console.error('Friend request error:', error);
    return res.status(500).json({ error: 'Failed to send friend request' });
  }
});



router.delete('/:friendId', async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  const { friendId } = req.params;

  try {
    const friendRel = await prisma.friend.findFirst({
      where: {
        id: friendId,
        OR: [
          { userId1: user.userId },
          { userId2: user.userId }
        ]
      }
    });

    if (!friendRel) {
      return res.status(404).json({ error: 'Friend relationship not found.' });
    }

    await prisma.friend.delete({ where: { id: friendId } });

    return res.json({ success: true });
  } catch (error) {
    console.error('Remove friend error:', error);
    return res.status(500).json({ error: 'Failed to remove friend' });
  }
});

router.post('/:friendId/favorite', async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  const { friendId } = req.params;
  const { isFavorite } = req.body;

  try {
    const friendRel = await prisma.friend.findFirst({
      where: {
        id: friendId,
        OR: [{ userId1: user.userId }, { userId2: user.userId }]
      }
    });
    if (!friendRel) return res.status(404).json({ error: 'Friend not found.' });

    const updated = await prisma.friend.update({
      where: { id: friendId },
      data: { isFavorite: !!isFavorite }
    });

    return res.json({ success: true, isFavorite: updated.isFavorite });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update favorite.' });
  }
});

router.post('/:friendId/note', async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  const { friendId } = req.params;
  const { note } = req.body;

  try {
    const friendRel = await prisma.friend.findFirst({
      where: {
        id: friendId,
        OR: [{ userId1: user.userId }, { userId2: user.userId }]
      }
    });
    if (!friendRel) return res.status(404).json({ error: 'Friend not found.' });

    const updated = await prisma.friend.update({
      where: { id: friendId },
      data: { note: note || null }
    });

    return res.json({ success: true, note: updated.note });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update note.' });
  }
});

router.get('/blocked', async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  try {
    const blocks = await prisma.block.findMany({
      where: { blockerId: user.userId },
      include: {
        blocked: { select: { id: true, email: true, displayName: true, avatarUrl: true, level: true, status: true } }
      }
    });

    return res.json({
      blocked: blocks.map((b: any) => ({
        id: b.id,
        blockedId: b.blockedId,
        user: b.blocked,
        createdAt: b.createdAt.toISOString()
      }))
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch blocked users.' });
  }
});

router.post('/unblock', async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  const { blockedId } = req.body;

  if (!blockedId) return res.status(400).json({ error: 'blockedId required.' });

  try {
    await prisma.block.deleteMany({
      where: { blockerId: user.userId, blockedId }
    });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to unblock user.' });
  }
});

export default router;
