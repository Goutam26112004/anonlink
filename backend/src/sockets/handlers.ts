import { Server, Socket } from 'socket.io';
import { MatchmakerService, MatchTicket } from '../services/matchmaker.js';
import { ModerationService } from '../services/moderation.js';
import { SubscriptionService } from '../services/subscription.js';
import { prisma } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export const registerSocketHandlers = (io: Server) => {
  io.on('connection', async (socket: Socket) => {
    const user = socket.data.user;
    if (!user) {
      socket.disconnect();
      return;
    }

    console.log(`User connected: ${user.userId} with socket ID: ${socket.id}`);
    await MatchmakerService.registerSession(user.userId, socket.id);

    // Active room tracker for this socket
    let currentRoomId: string | null = null;
    let peerUserId: string | null = null;

    /**
     * Join Matchmaking Queue
     */
    socket.on('match:join', async (payload: { interests: string[]; language: string; country: string; mediaType?: 'text' | 'voice' | 'video'; genderPreference?: 'MALE' | 'FEMALE' | 'NO_PREFERENCE' }) => {
      try {
        const isMuted = await ModerationService.isMuted(user.userId);
        if (isMuted) {
          socket.emit('system:warning', { message: 'You are temporarily restricted from matching.' });
          return;
        }

        const mediaType = payload.mediaType || 'text';

        // Feature access check: voice and video require paid subscription
        if (mediaType === 'voice' || mediaType === 'video') {
          const feature = mediaType as 'voice' | 'video';
          const hasAccess = await SubscriptionService.isFeatureEnabled(user.userId, feature);
          if (!hasAccess) {
            socket.emit('feature:locked', {
              feature: mediaType,
              message: `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} chat requires an active paid subscription.`,
              upgradeUrl: '/subscription'
            });
            return;
          }
        }

        let gender: 'MALE' | 'FEMALE' | 'PREFER_NOT_TO_SAY' | undefined;
        let genderPreference: 'MALE' | 'FEMALE' | 'NO_PREFERENCE' = 'NO_PREFERENCE';

        const userDb = await prisma.user.findUnique({
          where: { id: user.userId },
          include: { onboarding: true }
        });

        if (userDb) {
          if (userDb.onboarding) {
            gender = userDb.onboarding.gender as any;
          }
          const canFilter = await SubscriptionService.isFeatureEnabled(user.userId, 'genderFilter');
          if (canFilter) {
            genderPreference = payload.genderPreference || (userDb.genderPreference as any) || 'NO_PREFERENCE';
          }
        }

        const ticket: MatchTicket = {
          userId: user.userId,
          socketId: socket.id,
          interests: payload.interests || [],
          language: payload.language || 'en',
          country: payload.country || 'US',
          isRegistered: user.isRegistered,
          joinedAt: Math.floor(Date.now() / 1000),
          mediaType,
          reputationScore: user.reputationScore,
          gender,
          genderPreference
        };

        await MatchmakerService.joinQueue(ticket);
        
        // Fetch queue stats
        const stats = await MatchmakerService.getQueueStats(mediaType);
        socket.emit('match:searching', { 
          message: 'Looking for a stranger...',
          activeCount: stats.activeCount,
          estimatedWaitSec: stats.estimatedWaitSec
        });

        // Run match lookup immediately
        const match = await MatchmakerService.findMatch(user.userId, mediaType);
        if (match) {
          const roomId = uuidv4();
          
          // Connect self and peer to rooms
          currentRoomId = roomId;
          peerUserId = match.userId;

          socket.join(roomId);
          
          // Notify peer socket to join room
          const peerSocket = io.sockets.sockets.get(match.socketId);
          if (peerSocket) {
            peerSocket.join(roomId);
            // Set local states for peer socket
            peerSocket.emit('match:found', {
              roomId,
              peerName: user.isRegistered ? 'Registered Stranger' : 'Guest Stranger',
              isVideoCapable: mediaType === 'video',
              isAi: false
            });
            // Send matching update to this socket
            socket.emit('match:found', {
              roomId,
              peerName: match.isRegistered ? 'Registered Stranger' : 'Guest Stranger',
              isVideoCapable: mediaType === 'video',
              isAi: false
            });
          } else {
            // Peer socket went offline, place self back in queue
            await MatchmakerService.joinQueue(ticket);
          }
        }
      } catch (error) {
        console.error('Match join error', error);
      }
    });

    /**
     * Leave Matchmaking Queue
     */
    socket.on('match:leave', async (payload: { mediaType?: 'text' | 'voice' | 'video' }) => {
      const mediaType = payload?.mediaType || 'text';
      await MatchmakerService.leaveQueue(user.userId, mediaType);
      socket.emit('match:left', { message: 'Queue left.' });
    });

    /**
     * Chat Message Send
     */
    socket.on('chat:send', async (payload: { roomId: string; text: string }) => {
      const { roomId, text } = payload;
      if (!text || !roomId) return;

      const isMuted = await ModerationService.isMuted(user.userId);
      if (isMuted) {
        socket.emit('system:warning', { message: 'You are muted due to policy violations.' });
        return;
      }

      // Check spamming speed limits
      const isSpam = await ModerationService.isSpamming(user.userId);
      if (isSpam) {
        await ModerationService.muteUser(user.userId, 60); // 1-minute restriction
        socket.emit('system:warning', { message: 'Flood limit reached. You are muted for 60 seconds.' });
        return;
      }

      // Check consecutive duplicates
      const isDup = await ModerationService.isDuplicate(user.userId, text);
      if (isDup) {
        socket.emit('system:warning', { message: 'Duplicate messages are restricted.' });
        return;
      }

      // Moderation scan
      const modResult = ModerationService.checkContent(text);
      if (!modResult.allowed) {
        socket.emit('system:warning', { message: modResult.reason || 'Content rejected.' });
        return;
      }

      const messageText = modResult.cleanedText || text;

      // Broadcast to room
      socket.to(roomId).emit('chat:receive', {
        messageId: uuidv4(),
        sender: 'stranger',
        text: messageText,
        sentAt: new Date().toISOString(),
        encrypted: false
      });

      // Echo back to self
      socket.emit('chat:receive', {
        messageId: uuidv4(),
        sender: 'self',
        text: messageText,
        sentAt: new Date().toISOString(),
        encrypted: false
      });

      // Optionally archive message in PostgreSQL if registered users
      if (user.isRegistered) {
        // Save logic to database
      }
    });

    /**
     * Typing Indicator
     */
    socket.on('chat:typing', (payload: { roomId: string; isTyping: boolean }) => {
      socket.to(payload.roomId).emit('chat:typing', { isTyping: payload.isTyping });
    });

    /**
     * WebRTC Signaling Relay
     */
    socket.on('chat:signal', (payload: { roomId: string; signal: any }) => {
      socket.to(payload.roomId).emit('chat:signal', { signal: payload.signal });
    });

    /**
     * Skip Stranger
     */
    socket.on('chat:skip', async () => {
      if (currentRoomId) {
        socket.to(currentRoomId).emit('chat:peer_left');
        socket.leave(currentRoomId);
        currentRoomId = null;
        peerUserId = null;
      }
      socket.emit('chat:skipped');
    });

    /**
     * Report User
     */
    socket.on('user:report', async (payload: { reason: string }) => {
      if (!peerUserId) return;
      try {
        await prisma.report.create({
          data: {
            reporterId: user.userId,
            reportedId: peerUserId,
            reason: payload.reason,
            roomId: currentRoomId || 'ephemeral',
            status: 'PENDING'
          }
        });
        socket.emit('system:info', { message: 'Report submitted successfully. Thank you.' });
      } catch (error) {
        console.error('Reporting error', error);
      }
    });

    /**
     * Block User
     */
    socket.on('user:block', async () => {
      if (!peerUserId) return;
      try {
        await prisma.block.create({
          data: {
            blockerId: user.userId,
            blockedId: peerUserId
          }
        });
        socket.emit('system:info', { message: 'Stranger blocked.' });
        // Auto skip after block
        if (currentRoomId) {
          socket.to(currentRoomId).emit('chat:peer_left');
          socket.leave(currentRoomId);
          currentRoomId = null;
          peerUserId = null;
        }
      } catch (error) {
        console.error('Blocking error', error);
      }
    });

    /**
     * Handle Connection Disconnect
     */
    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.id} (User: ${user.userId})`);
      await MatchmakerService.leaveQueue(user.userId, 'text');
      await MatchmakerService.leaveQueue(user.userId, 'voice');
      await MatchmakerService.leaveQueue(user.userId, 'video');
      await MatchmakerService.removeActiveSocket(user.userId);

      if (currentRoomId) {
        socket.to(currentRoomId).emit('chat:peer_left');
      }
    });
  });
};
