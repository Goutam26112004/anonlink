import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
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
import gamificationRouter from './routes/gamification.js';
import onboardingRouter from './routes/onboarding.js';
import subscriptionsRouter from './routes/subscriptions.js';
import mediaRouter from './routes/media.js';
import messagesRouter from './routes/messages.js';
import { startScheduler } from './services/scheduler.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/profile', profileRouter);
app.use('/api/v1/friends', friendsRouter);
app.use('/api/v1/webrtc', webrtcRouter);
app.use('/api/v1/moderation', moderationRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/gamification', gamificationRouter);
app.use('/api/v1/onboarding', onboardingRouter);
app.use('/api/v1/subscriptions', subscriptionsRouter);
app.use('/api/v1/media', mediaRouter);
app.use('/api/v1/messages', messagesRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
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
