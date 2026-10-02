import { Router, Response } from 'express';
import { prisma } from '../config/db.js';
import { authGuard, RequestWithUser } from '../middleware/auth.js';

const router = Router();
router.use(authGuard);

/**
 * POST /api/v1/tickets
 * Create a support ticket
 */
router.post('/', async (req: RequestWithUser, res: Response) => {
  const userId = req.user!.userId;
  const { subject, description, category, priority } = req.body;

  if (!subject || !description) {
    return res.status(400).json({ error: 'Subject and description are required.' });
  }

  if (subject.length > 200 || description.length > 2000) {
    return res.status(400).json({ error: 'Subject max 200 chars, description max 2000 chars.' });
  }

  const validCategories = ['GENERAL', 'BUG', 'ACCOUNT', 'BILLING', 'SAFETY'];
  const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

  try {
    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        subject: subject.trim().slice(0, 200),
        description: description.trim().slice(0, 2000),
        category: validCategories.includes(category) ? category : 'GENERAL',
        priority: validPriorities.includes(priority) ? priority : 'MEDIUM',
      }
    });

    return res.status(201).json({ ticket });
  } catch (e: any) {
    return res.status(500).json({ error: 'Failed to create ticket.' });
  }
});

/**
 * GET /api/v1/tickets
 * List user's own tickets
 */
router.get('/', async (req: RequestWithUser, res: Response) => {
  const userId = req.user!.userId;

  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return res.json({ tickets });
  } catch (e: any) {
    return res.status(500).json({ error: 'Failed to fetch tickets.' });
  }
});

/**
 * GET /api/v1/tickets/:id
 * Get single ticket detail
 */
router.get('/:id', async (req: RequestWithUser, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  try {
    const ticket = await prisma.supportTicket.findFirst({
      where: { id, userId },
    });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });
    return res.json({ ticket });
  } catch (e: any) {
    return res.status(500).json({ error: 'Failed to fetch ticket.' });
  }
});

/**
 * POST /api/v1/tickets/appeal
 * Create an appeal (for bans/mutes)
 */
router.post('/appeal', async (req: RequestWithUser, res: Response) => {
  const userId = req.user!.userId;
  const { reason } = req.body;

  if (!reason || reason.length < 20) {
    return res.status(400).json({ error: 'Appeal reason must be at least 20 characters.' });
  }

  try {
    // Check if user already has a pending appeal
    const existing = await prisma.appeal.findFirst({
      where: { userId, status: 'PENDING' }
    });
    if (existing) {
      return res.status(409).json({ error: 'You already have a pending appeal.' });
    }

    const appeal = await prisma.appeal.create({
      data: {
        userId,
        reason: reason.trim().slice(0, 2000),
      }
    });

    return res.status(201).json({ appeal });
  } catch (e: any) {
    return res.status(500).json({ error: 'Failed to create appeal.' });
  }
});

/**
 * GET /api/v1/tickets/appeals/mine
 * Get user's own appeals
 */
router.get('/appeals/mine', async (req: RequestWithUser, res: Response) => {
  const userId = req.user!.userId;

  try {
    const appeals = await prisma.appeal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return res.json({ appeals });
  } catch (e: any) {
    return res.status(500).json({ error: 'Failed to fetch appeals.' });
  }
});

export default router;
