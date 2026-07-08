import { prisma } from '../config/db.js';
export class GamificationService {
    /**
     * Award XP to user and handle level-ups (Level up target: 100 * level points)
     */
    static async awardXp(userId, points) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return { levelUp: false, newLevel: 1, newXp: 0 };
        let newXp = user.experiencePoints + points;
        let level = user.level;
        let levelUp = false;
        // Level progression formula: 100 * level required to advance
        let xpNeeded = level * 100;
        while (newXp >= xpNeeded) {
            newXp -= xpNeeded;
            level += 1;
            levelUp = true;
            xpNeeded = level * 100;
        }
        await prisma.user.update({
            where: { id: userId },
            data: {
                experiencePoints: newXp,
                level
            }
        });
        if (levelUp) {
            // Log audit entry
            await prisma.auditLog.create({
                data: {
                    userId,
                    action: 'LEVEL_UP',
                    description: `User leveled up to Level ${level}!`
                }
            });
            // Award Level Badges or Achievements
            await this.awardLevelBadge(userId, level);
        }
        return { levelUp, newLevel: level, newXp };
    }
    /**
     * Helper to award badges based on Level thresholds
     */
    static async awardLevelBadge(userId, level) {
        if (level === 5) {
            await this.awardBadge(userId, 'Veteran Member', 'Unlocked by reaching Level 5!');
        }
    }
    /**
     * Award Badge to User
     */
    static async awardBadge(userId, badgeName, description) {
        try {
            // Find or create Badge definition
            let badge = await prisma.badge.findUnique({ where: { name: badgeName } });
            if (!badge) {
                badge = await prisma.badge.create({
                    data: { name: badgeName, description, iconUrl: 'default_badge_icon' }
                });
            }
            // Check if user already has it
            const hasBadge = await prisma.userBadge.findUnique({
                where: { userId_badgeId: { userId, badgeId: badge.id } }
            });
            if (!hasBadge) {
                await prisma.userBadge.create({
                    data: { userId, badgeId: badge.id }
                });
            }
        }
        catch (e) {
            console.error('Error awarding badge:', e);
        }
    }
    /**
     * Award Achievement to User
     */
    static async awardAchievement(userId, title, description) {
        try {
            let achievement = await prisma.achievement.findUnique({ where: { title } });
            if (!achievement) {
                achievement = await prisma.achievement.create({
                    data: { title, description, points: 20 }
                });
            }
            const hasAchievement = await prisma.userAchievement.findUnique({
                where: { userId_achievementId: { userId, achievementId: achievement.id } }
            });
            if (!hasAchievement) {
                await prisma.userAchievement.create({
                    data: { userId, achievementId: achievement.id }
                });
                // Award bonus XP for achieving goals
                await this.awardXp(userId, 50);
            }
        }
        catch (e) {
            console.error('Error awarding achievement:', e);
        }
    }
    /**
     * Increment chat statistic counters and award achievements
     */
    static async incrementChatCount(userId, type) {
        const updateData = { totalChats: { increment: 1 } };
        if (type === 'voice')
            updateData.voiceChats = { increment: 1 };
        if (type === 'video')
            updateData.videoChats = { increment: 1 };
        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData
        });
        // Check Chat Volume Achievements
        if (user.totalChats === 1) {
            await this.awardAchievement(userId, 'First Chat', 'Completed your first anonymous conversation!');
        }
        else if (user.totalChats === 10) {
            await this.awardAchievement(userId, '10 Chats', 'Completed 10 anonymous conversations!');
        }
        else if (user.totalChats === 100) {
            await this.awardAchievement(userId, '100 Chats', 'Completed 100 anonymous conversations!');
        }
        // Award XP for completing chat
        await this.awardXp(userId, 20);
    }
}
export default GamificationService;
