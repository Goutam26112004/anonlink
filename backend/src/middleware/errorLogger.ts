import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';

/**
 * Global error logging middleware.
 * Captures unhandled errors, stores them in the database for admin review.
 */
export const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user?.userId || null;
  const statusCode = res.statusCode >= 400 ? res.statusCode : 500;

  // Log to database asynchronously (don't block response)
  prisma.errorLog.create({
    data: {
      userId,
      route: req.originalUrl || req.url,
      method: req.method,
      message: err.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack?.slice(0, 2000),
      statusCode,
      userAgent: req.headers['user-agent']?.slice(0, 500) || null,
      ip: (req.ip || req.headers['x-forwarded-for'] as string || '').slice(0, 45),
      metadata: JSON.stringify({
        body: Object.keys(req.body || {}).slice(0, 10),
        query: req.query,
      }).slice(0, 1000),
    }
  }).catch((e) => console.error('[ErrorLogger] Failed to log error:', e.message));

  // Send error response
  if (!res.headersSent) {
    res.status(statusCode).json({
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    });
  }
};

/**
 * Helper to manually log errors (for try/catch blocks)
 */
export async function logError(opts: {
  userId?: string;
  route?: string;
  method?: string;
  message: string;
  stack?: string;
  statusCode?: number;
  metadata?: Record<string, any>;
}) {
  try {
    await prisma.errorLog.create({
      data: {
        userId: opts.userId || null,
        route: opts.route || null,
        method: opts.method || null,
        message: opts.message,
        stack: opts.stack?.slice(0, 2000) || null,
        statusCode: opts.statusCode || 500,
        metadata: opts.metadata ? JSON.stringify(opts.metadata).slice(0, 1000) : null,
      }
    });
  } catch (e) {
    console.error('[ErrorLogger] Manual log failed:', e);
  }
}
