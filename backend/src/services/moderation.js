import { redisClient } from '../config/redis.js';
// Common profanity words list for fallback
const BANNED_WORDS = new Set([
    'fuck', 'shit', 'asshole', 'bitch', 'cunt', 'dick', 'cock', 'pussy', 'bastard', 'nigger', 'faggot'
]);
// Common scam/phishing patterns (e.g. cashapp, telegram referral links, discord invitations)
const SCAM_PATTERNS = [
    /t\.me\/\+?[a-zA-Z0-9_-]+/i,
    /discord\.gg\/[a-zA-Z0-9]+/i,
    /bit\.ly\/[a-zA-Z0-9]+/i,
    /whatsapp\.com\/\S+/i,
    /free\s*coins/i,
    /double\s*your\s*money/i,
    /cashapp/i,
    /giveaway/i
];
export class ModerationService {
    /**
     * Scan text for profanity, scams, and links.
     */
    static checkContent(text) {
        const trimmed = text.trim();
        if (!trimmed) {
            return { allowed: true, cleanedText: '' };
        }
        // Check scam keywords
        for (const pattern of SCAM_PATTERNS) {
            if (pattern.test(trimmed)) {
                return { allowed: false, reason: 'Scam or suspicious links detected' };
            }
        }
        // Simple profanity filter
        const words = trimmed.split(/\s+/);
        let dirty = false;
        const cleanedWords = words.map((word) => {
            const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
            if (BANNED_WORDS.has(cleanWord)) {
                dirty = true;
                return '*'.repeat(word.length);
            }
            return word;
        });
        return {
            allowed: true,
            cleanedText: cleanedWords.join(' ')
        };
    }
    /**
     * Track message frequency in Redis to prevent spam/flood.
     * Limit: Max 5 messages in 3 seconds.
     */
    static async isSpamming(userId) {
        const key = `spam:${userId}`;
        const count = await redisClient.incr(key);
        if (count === 1) {
            await redisClient.expire(key, 3);
        }
        if (count > 5) {
            return true;
        }
        return false;
    }
    /**
     * Check for duplicate messages sent consecutively.
     */
    static async isDuplicate(userId, text) {
        const key = `dup:${userId}`;
        const hash = Buffer.from(text.trim()).toString('base64');
        const lastHash = await redisClient.get(key);
        if (lastHash === hash) {
            return true;
        }
        await redisClient.set(key, hash, { EX: 10 }); // Cache for 10s
        return false;
    }
    /**
     * Check if user is currently muted or blocked from queueing.
     */
    static async isMuted(userId) {
        const key = `mute:${userId}`;
        const exists = await redisClient.exists(key);
        return exists === 1;
    }
    /**
     * Apply temporary mute.
     */
    static async muteUser(userId, durationSeconds) {
        const key = `mute:${userId}`;
        await redisClient.set(key, 'muted', { EX: durationSeconds });
    }
}
