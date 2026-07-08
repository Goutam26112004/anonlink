import { Router, Response } from 'express';
import argon2 from 'argon2';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/db.js';
import { redisClient } from '../config/redis.js';
import { generateToken, verifyToken } from '../utils/jwt.js';
import { authGuard, RequestWithUser } from '../middleware/auth.js';
import { verifyGoogleIdToken, getGoogleAuthUrl, getTokensFromCode } from '../utils/oauth.js';

const router = Router();

/**
 * Helper to ensure the USER role exists.
 */
const getOrCreateUserRoleId = async () => {
  let role = await prisma.role.findFirst({
    where: { name: 'USER' }
  });
  if (!role) {
    role = await prisma.role.create({
      data: { name: 'USER' }
    });
  }
  return role.id;
};

/**
 * Guest Login
 */
router.post('/guest', async (req, res) => {
  try {
    const roleId = await getOrCreateUserRoleId();
    const guestId = uuidv4();
    const guestUser = await prisma.user.create({
      data: {
        id: guestId,
        registrationType: 'GUEST',
        userType: 'GUEST',
        roleId,
        settings: {
          create: {
            theme: 'dark',
            languagePref: 'en'
          }
        }
      }
    });

    const token = generateToken({
      userId: guestUser.id,
      registrationType: 'guest',
      reputationScore: 100,
      level: 1
    }, '24h');

    return res.json({
      token,
      user: {
        userId: guestUser.id,
        registrationType: 'GUEST',
        userType: 'GUEST',
        reputationScore: 100,
        level: 1,
        onboardingComplete: false
      }
    });
  } catch (error) {
    console.error('Guest login error:', error);
    return res.status(500).json({ error: 'Failed to create guest session' });
  }
});

/**
 * Register User
 */
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password || password.length < 6) {
    return res.status(400).json({ error: 'Email and valid password (min 6 chars) are required.' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const passwordHash = await argon2.hash(password);
    const roleId = await getOrCreateUserRoleId();

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        registrationType: 'EMAIL',
        roleId,
        settings: {
          create: {
            theme: 'dark',
            languagePref: 'en'
          }
        }
      }
    });

    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      registrationType: 'email',
      reputationScore: 100,
      level: 1
    }, '7d');

    return res.status(201).json({
      token,
      user: {
        userId: newUser.id,
        email: newUser.email,
        registrationType: 'EMAIL',
        userType: 'FREE',
        reputationScore: 100,
        level: 1,
        onboardingComplete: false
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal registration error' });
  }
});

/**
 * Login User
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // Check if account is currently locked out
    const isLocked = await redisClient.get(`lockout:${email}`);
    if (isLocked) {
      return res.status(429).json({ error: 'Too many failed attempts. Account locked out for 15 minutes.' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { settings: true, onboarding: true }
    });

    if (!user || !user.passwordHash) {
      await registerFailedAttempt(email);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      await registerFailedAttempt(email);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Success: clear failed attempts
    await redisClient.del(`failed_attempts:${email}`);

    const token = generateToken({
      userId: user.id,
      email: user.email,
      registrationType: 'email',
      reputationScore: user.reputationScore,
      level: user.level
    }, '7d');

    return res.json({
      token,
      user: {
        userId: user.id,
        email: user.email,
        registrationType: user.registrationType,
        userType: user.userType,
        reputationScore: user.reputationScore,
        level: user.level,
        onboardingComplete: !!user.onboarding
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal login error' });
  }
});

/**
 * Register Failed Login Attempt
 */
async function registerFailedAttempt(email: string) {
  const attemptsStr = await redisClient.get(`failed_attempts:${email}`);
  const attempts = attemptsStr ? parseInt(attemptsStr) + 1 : 1;

  if (attempts >= 5) {
    // Lock out user for 15 minutes (900 seconds)
    await redisClient.set(`lockout:${email}`, 'true', { EX: 900 });
    await redisClient.del(`failed_attempts:${email}`);
  } else {
    await redisClient.set(`failed_attempts:${email}`, attempts.toString(), { EX: 900 });
  }
}

/**
 * Helper to issue JWT Access Token and Refresh Token, store refresh token, and set HTTP-only cookies
 */
