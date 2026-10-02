import { Router, Response } from 'express';
import crypto from 'crypto';
import { authGuard, RequestWithUser } from '../middleware/auth.js';

const router = Router();

const COTURN_SECRET = process.env.COTURN_SHARED_SECRET || 'coturnsecretkey123';
const TURN_URL = process.env.TURN_URL || 'turn:localhost:3478';
const STUN_URL = process.env.STUN_URL || 'stun:localhost:3478';

/**
 * Generate Ephemeral TURN Server Credentials (HMAC-SHA1 authentication)
 */
router.get('/credentials', authGuard, (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  const unixTimeStamp = Math.floor(Date.now() / 1000) + 86400; // 24 hour validity
  const username = `${unixTimeStamp}:${user.userId}`;
  
  // Calculate password using HMAC-SHA1
  const hmac = crypto.createHmac('sha1', COTURN_SECRET);
  hmac.update(username);
  const password = hmac.digest('base64');

  return res.json({
    iceServers: [
      {
        urls: [
          'stun:stun.l.google.com:19302',
          STUN_URL
        ]
      },
      {
        urls: [
          `${TURN_URL}?transport=udp`,
          `${TURN_URL}?transport=tcp`
        ],
        username,
        credential: password
      }
    ]
  });
});

export default router;
