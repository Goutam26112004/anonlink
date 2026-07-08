import { Response, NextFunction } from 'express';
import { RequestWithUser } from './auth.js';
import { prisma } from '../config/db.js';

export const requireRole = (allowedRoles: string[]) => {
  return async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        include: { role: true }
      });

      if (!dbUser || !allowedRoles.includes(dbUser.role.name.toUpperCase())) {
        return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
      }

      next();
    } catch (error) {
      return res.status(500).json({ error: 'Failed to verify user roles' });
    }
  };
};
