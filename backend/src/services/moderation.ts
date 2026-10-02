import { redisClient } from '../config/redis.js';

// ─── Banned Words ────────────────────────────────────────────────────────────
const BANNED_WORDS = new Set([
  'fuck', 'shit', 'asshole', 'bitch', 'cunt', 'dick', 'cock', 'pussy', 'bastard', 'nigger', 'faggot',
  'retard', 'whore', 'slut', 'kys', 'kill yourself'
]);

// ─── Scam/Phishing Patterns ──────────────────────────────────────────────────
const SCAM_PATTERNS = [
  /t\.me\/\+?[a-zA-Z0-9_-]+/i,
  /discord\.gg\/[a-zA-Z0-9]+/i,
  /bit\.ly\/[a-zA-Z0-9]+/i,
  /whatsapp\.com\/\S+/i,
  /free\s*coins/i,
  /double\s*your\s*money/i,
  /cashapp/i,
  /giveaway/i,
  /venmo/i,
  /paypal\.me/i,
  /crypto\s*invest/i,
  /send\s*(me\s*)?\$?\d+/i
];

// ─── Personal Information Patterns (PII Detection) ───────────────────────────
const PII_PATTERNS: { pattern: RegExp; type: string; reason: string }[] = [
  // Phone numbers (various formats: +91, +1, local, dashes, spaces)
  { pattern: /(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g, type: 'phone', reason: 'Phone numbers are not allowed for your safety.' },
  // Email addresses
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, type: 'email', reason: 'Email addresses are not allowed for your safety.' },
  // Social media handles (@username patterns that look like social handles)
  { pattern: /@[a-zA-Z0-9_]{3,30}\b/g, type: 'social_handle', reason: 'Social media handles are not allowed for your safety.' },
  // Instagram/Snapchat/TikTok explicit mentions
  { pattern: /\b(my\s+)?(insta(gram)?|snap(chat)?|tik\s*tok|twitter|facebook|fb|ig)\s*(is|:|-|@)?\s*@?[a-zA-Z0-9._]{2,}/gi, type: 'social_platform', reason: 'Sharing social media accounts is not allowed.' },
  // Full addresses (number + street patterns)
  { pattern: /\d{1,5}\s+[A-Za-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Place|Pl)\b/gi, type: 'address', reason: 'Physical addresses are not allowed for your safety.' },
  // URLs (http/https links)
  { pattern: /https?:\/\/[^\s]+/gi, type: 'url', reason: 'External links are not allowed in anonymous chat.' },
  // IP addresses
  { pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, type: 'ip_address', reason: 'IP addresses are not allowed.' },
  // Credit card patterns (basic)
  { pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, type: 'credit_card', reason: 'Financial information is not allowed for your safety.' },
  // "Add me on" / "Message me on" / "Find me at" patterns
  { pattern: /\b(add|find|message|dm|hit|text|call|reach)\s+(me|us)\s+(on|at|@)\b/gi, type: 'contact_solicitation', reason: 'Requesting to move to other platforms is not allowed.' },
  // WhatsApp/Telegram explicit number sharing
  { pattern: /\b(whatsapp|telegram|signal|wechat)\s*:?\s*\+?\d{5,}/gi, type: 'messaging_app', reason: 'Sharing messaging app details is not allowed.' },
];

// ─── Threat/Harassment Patterns ──────────────────────────────────────────────
const THREAT_PATTERNS = [
  /\b(i('ll|\s*will)\s+)?(kill|murder|hurt|harm|stab|shoot)\s+(you|u|ur|your)/gi,
  /\b(kys|kill\s*yourself|go\s*die)\b/gi,
  /\b(rape|molest|assault)\s+(you|u|her|him)/gi,
  /\b(bomb|threat|swat)\b/gi,
];

export interface ModerationResult {
  allowed: boolean;
  reason?: string;
  cleanedText?: string;
  type?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export class ModerationService {
  /**
   * Main content check — runs all moderation rules.
   * Returns {allowed: false} if the message should be BLOCKED (not sent).
   */
  public static checkContent(text: string): ModerationResult {
    const trimmed = text.trim();
    if (!trimmed) {
      return { allowed: true, cleanedText: '' };
    }

    // 1. Check threats (highest priority — immediate block)
    for (const pattern of THREAT_PATTERNS) {
      if (pattern.test(trimmed)) {
        return { allowed: false, reason: 'Threats and harassment are strictly prohibited.', type: 'threat', severity: 'critical' };
      }
    }

    // 2. Check personal information (block before sending)
    for (const { pattern, type, reason } of PII_PATTERNS) {
      // Reset lastIndex for global patterns
      pattern.lastIndex = 0;
      if (pattern.test(trimmed)) {
        return { allowed: false, reason, type, severity: 'high' };
      }
    }

    // 3. Check scam patterns
    for (const pattern of SCAM_PATTERNS) {
      if (pattern.test(trimmed)) {
        return { allowed: false, reason: 'Scam or suspicious content detected.', type: 'scam', severity: 'high' };
      }
    }

    // 4. Profanity filter (allow but censor)
    const words = trimmed.split(/\s+/);
    const cleanedWords = words.map((word) => {
      const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
      if (BANNED_WORDS.has(cleanWord)) {
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
  public static async isSpamming(userId: string): Promise<boolean> {
    const key = `spam:${userId}`;
    const count = await redisClient.incr(key);
    
    if (count === 1) {
      await redisClient.expire(key, 3);
    }

    return count > 5;
  }

  /**
   * Check for duplicate messages sent consecutively.
   */
  public static async isDuplicate(userId: string, text: string): Promise<boolean> {
    const key = `dup:${userId}`;
    const hash = Buffer.from(text.trim()).toString('base64');
    
    const lastHash = await redisClient.get(key);
    if (lastHash === hash) {
      return true;
    }

    await redisClient.set(key, hash, { EX: 10 });
    return false;
  }

  /**
   * Check if user is currently muted.
   */
  public static async isMuted(userId: string): Promise<boolean> {
    const key = `mute:${userId}`;
    const exists = await redisClient.exists(key);
    return exists === 1;
  }

  /**
   * Apply temporary mute.
   */
  public static async muteUser(userId: string, durationSeconds: number): Promise<void> {
    const key = `mute:${userId}`;
    await redisClient.set(key, 'muted', { EX: durationSeconds });
  }

  /**
   * Track moderation violations for a user.
   * After 3 violations in 1 hour, auto-mute for 5 minutes.
   * After 5 violations in 1 hour, auto-mute for 30 minutes.
   */
  public static async trackViolation(userId: string, type: string): Promise<{ autoMuted: boolean; muteDuration: number }> {
    const key = `violations:${userId}`;
    const count = await redisClient.incr(key);
    
    if (count === 1) {
      await redisClient.expire(key, 3600); // 1 hour window
    }

    if (count >= 5) {
      await this.muteUser(userId, 1800); // 30 min mute
      return { autoMuted: true, muteDuration: 1800 };
    } else if (count >= 3) {
      await this.muteUser(userId, 300); // 5 min mute
      return { autoMuted: true, muteDuration: 300 };
    }

    return { autoMuted: false, muteDuration: 0 };
  }
}
