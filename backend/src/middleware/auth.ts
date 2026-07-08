import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';

export interface RequestWithUser extends Request {
  user?: {
    userId: string;
    email: string | null;
    registrationType: 'guest' | 'email' | 'oauth';
    isRegistered: boolean;
    reputationScore: number;
    level: number;
  };
}

export const authGuard = (req: RequestWithUser, res: Response, next: NextFunction) => {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.access_token) {
    token = req.cookies.access_token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Access token missing' });
  }

  try {
    const decoded = verifyToken(token) as any;
    req.user = {
      userId: decoded.userId,
      email: decoded.email || null,
      registrationType: decoded.registrationType || 'email',
      isRegistered: decoded.registrationType !== 'guest',
      reputationScore: decoded.reputationScore ?? 100,
      level: decoded.level ?? 1
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};