async function issueAuthTokens(res: Response, user: any, userAgent: string) {
  // Generate Access Token (JWT, 15m)
  const accessToken = generateToken({
    userId: user.id,
    email: user.email,
    registrationType: user.googleId ? 'oauth' : 'email',
    reputationScore: user.reputationScore,
    level: user.level
  }, '15m');

  // Generate Refresh Token (UUID, 7d)
  const refreshTokenString = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  // Compute device hash
  const deviceHash = crypto.createHash('sha256').update(userAgent || '').digest('hex');

  // Store in DB
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshTokenString,
      deviceHash,
      expiresAt
    }
  });

  // Set HTTP-only secure cookies
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  res.cookie('refresh_token', refreshTokenString, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return { accessToken, refreshToken: refreshTokenString };
}

/**
 * GET /google
 * Initiates the Google OAuth 2.0 flow
 */
router.get('/google', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000 // 10 minutes
  });

  const authUrl = getGoogleAuthUrl(state);
  return res.redirect(authUrl);
});

/**
 * GET /google/callback
 * Handles the redirect back from Google OAuth
 */
router.get('/google/callback', async (req, res) => {
  const { code, state } = req.query;
  const oauthStateCookie = req.cookies.oauth_state;

  // Clear state cookie
  res.clearCookie('oauth_state');

  if (!state || !oauthStateCookie || state !== oauthStateCookie) {
    return res.status(400).json({ error: 'CSRF validation failed: State mismatch or expired.' });
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Authorization code is missing.' });
  }

  try {
    const tokens = await getTokensFromCode(code);
    if (!tokens.id_token) {
      return res.status(400).json({ error: 'Failed to retrieve ID token from Google.' });
    }

    const googleUser = await verifyGoogleIdToken(tokens.id_token);
    
    // 1. Look up user by Google ID
    let user = await prisma.user.findUnique({
      where: { googleId: googleUser.googleId },
      include: { settings: true }
    });

    // 2. If not found by Google ID, look up by email
    if (!user && googleUser.email) {
      user = await prisma.user.findUnique({
        where: { email: googleUser.email },
        include: { settings: true }
      });

      if (user) {
        // Link Google ID to existing email account
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleUser.googleId,
            avatarUrl: googleUser.picture || user.avatarUrl,
            emailVerified: true,
            linkedProviders: {
              set: Array.from(new Set([...(user.linkedProviders || []), 'google']))
            }
          },
          include: { settings: true }
        });
      }
    }

    // 3. If still not found, create new user
    if (!user) {
      const roleId = await getOrCreateUserRoleId();
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          googleId: googleUser.googleId,
          avatarUrl: googleUser.picture,
          registrationType: 'OAUTH',
          authProvider: 'google',
          linkedProviders: ['google'],
          emailVerified: true,
          roleId,
          settings: {
            create: {
              theme: 'dark',
              languagePref: 'en'
            }
          }
        },
        include: { settings: true }
      });
    }

    // Issue tokens and cookies
    await issueAuthTokens(res, user, req.headers['user-agent'] || '');

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    // Check if onboarding is complete; redirect to onboarding screen if not
    const onboarding = await prisma.userOnboarding.findUnique({ where: { userId: user.id } });
    if (!onboarding) {
      return res.redirect(`${clientUrl}/onboarding`);
    }
    return res.redirect(`${clientUrl}/dashboard`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    return res.redirect(`${clientUrl}?error=google_auth_failed`);
  }
});

/**
 * GET /session
 * Restores session from active HTTP-only cookies
 */
