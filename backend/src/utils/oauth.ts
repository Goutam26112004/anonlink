import { OAuth2Client } from 'google-auth-library';

const googleClientId = process.env.GOOGLE_CLIENT_ID || 'mock-google-client-id';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || 'mock-google-client-secret';

const resolveCallbackUrl = (): string => {
  if (process.env.GOOGLE_CALLBACK_URL) {
    return process.env.GOOGLE_CALLBACK_URL;
  }
  const baseUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:4000';
  const cleanUrl = baseUrl.replace(/\/+$/, '');
  return `${cleanUrl}/api/v1/auth/google/callback`;
};

const googleCallbackUrl = resolveCallbackUrl();

export const oauth2Client = new OAuth2Client(
  googleClientId,
  googleClientSecret,
  googleCallbackUrl
);

/**
 * Generate Google OAuth 2.0 Consent URL
 */
export function getGoogleAuthUrl(state: string): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'openid'
    ],
    state,
    prompt: 'select_account'
  });
}

/**
 * Exchange Authorization Code for Tokens
 */
export async function getTokensFromCode(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Verify Google ID Token and extract profile payload
 */
export async function verifyGoogleIdToken(idToken: string) {
  const ticket = await oauth2Client.verifyIdToken({
    idToken,
    audience: googleClientId
  });
  
  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error('Google ID token verification failed: empty payload');
  }
  
  return {
    googleId: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified === true,
    name: payload.name || '',
    picture: payload.picture || null
  };
}
