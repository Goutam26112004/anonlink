import { Router, Response } from 'express';
import { prisma } from '../config/db.js';
import { authGuard, RequestWithUser } from '../middleware/auth.js';

const router = Router();

// Restrict friends routes to registered users
const registeredOnly = (req: RequestWithUser, res: Response, next: any) => {
  if (!req.user || !req.user.isRegistered) {
    return res.status(403).json({ error: 'Forbidden: Guests cannot use social/friend features.' });
  }
  next();
};

router.use(authGuard, registeredOnly);

/**
 * List accepted friends
 */
router.get('/', async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  try {
    const friends = await prisma.friend.findMany({
      where: {
        OR: [
          { userId1: user.userId, status: 'ACCEPTED' },
          { userId2: user.userId, status: 'ACCEPTED' }
        ]
      }
    });
    
    // Map to get peer details
    const friendDetails = await Promise.all(
      friends.map(async (f: { userId1: string; userId2: string }) => {
        const friendId = f.userId1 === user.userId ? f.userId2 : f.userId1;
        const details = await prisma.user.findUnique({
          where: { id: friendId },
          select: { id: true, email: true, level: true, reputationScore: true }
        });
        return details;
      })
    );

    return res.json({ friends: friendDetails.filter(Boolean) });
  } catch (error) {
    console.error('Friends fetch error:', error);
    return res.status(500).json({ error: 'Failed to retrieve friends list' });
  }
});

/**
 * Send Friend Request
 */
router.post('/request', async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  const { friendEmail } = req.body;

  if (!friendEmail) {
    return res.status(400).json({ error: 'Friend email is required.' });
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { email: friendEmail }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (targetUser.id === user.userId) {
      return res.status(400).json({ error: 'You cannot add yourself.' });
    }

    // Check existing request
    const existing = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId1: user.userId, userId2: targetUser.id },
          { userId1: targetUser.id, userId2: user.userId }
        ]
      }
    });

    if (existing) {
      return res.status(409).json({ error: 'Friend relationship or request already exists.' });
    }

    const newRequest = await prisma.friend.create({
      data: {
        userId1: user.userId,
        userId2: targetUser.id,
        status: 'PENDING'
      }
    });

    return res.status(201).json({ request: newRequest });
  } catch (error) {
    console.error('Friend request error:', error);
    return res.status(500).json({ error: 'Failed to send friend request' });
  }
});

/**
 * Accept Friend Request
 */
router.post('/accept', async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  const { requestId } = req.body;

  if (!requestId) return res.status(400).json({ error: 'Request ID required.' });

  try {
    const request = await prisma.friend.findUnique({
      where: { id: requestId }
    });

    if (!request || request.userId2 !== user.userId || request.status !== 'PENDING') {
      return res.status(400).json({ error: 'Invalid or unauthorized friend request.' });
    }

    const updated = await prisma.friend.update({
      where: { id: requestId },
      data: { status: 'ACCEPTED' }
    });

    return res.json({ relationship: updated });
  } catch (error) {
    console.error('Accept request error:', error);
    return res.status(500).json({ error: 'Failed to accept request' });
  }
});

/**
 * Reject / Cancel Request
 */
router.post('/reject', async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  const { requestId } = req.body;

  if (!requestId) return res.status(400).json({ error: 'Request ID required.' });

  try {
    const request = await prisma.friend.findUnique({
      where: { id: requestId }
    });

    if (!request || (request.userId1 !== user.userId && request.userId2 !== user.userId)) {
      return res.status(400).json({ error: 'Unauthorized.' });
    }

    await prisma.friend.delete({
      where: { id: requestId }
    });

    return res.json({ message: 'Request removed.' });
  } catch (error) {
    console.error('Reject request error:', error);
    return res.status(500).json({ error: 'Failed to reject request' });
  }
});

export default router;
