import { redisClient } from '../config/redis.js';
import { prisma } from '../config/db.js';
// Configurable scoring weights (can be updated via API/Admin configs in future)
export const MATCH_CONFIG = {
    INTEREST_WEIGHT: 15,
    LANGUAGE_WEIGHT: 30,
    WAIT_TIME_WEIGHT: 2,
    MATCH_THRESHOLD: 40,
    FALLBACK_TIMEOUT_SEC: 10
};
export class MatchmakerService {
    /**
     * Get queue key based on communication type (Multiple waiting queues)
     */
    static getQueueKey(mediaType) {
        return `matchmaking:queue:${mediaType}`;
    }
    /**
     * Add a user to the matchmaking queue.
     */
    static async joinQueue(ticket) {
        const queueKey = this.getQueueKey(ticket.mediaType);
        const ticketStr = JSON.stringify(ticket);
        // Save ticket data and add User ID to the appropriate queue set
        await redisClient.hSet('matchmaking:tickets', ticket.userId, ticketStr);
        await redisClient.sAdd(queueKey, ticket.userId);
        // Track active connection stats
        await redisClient.incr(`matchmaking:stats:joins:${ticket.mediaType}`);
    }
    /**
     * Remove a user from the queue.
     */
    static async leaveQueue(userId, mediaType) {
        const queueKey = this.getQueueKey(mediaType);
        await redisClient.sRem(queueKey, userId);
        await redisClient.hDel('matchmaking:tickets', userId);
    }
    /**
     * Calculate matching score between two queue tickets.
     */
    static calculateScore(self, candidate, currentTime) {
        let score = 0;
        // 1. Interests Match
        const sharedInterests = self.interests.filter((i) => candidate.interests.includes(i));
        score += sharedInterests.length * MATCH_CONFIG.INTEREST_WEIGHT;
        if (self.language === candidate.language) {
            score += MATCH_CONFIG.LANGUAGE_WEIGHT;
        }
        // 3. Wait Time Booster (Starvation prevention)
        const selfWaitTime = currentTime - self.joinedAt;
        const candidateWaitTime = currentTime - candidate.joinedAt;
        score += (selfWaitTime + candidateWaitTime) * MATCH_CONFIG.WAIT_TIME_WEIGHT;
        return score;
    }
    /**
     * Find a suitable match in the queue.
     */
    static async findMatch(userId, mediaType) {
        const currentTime = Math.floor(Date.now() / 1000);
        const queueKey = this.getQueueKey(mediaType);
        // Retrieve own ticket
        const ticketData = await redisClient.hGet('matchmaking:tickets', userId);
        if (!ticketData)
            return null;
        const selfTicket = JSON.parse(ticketData);
        // Get all potential candidate IDs from the same queue
        const candidates = await redisClient.sMembers(queueKey);
        // Fetch filters and exclusions
        const blockedUserIds = await this.getBlockList(userId);
        const lastMatchedPeer = await redisClient.get(`last_peer:${userId}`);
        let bestCandidate = null;
        let highestScore = -Infinity;
        for (const candidateId of candidates) {
            if (candidateId === userId)
                continue;
            // Exclude blocks
            if (blockedUserIds.has(candidateId))
                continue;
            const isBlocked = await this.isBlockedBy(candidateId, userId);
            if (isBlocked)
                continue;
            // Exclude immediate rematches
            if (lastMatchedPeer === candidateId)
                continue;
            // Fetch candidate ticket
            const candidateData = await redisClient.hGet('matchmaking:tickets', candidateId);
            if (!candidateData)
                continue;
            const candidateTicket = JSON.parse(candidateData);
            // Exclude gender mismatch (if preference is set)
            if (!this.areGendersCompatible(selfTicket, candidateTicket))
                continue;
            // Exclude age range mismatch (if preference is set)
            if (!this.areAgesCompatible(selfTicket, candidateTicket))
                continue;
            // Compute match score
            const score = this.calculateScore(selfTicket, candidateTicket, currentTime);
            // Check if candidate exceeds threshold, or if we hit the fallback queue timeout
            const selfWaitTime = currentTime - selfTicket.joinedAt;
            const isTimeout = selfWaitTime > MATCH_CONFIG.FALLBACK_TIMEOUT_SEC;
            const threshold = isTimeout ? 0 : MATCH_CONFIG.MATCH_THRESHOLD;
            if (score >= threshold && score > highestScore) {
                highestScore = score;
                bestCandidate = candidateTicket;
            }
        }
        if (bestCandidate) {
            // Remove both from Redis queue
            await this.leaveQueue(userId, mediaType);
            await this.leaveQueue(bestCandidate.userId, mediaType);
            // Set cooldown limits to prevent immediate rematching (30 seconds)
            await redisClient.set(`last_peer:${userId}`, bestCandidate.userId, { EX: 30 });
            await redisClient.set(`last_peer:${bestCandidate.userId}`, userId, { EX: 30 });
            // Save match interval metrics
            await redisClient.set(`matchmaking:stats:last_match_time`, currentTime.toString());
            return bestCandidate;
        }
        return null;
    }
    /**
     * Get Queue Statistics (active length, matches per minute)
     */
    static async getQueueStats(mediaType) {
        const queueKey = this.getQueueKey(mediaType);
        const activeCount = await redisClient.sCard(queueKey);
        // Average time estimate: default 5s if queue is small, dynamically adjusts if busy
        const estimatedWaitSec = activeCount > 2 ? Math.floor(activeCount * 1.5) : 3;
        return { activeCount, estimatedWaitSec };
    }
    /**
     * Helper to retrieve user blocklist.
     */
    static async getBlockList(userId) {
        const blocks = await prisma.block.findMany({
            where: { blockerId: userId },
            select: { blockedId: true }
        });
        return new Set(blocks.map((b) => b.blockedId));
    }
    /**
     * Helper to check if candidate blocked user.
     */
    static async isBlockedBy(candidateId, userId) {
        const block = await prisma.block.findFirst({
            where: {
                blockerId: candidateId,
                blockedId: userId
            }
        });
        return block !== null;
    }
    /**
     * Helper to check mutual gender preference compatibility.
     */
    static areGendersCompatible(self, candidate) {
        const selfPref = self.genderPreference || 'NO_PREFERENCE';
        const candPref = candidate.genderPreference || 'NO_PREFERENCE';
        const selfGender = self.gender || 'PREFER_NOT_TO_SAY';
        const candGender = candidate.gender || 'PREFER_NOT_TO_SAY';
        // If self has preference, candidate gender must match self preference
        if (selfPref !== 'NO_PREFERENCE') {
            if (selfPref === 'MALE' && candGender !== 'MALE')
                return false;
            if (selfPref === 'FEMALE' && candGender !== 'FEMALE')
                return false;
        }
        // If candidate has preference, self gender must match candidate preference
        if (candPref !== 'NO_PREFERENCE') {
            if (candPref === 'MALE' && selfGender !== 'MALE')
                return false;
            if (candPref === 'FEMALE' && selfGender !== 'FEMALE')
                return false;
        }
        return true;
    }
    /**
     * Helper to check mutual age range compatibility.
     */
    static areAgesCompatible(self, candidate) {
        const selfRange = self.ageRange;
        const candRange = candidate.ageRange;
        // If neither has a preference, compatible
        if (!selfRange && !candRange)
            return true;
        // If self has a preference, candidate must match
        if (selfRange && candRange !== selfRange)
            return false;
        // If candidate has a preference, self must match
        if (candRange && selfRange !== candRange)
            return false;
        return true;
    }
    /**
     * Store active session info in Redis.
     */
    static async registerSession(userId, socketId) {
        await redisClient.set(`active_socket:${userId}`, socketId, { EX: 86400 });
    }
    static async getActiveSocket(userId) {
        return await redisClient.get(`active_socket:${userId}`);
    }
    static async removeActiveSocket(userId) {
        await redisClient.del(`active_socket:${userId}`);
    }
}
