"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauth2Client = void 0;
exports.getGoogleAuthUrl = getGoogleAuthUrl;
exports.getTokensFromCode = getTokensFromCode;
exports.verifyGoogleIdToken = verifyGoogleIdToken;
const google_auth_library_1 = require("google-auth-library");
const googleClientId = process.env.GOOGLE_CLIENT_ID || 'mock-google-client-id';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || 'mock-google-client-secret';
const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/api/v1/auth/google/callback';
exports.oauth2Client = new google_auth_library_1.OAuth2Client(googleClientId, googleClientSecret, googleCallbackUrl);
/**
 * Generate Google OAuth 2.0 Consent URL
 */
function getGoogleAuthUrl(state) {
    return exports.oauth2Client.generateAuthUrl({
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
async function getTokensFromCode(code) {
    const { tokens } = await exports.oauth2Client.getToken(code);
    return tokens;
}
/**
 * Verify Google ID Token and extract profile payload
 */
async function verifyGoogleIdToken(idToken) {
    const ticket = await exports.oauth2Client.verifyIdToken({
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
