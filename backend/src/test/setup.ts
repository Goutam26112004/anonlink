import { beforeAll, afterAll, vi } from 'vitest';

vi.mock('../config/db.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    friend: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn()
    },
    friendRequest: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn()
    },
    block: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn()
    },
    chatRoom: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn()
    },
    chatRoomMember: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn()
    },
    privateMessage: {
      create: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn()
    },
    notification: {
      findMany: vi.fn(),
      updateMany: vi.fn()
    },
    refreshToken: {
      findMany: vi.fn(),
      updateMany: vi.fn()
    },
    subscriptionHistory: {
      create: vi.fn()
    },
    userSubscription: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn()
    },
    userSettings: {
      upsert: vi.fn()
    },
    userBadge: { findMany: vi.fn() },
    userAchievement: { findMany: vi.fn() },
    temporaryMedia: { updateMany: vi.fn() },
    report: { create: vi.fn() },
    auditLog: { create: vi.fn() },
    role: { findFirst: vi.fn(), create: vi.fn() }
  },
  connectDB: vi.fn()
}));

vi.mock('../config/redis.js', () => ({
  redisClient: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(true),
    on: vi.fn()
  }
}));

vi.mock('../utils/jwt.js', () => ({
  generateToken: vi.fn().mockReturnValue('mock-token'),
  verifyToken: vi.fn()
}));
