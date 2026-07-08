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

    console.log(`User connected: ${user.userId} (registered: ${user.isRegistered})`);

    await MatchmakerService.registerSession(user.userId, socket.id);

    await prisma.user.update({
      where: { id: user.userId },
      data: { status: 'ONLINE', lastSeen: new Date() }
    });

    io.emit('user:status', { userId: user.userId, status: 'ONLINE' });

    let currentRoomId: string | null = null;
    let peerUserId: string | null = null;

    // --- Matchmaking ---

    socket.on('match:join', async (payload: { interests: string[]; language: string; mediaType?: 'text' | 'voice' | 'video'; genderPreference?: 'MALE' | 'FEMALE' | 'NO_PREFERENCE' }) => {
      try {
        const isMuted = await ModerationService.isMuted(user.userId);
        if (isMuted) {
          socket.emit('system:warning', { message: 'You are temporarily restricted from matching.' });
          return;
        }

        const mediaType = payload.mediaType || 'text';

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
          if (userDb.onboarding) gender = userDb.onboarding.gender as any;
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
          isRegistered: user.isRegistered,
          joinedAt: Math.floor(Date.now() / 1000),
          mediaType,
          reputationScore: user.reputationScore,
          gender,
          genderPreference
        };

        await MatchmakerService.joinQueue(ticket);

        const stats = await MatchmakerService.getQueueStats(mediaType);
        socket.emit('match:searching', {
          message: 'Looking for a stranger...',
          activeCount: stats.activeCount,
          estimatedWaitSec: stats.estimatedWaitSec
        });

        const match = await MatchmakerService.findMatch(user.userId, mediaType);
        if (match) {
          const roomId = uuidv4();
          currentRoomId = roomId;
          peerUserId = match.userId;

          socket.join(roomId);

          const peerSocket = io.sockets.sockets.get(match.socketId);
          if (peerSocket) {
            peerSocket.join(roomId);
            peerSocket.emit('match:found', {
              roomId,
              peerName: user.isRegistered ? 'Registered Stranger' : 'Guest Stranger',
              isVideoCapable: mediaType === 'video',
              isAi: false
            });
            socket.emit('match:found', {
              roomId,
              peerName: match.isRegistered ? 'Registered Stranger' : 'Guest Stranger',
              isVideoCapable: mediaType === 'video',
              isAi: false
            });
          } else {
            await MatchmakerService.joinQueue(ticket);
          }
        }
      } catch (error) {
        console.error('Match join error', error);
      }
    });

    socket.on('match:leave', async (payload: { mediaType?: 'text' | 'voice' | 'video' }) => {
      const mediaType = payload?.mediaType || 'text';
      await MatchmakerService.leaveQueue(user.userId, mediaType);
      socket.emit('match:left', { message: 'Queue left.' });
    });

    // --- Chat Messages ---

    socket.on('chat:send', async (payload: { roomId: string; text: string }) => {
      const { roomId, text } = payload;
      if (!text || !roomId) return;

      const isMuted = await ModerationService.isMuted(user.userId);
      if (isMuted) {
        socket.emit('system:warning', { message: 'You are muted due to policy violations.' });
        return;
      }

      const isSpam = await ModerationService.isSpamming(user.userId);
      if (isSpam) {
        await ModerationService.muteUser(user.userId, 60);
        socket.emit('system:warning', { message: 'Flood limit reached. You are muted for 60 seconds.' });
        return;
      }

      const isDup = await ModerationService.isDuplicate(user.userId, text);
      if (isDup) {
        socket.emit('system:warning', { message: 'Duplicate messages are restricted.' });
        return;
      }

      const modResult = ModerationService.checkContent(text);
      if (!modResult.allowed) {
        socket.emit('system:warning', { message: modResult.reason || 'Content rejected.' });
        return;
      }

      const messageText = modResult.cleanedText || text;

      socket.to(roomId).emit('chat:receive', {
        messageId: uuidv4(),
        sender: 'stranger',
        text: messageText,
        sentAt: new Date().toISOString(),
        encrypted: false
      });

      socket.emit('chat:receive', {
        messageId: uuidv4(),
        sender: 'self',
        text: messageText,
        sentAt: new Date().toISOString(),
        encrypted: false
      });
    });

    socket.on('chat:typing', (payload: { roomId: string; isTyping: boolean }) => {
      socket.to(payload.roomId).emit('chat:typing', { isTyping: payload.isTyping });
    });

    // --- WebRTC Signaling ---

    socket.on('chat:signal', (payload: { roomId: string; signal: any }) => {
      socket.to(payload.roomId).emit('chat:signal', { signal: payload.signal });
    });

    // --- Skip & End Chat ---

    socket.on('chat:skip', async () => {
      if (currentRoomId) {
        socket.to(currentRoomId).emit('chat:peer_left', { reason: 'skip' });
        socket.leave(currentRoomId);
        currentRoomId = null;
        peerUserId = null;
      }
      socket.emit('chat:skipped');
    });

    socket.on('chat:end', () => {
      if (currentRoomId) {
        socket.to(currentRoomId).emit('chat:peer_left', { reason: 'end' });
        socket.leave(currentRoomId);
        currentRoomId = null;
        peerUserId = null;
      }
      socket.emit('chat:ended');
    });

    // --- Friend Request in Chat ---

    socket.on('friend:request_in_chat', async () => {
      if (!user.isRegistered || !peerUserId) {
        socket.emit('system:warning', { message: 'Cannot send friend request.' });
        return;
      }

      try {
        const existingFriend = await prisma.friend.findFirst({
          where: {
            OR: [
              { userId1: user.userId, userId2: peerUserId },
              { userId1: peerUserId, userId2: user.userId }
            ],
            status: 'ACCEPTED'
          }
        });
        if (existingFriend) {
          socket.emit('system:info', { message: 'Already friends!' });
          return;
        }

        const existingRequest = await prisma.friendRequest.findFirst({
          where: {
            OR: [
              { senderId: user.userId, receiverId: peerUserId },
              { senderId: peerUserId, receiverId: user.userId }
            ],
            status: 'PENDING'
          }
        });
        if (existingRequest) {
          socket.emit('system:info', { message: 'Friend request already pending.' });
          return;
        }

        const blocked = await prisma.block.findFirst({
          where: {
            OR: [
              { blockerId: user.userId, blockedId: peerUserId },
              { blockerId: peerUserId, blockedId: user.userId }
            ]
          }
        });
        if (blocked) {
          socket.emit('system:warning', { message: 'Cannot send request to blocked user.' });
          return;
        }

        const request = await prisma.friendRequest.create({
          data: {
            senderId: user.userId,
            receiverId: peerUserId,
            status: 'PENDING'
          }
        });

        const senderInfo = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { id: true, email: true, displayName: true, avatarUrl: true, level: true, status: true }
        });

        socket.to(currentRoomId!).emit('friend:request_received_in_chat', {
          id: request.id,
          senderId: user.userId,
          status: 'PENDING',
          sender: senderInfo
        });

        socket.emit('system:info', { message: 'Friend request sent!' });
      } catch (error) {
        console.error('Friend request in chat error:', error);
      }
    });

    // --- Private Chat Messages ---

    socket.on('private:send', async (payload: { roomId: string; text: string; replyToId?: string }) => {
      const { roomId, text, replyToId } = payload;
      if (!text || !roomId) return;

      try {
        const member = await prisma.chatRoomMember.findFirst({
          where: { roomId, userId: user.userId }
        });
        if (!member) {
          socket.emit('system:warning', { message: 'Access denied.' });
          return;
        }

        const otherMember = await prisma.chatRoomMember.findFirst({
          where: { roomId, userId: { not: user.userId } }
        });
        if (!otherMember) return;

        const modResult = ModerationService.checkContent(text);
        if (!modResult.allowed) {
          socket.emit('system:warning', { message: modResult.reason || 'Content rejected.' });
          return;
        }

        const message = await prisma.privateMessage.create({
          data: {
            roomId,
            senderId: user.userId,
            receiverId: otherMember.userId,
            text: modResult.cleanedText || text,
            status: 'SENT',
            replyToId: replyToId || null
          }
        });

        socket.emit('private:message', {
          ...message,
          createdAt: message.createdAt.toISOString()
        });

        const peerSocketId = await MatchmakerService.getActiveSocket(otherMember.userId);
        if (peerSocketId) {
          io.to(peerSocketId).emit('private:message', {
            ...message,
            createdAt: message.createdAt.toISOString()
          });
          io.to(peerSocketId).emit('private:delivered', { messageId: message.id, roomId });
        }
      } catch (error) {
        console.error('Private message error:', error);
      }
    });

    socket.on('private:typing', (payload: { roomId: string; isTyping: boolean }) => {
      socket.to(payload.roomId).emit('private:typing', { userId: user.userId, isTyping: payload.isTyping });
    });

    socket.on('private:read', async (payload: { roomId: string }) => {
      try {
        await prisma.privateMessage.updateMany({
          where: {
            roomId: payload.roomId,
            receiverId: user.userId,
            status: { in: ['SENDING', 'SENT', 'DELIVERED'] }
          },
          data: { status: 'SEEN' }
        });

        const peerMember = await prisma.chatRoomMember.findFirst({
          where: { roomId: payload.roomId, userId: { not: user.userId } }
        });
        if (peerMember) {
          const peerSocketId = await MatchmakerService.getActiveSocket(peerMember.userId);
          if (peerSocketId) {
            io.to(peerSocketId).emit('private:seen', { roomId: payload.roomId, userId: user.userId });
          }
        }
      } catch (error) {
        console.error('Read receipt error:', error);
      }
    });

    // --- Report & Block ---

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
        await MatchmakerService.adjustReputation(peerUserId, -15);
        socket.emit('system:info', { message: 'Report submitted successfully. Thank you.' });
      } catch (error) {
        console.error('Reporting error', error);
      }
    });

    socket.on('user:block', async () => {
      if (!peerUserId) return;
      try {
        await prisma.block.create({
          data: { blockerId: user.userId, blockedId: peerUserId }
        });
        socket.emit('system:info', { message: 'Stranger blocked.' });
        if (currentRoomId) {
          socket.to(currentRoomId).emit('chat:peer_left', { reason: 'block' });
          socket.leave(currentRoomId);
          currentRoomId = null;
          peerUserId = null;
        }
      } catch (error) {
        console.error('Blocking error', error);
      }
    });

    // --- Disconnect ---

    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.id} (User: ${user.userId})`);

      await prisma.user.update({
        where: { id: user.userId },
        data: { status: 'OFFLINE', lastSeen: new Date() }
      });

      io.emit('user:status', { userId: user.userId, status: 'OFFLINE', lastSeen: new Date().toISOString() });

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
