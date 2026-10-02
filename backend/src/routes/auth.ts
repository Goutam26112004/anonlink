import { Router, Response } from 'express';
import argon2 from 'argon2';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/db.js';
import { redisClient } from '../config/redis.js';
import { generateToken, verifyToken } from '../utils/jwt.js';
import { authGuard, RequestWithUser } from '../middleware/auth.js';
import { verifyGoogleIdToken, getGoogleAuthUrl, getTokensFromCode } from '../utils/oauth.js';
import { verifyCaptcha } from '../services/captcha.js';

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
    }, '24h');

    return res.json({
      token,
      user: {
        userId: guestUser.id,
        registrationType: 'GUEST',
        userType: 'GUEST',
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
  const {
    email: rawEmail,
    password,
    captchaToken,
    fullName: rawFullName,
    displayName: rawDisplayName,
    username: rawUsername,
    ageRange,
    gender,
    dateOfBirth,
    marketingEmails
  } = req.body;

  // Sanitize inputs
  const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase().slice(0, 320) : '';
  const fullName = typeof rawFullName === 'string' ? rawFullName.trim().slice(0, 100) : '';
  const displayName = typeof rawDisplayName === 'string' ? rawDisplayName.trim().slice(0, 50) : '';
  const username = typeof rawUsername === 'string' ? rawUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30) : '';

  if (!email || !password || password.length < 6) {
    return res.status(400).json({ error: 'Email and valid password (min 6 chars) are required.' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  if (password.length > 128) {
    return res.status(400).json({ error: 'Password too long (max 128 chars).' });
  }

  if (!fullName || !displayName || !username) {
    return res.status(400).json({ error: 'Full name, display name, and username are required.' });
  }

  if (username && username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters.' });
  }

  if (!ageRange || !gender) {
    return res.status(400).json({ error: 'Age range and gender are required.' });
  }

  const captchaResult = await verifyCaptcha(captchaToken || '');
  if (!captchaResult.valid) {
    return res.status(400).json({ error: 'CAPTCHA verification failed. Please try again.' });
  }

  try {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    if (username) {
      const existingUsername = await prisma.user.findUnique({ where: { username } });
      if (existingUsername) {
        return res.status(409).json({ error: 'Username already taken.' });
      }
    }

    const passwordHash = await argon2.hash(password);
    const roleId = await getOrCreateUserRoleId();

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: fullName || null,
        username: username || null,
        displayName: displayName || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        registrationType: 'EMAIL',
        roleId,
        settings: {
          create: {
            theme: 'dark',
            languagePref: 'en',
            marketingEmails: marketingEmails === true
          }
        },
        onboarding: {
          create: {
            ageRange: ageRange as any,
            gender: gender as any
          }
        }
      },
      include: { settings: true, onboarding: true }
    });

    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      registrationType: 'email',
      reputationScore: 100
    }, '7d');

    return res.status(201).json({
      token,
      user: {
        userId: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        username: newUser.username,
        displayName: newUser.displayName,
        registrationType: 'EMAIL',
        userType: 'FREE',
        emailVerified: false,
        onboardingComplete: true
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
  const { email: rawEmail, password, username: rawUsername } = req.body;
  const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase().slice(0, 320) : '';
  const username = typeof rawUsername === 'string' ? rawUsername.trim().toLowerCase().slice(0, 30) : '';
  const identifier = email || username;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Username/email and password are required.' });
  }
  if (typeof password !== 'string' || password.length > 128) {
    return res.status(400).json({ error: 'Invalid password.' });
  }

  try {
    // Check if account is currently locked out
    const isLocked = await redisClient.get(`lockout:${identifier}`);
    if (isLocked) {
      return res.status(429).json({ error: 'Too many failed attempts. Account locked out for 15 minutes.' });
    }

    // Search by email or username
    let user;
    if (identifier.includes('@')) {
      user = await prisma.user.findUnique({
        where: { email: identifier },
        include: { settings: true, onboarding: true }
      });
    } else {
      user = await prisma.user.findUnique({
        where: { username: identifier },
        include: { settings: true, onboarding: true }
      });
    }

    if (!user || !user.passwordHash) {
      await registerFailedAttempt(identifier);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      await registerFailedAttempt(identifier);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Success: clear failed attempts
    await redisClient.del(`failed_attempts:${identifier}`);

    const token = generateToken({
      userId: user.id,
      email: user.email,
      registrationType: 'email',
    }, '7d');

    return res.json({
      token,
      user: {
        userId: user.id,
        username: user.username,
        email: user.email,
        registrationType: user.registrationType,
        userType: user.userType,
        emailVerified: user.emailVerified,
        onboardingComplete: !!user.onboarding
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal login error' });
  }
});

/**
 * POST /forgot-password
 * Generates a password reset token and stores it in Redis (15 min TTL).
 * In dev mode, returns the token directly.
 */
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    await redisClient.set(`reset_token:${token}`, JSON.stringify({ userId: user.id, email }), { EX: 900 });

    if (process.env.NODE_ENV !== 'production') {
      return res.json({ success: true, token, message: 'Dev mode: reset token returned.' });
    }

    return res.json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /reset-password
 * Validates reset token and updates the user's password.
 */
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password || password.length < 6) {
    return res.status(400).json({ error: 'Valid token and password (min 6 chars) are required.' });
  }

  try {
    const dataStr = await redisClient.get(`reset_token:${token}`);
    if (!dataStr) {
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    const { userId } = JSON.parse(dataStr);
    const passwordHash = await argon2.hash(password);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });

    await redisClient.del(`reset_token:${token}`);

    await prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true }
    });

    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /send-verification
 * Generates an email verification token (24h TTL).
 */
router.post('/send-verification', authGuard, async (req: RequestWithUser, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.emailVerified) {
      return res.json({ success: true, message: 'Email already verified.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    await redisClient.set(`verify_email:${token}`, JSON.stringify({ userId, email: user.email }), { EX: 86400 });

    if (process.env.NODE_ENV !== 'production') {
      return res.json({ success: true, token, message: 'Dev mode: verification token returned.' });
    }

    return res.json({ success: true, message: 'Verification email sent.' });
  } catch (error) {
    console.error('Send verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /verify-email
 * Validates verification token and marks email as verified.
 */
router.post('/verify-email', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Verification token is required.' });
  }

  try {
    const dataStr = await redisClient.get(`verify_email:${token}`);
    if (!dataStr) {
      return res.status(400).json({ error: 'Invalid or expired verification token.' });
    }

    const { userId } = JSON.parse(dataStr);

    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true }
    });

    await redisClient.del(`verify_email:${token}`);

    return res.json({ success: true, message: 'Email verified successfully.' });
  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).json({ error: 'Internal server error' });
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
    // If user already has username, they're fully set up - go to dashboard
    if (user.username) {
      return res.redirect(`${clientUrl}/dashboard`);
    }
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
              username: user.username,
              email: user.email,
              registrationType: user.registrationType,
              userType: user.userType,
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
            username: tokenRecord.user.username,
            email: tokenRecord.user.email,
            registrationType: tokenRecord.user.registrationType,
            userType: tokenRecord.user.userType,
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
    const otherProviders = (user.linkedProviders || []).filter((p: string) => p !== 'google');
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
router.post('/logout', authGuard, async (req: RequestWithUser, res: Response) => {
  const refreshToken = req.cookies.refresh_token;
  const userId = req.user?.userId;
  const isGuest = req.user?.registrationType === 'guest';
  
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

  // Delete guest account and all associated data on logout
  if (isGuest && userId) {
    const { CleanupService } = await import('../services/cleanup.js');
    await CleanupService.deleteGuestUser(userId);
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

/**
 * POST /auth/convert-guest — Convert guest account to full registration
 */
router.post('/convert-guest', authGuard, async (req: RequestWithUser, res: Response) => {
  const { username, password, displayName } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  if (!username || !password || password.length < 6) {
    return res.status(400).json({ error: 'Username and valid password (min 6 chars) are required.' });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters.' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return res.status(409).json({ error: 'Username already taken.' });
    }

    const passwordHash = await argon2.hash(password);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        displayName: displayName || username,
        passwordHash,
        registrationType: 'EMAIL',
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        registrationType: true,
        userType: true,
        avatarUrl: true,
        bio: true,
        status: true,
        lastSeen: true,
        onboarding: { select: { id: true } },
      }
    });

    const token = generateToken({
      userId: updated.id,
      email: updated.email || '',
      registrationType: updated.registrationType,
    });

    return res.json({
      user: {
        userId: updated.id,
        email: updated.email,
        registrationType: updated.registrationType,
        userType: updated.userType,
        displayName: updated.displayName,
        avatarUrl: updated.avatarUrl,
        bio: updated.bio,
        status: updated.status,
        lastSeen: updated.lastSeen?.toISOString() || null,
        onboardingComplete: !!updated.onboarding,
      },
      token
    });
  } catch (e) {
    console.error('Guest conversion error:', e);
    return res.status(500).json({ error: 'Failed to convert guest account.' });
  }
});

/**
 * GET /api/v1/auth/check-username/:username
 * Check if a username is available (public endpoint).
 */
router.get('/check-username/:username', async (req, res) => {
  const { username } = req.params;
  if (!username || username.length < 3) {
    return res.json({ available: false, reason: 'Username must be at least 3 characters.' });
  }
  try {
    const existing = await prisma.user.findUnique({ where: { username } });
    return res.json({ available: !existing });
  } catch (e: any) {
    return res.status(500).json({ available: false, reason: 'Server error.' });
  }
});

export default router;