router.get('/session', async (req, res) => {
  const accessToken = req.cookies.access_token;
  const refreshToken = req.cookies.refresh_token;

  try {
    // 1. Try verifying access token
    if (accessToken) {
      try {
        const decoded = verifyToken(accessToken) as any;
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: { onboarding: true }
        });
        if (user) {
          return res.json({
            token: accessToken,
            user: {
              userId: user.id,
              email: user.email,
              registrationType: user.registrationType,
              userType: user.userType,
              reputationScore: user.reputationScore,
              level: user.level,
              avatarUrl: user.avatarUrl,
              onboardingComplete: !!user.onboarding
            }
          });
        }
      } catch (err) {
        // Access token expired or invalid, fall through to refresh token
      }
    }

    // 2. Try verifying refresh token
    if (refreshToken) {
      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true }
      });

      if (tokenRecord && !tokenRecord.isRevoked && tokenRecord.expiresAt > new Date()) {
        // Revoke old refresh token (rotation)
        await prisma.refreshToken.update({
          where: { id: tokenRecord.id },
          data: { isRevoked: true }
        });

        // Issue new tokens & cookies
        const { accessToken: newAccessToken } = await issueAuthTokens(
          res,
          tokenRecord.user,
          req.headers['user-agent'] || ''
        );

        const onboarding = await prisma.userOnboarding.findUnique({
          where: { userId: tokenRecord.user.id }
        });

        return res.json({
          token: newAccessToken,
          user: {
            userId: tokenRecord.user.id,
            email: tokenRecord.user.email,
            registrationType: tokenRecord.user.registrationType,
            userType: tokenRecord.user.userType,
            reputationScore: tokenRecord.user.reputationScore,
            level: tokenRecord.user.level,
            avatarUrl: tokenRecord.user.avatarUrl,
            onboardingComplete: !!onboarding
          }
        });
      }
    }

    // Clear stale cookies
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('access_token', { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'lax' });
    res.clearCookie('refresh_token', { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'lax' });

    return res.status(401).json({ error: 'Session expired' });
  } catch (error) {
    console.error('Session retrieval error:', error);
    return res.status(500).json({ error: 'Failed to retrieve session' });
  }
});

/**
 * POST /google/link
 * Links the current logged in user with their Google profile
 */
router.post('/google/link', authGuard, async (req: RequestWithUser, res: Response) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ error: 'Google ID token is required' });
  }

  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const googleUser = await verifyGoogleIdToken(idToken);
    
    // Check if this Google ID is already linked to another user
    const existingLink = await prisma.user.findUnique({
      where: { googleId: googleUser.googleId }
    });

    if (existingLink) {
      return res.status(400).json({ error: 'This Google account is already linked to another user.' });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'Current user not found' });
    }

    // Update current user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        googleId: googleUser.googleId,
        avatarUrl: googleUser.picture || currentUser.avatarUrl,
        emailVerified: true,
        linkedProviders: {
          set: Array.from(new Set([...(currentUser.linkedProviders || []), 'google']))
        }
      }
    });

    return res.json({
      user: {
        userId: updatedUser.id,
        email: updatedUser.email,
        registrationType: updatedUser.registrationType,
        reputationScore: updatedUser.reputationScore,
        level: updatedUser.level,
        avatarUrl: updatedUser.avatarUrl,
        linkedProviders: updatedUser.linkedProviders
      }
    });
  } catch (error: any) {
    console.error('Account linking error:', error);
    return res.status(500).json({ error: error.message || 'Failed to link Google account' });
  }
});

/**
 * POST /google/unlink
 * Unlinks the Google profile from the logged in user
 */
router.post('/google/unlink', authGuard, async (req: RequestWithUser, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.googleId) {
      return res.status(400).json({ error: 'Google account is not linked' });
    }

    // Check if another login method remains available
    const hasPassword = user.passwordHash !== null;
    const otherProviders = (user.linkedProviders || []).filter(p => p !== 'google');
    const hasOtherLogin = hasPassword || otherProviders.length > 0;

    if (!hasOtherLogin) {
      return res.status(400).json({
        error: 'Cannot unlink Google. You must set a password or link another login method first.'
      });
    }

    // Perform unlinking
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        googleId: null,
        linkedProviders: {
          set: otherProviders
        }
      }
    });

    return res.json({
      user: {
        userId: updatedUser.id,
        email: updatedUser.email,
        registrationType: updatedUser.registrationType,
        reputationScore: updatedUser.reputationScore,
        level: updatedUser.level,
        avatarUrl: updatedUser.avatarUrl,
        linkedProviders: updatedUser.linkedProviders
      }
    });
  } catch (error: any) {
    console.error('Account unlinking error:', error);
    return res.status(500).json({ error: error.message || 'Failed to unlink Google account' });
  }
});

/**
 * POST /logout
 * Clears authentication cookies and revokes active refresh token
 */
router.post('/logout', async (req, res) => {
  const refreshToken = req.cookies.refresh_token;
  
  if (refreshToken) {
    try {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { isRevoked: true }
      });
    } catch (e) {
      console.error('Failed to revoke refresh token:', e);
    }
  }

  const isProduction = process.env.NODE_ENV === 'production';
  
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  });

  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  });

  return res.json({ success: true, message: 'Logged out successfully' });
});

export default router;

