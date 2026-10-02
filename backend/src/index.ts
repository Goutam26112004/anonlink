import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { connectRedis } from './config/redis.js';
import { connectDB } from './config/db.js';
import { socketAuthMiddleware } from './sockets/middleware.js';
import { registerSocketHandlers } from './sockets/handlers.js';
import authRouter from './routes/auth.js';
import profileRouter from './routes/profile.js';
import friendsRouter from './routes/friends.js';
import webrtcRouter from './routes/webrtc.js';
import moderationRouter from './routes/moderation.js';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import adminRouter from './routes/admin.js';

import onboardingRouter from './routes/onboarding.js';
import subscriptionsRouter from './routes/subscriptions.js';
import mediaRouter from './routes/media.js';
import messagesRouter from './routes/messages.js';
import ticketsRouter from './routes/tickets.js';
import { startScheduler } from './services/scheduler.js';
import { errorLogger } from './middleware/errorLogger.js';

const app = express();
const port = process.env.PORT || 4000;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  'https://anonlink.online',
  'http://localhost:3000',
  'http://localhost:4000',
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

// Global rate limiter: 200 requests per minute per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// Strict rate limiter for auth endpoints: 10 requests per minute
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please wait a minute.' },
});

// API Routes
app.use('/api/v1/auth', authLimiter, authRouter);
app.use('/api/v1/profile', profileRouter);
app.use('/api/v1/friends', friendsRouter);
app.use('/api/v1/webrtc', webrtcRouter);
app.use('/api/v1/moderation', moderationRouter);
app.use('/api/v1/admin', adminRouter);

app.use('/api/v1/onboarding', onboardingRouter);
app.use('/api/v1/subscriptions', subscriptionsRouter);
app.use('/api/v1/media', mediaRouter);
app.use('/api/v1/messages', messagesRouter);
app.use('/api/v1/tickets', ticketsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public platform activity stats (no auth required)
app.get('/api/v1/stats/activity', async (req, res) => {
  try {
    const { redisClient } = await import('./config/redis.js');
    const { prisma } = await import('./config/db.js');
    
    const [onlineUsers, textQueue, voiceQueue, videoQueue, totalMessages] = await Promise.all([
      prisma.user.count({ where: { status: 'ONLINE' } }),
      redisClient.sCard('matchmaking:queue:text'),
      redisClient.sCard('matchmaking:queue:voice'),
      redisClient.sCard('matchmaking:queue:video'),
      prisma.privateMessage.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    ]);

    const searching = textQueue + voiceQueue + videoQueue;
    // Active chats = online users minus those searching, divided by 2 (pairs)
    const activeChats = Math.max(0, Math.floor((onlineUsers - searching) / 2));

    res.json({ onlineUsers, searching, activeChats, messagesToday: totalMessages });
  } catch (e) {
    res.json({ onlineUsers: 0, searching: 0, activeChats: 0, messagesToday: 0 });
  }
});

// Global error handler (must be after all routes)
app.use(errorLogger);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.set('io', io);

// Configure middleware and socket handlers
io.use(socketAuthMiddleware);
registerSocketHandlers(io);

const startServer = async () => {
  await connectRedis();
  await connectDB();
  startScheduler();
  
  server.listen(port, () => {
    console.log(`Backend server running on port ${port}`);
  });
};

startServer().catch((err) => {
  console.error('Server initialization failed:', err);
});
// Trigger nodemon restart for ESM ts-config settings
