import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

const getJwtSecret = () => process.env.JWT_SECRET || 'supersecretkey123';

export interface AuthenticatedSocket extends Socket {
  data: {
    user?: {
      userId: string;
      email: string | null;
      registrationType: 'guest' | 'email' | 'oauth';
      isRegistered: boolean;
    };
  };
}

export const socketAuthMiddleware = (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

  if (!token) {
    return next(new Error('Authentication failed: Token missing'));
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as any;
    
    socket.data.user = {
      userId: decoded.userId,
      email: decoded.email || null,
      registrationType: decoded.registrationType || 'email',
      isRegistered: !!(decoded.registrationType && decoded.registrationType.toLowerCase() !== 'guest'),
    };

    next();
  } catch (error) {
    return next(new Error('Authentication failed: Invalid token'));
  }
};
