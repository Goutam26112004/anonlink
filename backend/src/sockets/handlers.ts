import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { MatchmakerService, MatchTicket } from '../services/matchmaker.js';
import { ModerationService } from '../services/moderation.js';
import { SubscriptionService } from '../services/subscription.js';
import { prisma } from '../config/db.js';
import { redisClient } from '../config/redis.js';
import { v4 as uuidv4 } from 'uuid';

const getJwtSecret = () => process.env.JWT_SECRET || 'supersecretkey123';

const activeChats = new Map<string, { roomId: string; peerUserId: string; peerName: string; sessionCode: string }>();
const disconnectTimers = new Map<string, NodeJS.Timeout>();
const bothOfflineTimers = new Map<string, NodeJS.Timeout>(); // roomId -> timer

export const registerSocketHandlers = (io: Server) => {
  io.on('connection', async (socket: Socket) => {
    let user = socket.data.user;
    if (!user) {
      socket.disconnect();
      return;
    }

    console.log(`User connected: ${user.userId} (registered: ${user.isRegistered})`);

    MatchmakerService.registerSession(user.userId, socket.id).catch(err => console.error('Register session error:', err));

    // Update matchmaking ticket socketId if user is in queue (handles reconnections)
    redisClient.hGet('matchmaking:tickets', user.userId).then(ticketData => {
      if (ticketData) {
        const ticket = JSON.parse(ticketData);
        ticket.socketId = socket.id;
        redisClient.hSet('matchmaking:tickets', user.userId, JSON.stringify(ticket));
      }
    }).catch(() => {});

    prisma.user.update({
      where: { id: user.userId },
      data: { status: 'ONLINE', lastSeen: new Date() }
    }).catch(err => console.error('Update user online status error:', err));

    io.emit('user:status', { userId: user.userId, status: 'ONLINE' });

    let currentRoomId: string | null = null;

    // --- Upgrade auth for guest-to-registered conversion ---

    socket.on('auth:upgrade', async ({ token }: { token: string }, callback?: any) => {
      try {
        const decoded = jwt.verify(token, getJwtSecret()) as any;
        socket.data.user = {
          userId: decoded.userId,
          email: decoded.email || null,
          registrationType: decoded.registrationType || 'email',
          isRegistered: !!(decoded.registrationType && decoded.registrationType.toLowerCase() !== 'guest'),
        };
        user = socket.data.user;
        socket.emit('auth:upgraded', { success: true });
        if (typeof callback === 'function') {
          callback({ success: true });
        }
        console.log(`Auth upgraded for user ${user.userId}: registrationType=${socket.data.user.registrationType}`);
      } catch (error) {
        socket.emit('auth:upgraded', { success: false, error: 'Invalid token' });
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Invalid token' });
        }
      }
    });
    let peerUserId: string | null = null;

    // --- Matchmaking ---

    socket.on('match:join', async (payload: { interests: string[]; language: string; mediaType?: 'text' | 'voice' | 'video'; genderPreference?: 'MALE' | 'FEMALE' | 'NO_PREFERENCE'; ageRange?: string }) => {
      try {
        console.log(`[Socket] match:join event triggered for user: ${user.userId}, payload:`, payload);
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
        let ageRange: string | undefined;

        const userDb = await prisma.user.findUnique({
          where: { id: user.userId },
          include: { onboarding: true }
        });

        if (userDb) {
          if (userDb.onboarding) gender = userDb.onboarding.gender as any;
          const canFilter = await SubscriptionService.isFeatureEnabled(user.userId, 'genderFilter');
          if (canFilter) {
            genderPreference = payload.genderPreference || (userDb.genderPreference as any) || 'NO_PREFERENCE';
            ageRange = payload.ageRange;
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
          gender,
          genderPreference,
          ageRange
        };

        await MatchmakerService.joinQueue(ticket);

        // Broadcast updated stats to ALL searching users in this queue
        const stats = await MatchmakerService.getQueueStats(mediaType);
        const queueKey = `matchmaking:queue:${mediaType}`;
        const allInQueue = await redisClient.sMembers(queueKey);
        for (const queuedUserId of allInQueue) {
          const ticketData = await redisClient.hGet('matchmaking:tickets', queuedUserId);
          if (ticketData) {
            const t = JSON.parse(ticketData);
            const queuedSocket = io.sockets.sockets.get(t.socketId);
            if (queuedSocket) {
              queuedSocket.emit('match:searching', {
                message: 'Looking for a stranger...',
                activeCount: stats.activeCount,
                estimatedWaitSec: stats.estimatedWaitSec
              });
            }
          }
        }

        // Try to find a match immediately
        const match = await MatchmakerService.findMatch(user.userId, mediaType);
        if (match) {
          const roomId = uuidv4();
          const sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          currentRoomId = roomId;
          peerUserId = match.userId;

          const selfPeerName = match.isRegistered ? 'Registered Stranger' : 'Guest Stranger';
          const peerPeerName = user.isRegistered ? 'Registered Stranger' : 'Guest Stranger';

          activeChats.set(user.userId, { roomId, peerUserId: match.userId, peerName: peerPeerName, sessionCode });
          activeChats.set(match.userId, { roomId, peerUserId: user.userId, peerName: selfPeerName, sessionCode });

          socket.join(roomId);

          const peerSocket = io.sockets.sockets.get(match.socketId);
          if (peerSocket) {
            peerSocket.join(roomId);
            // Designate exactly one side as the WebRTC offerer for voice/video
            // matches, so useWebRTC() knows who should createOffer(). Without
            // this, neither side offers and the call never connects.
            peerSocket.emit('match:found', {
              roomId,
              sessionCode,
              peerName: peerPeerName,
              isVideoCapable: mediaType === 'video',
              isAi: false,
              isOfferer: false
            });
            socket.emit('match:found', {
              roomId,
              sessionCode,
              peerName: selfPeerName,
              isVideoCapable: mediaType === 'video',
              isAi: false,
              isOfferer: true
            });
          } else {
            // Try finding peer's current socket via active session registry
            const peerCurrentSocketId = await MatchmakerService.getActiveSocket(match.userId);
            const peerCurrentSocket = peerCurrentSocketId ? io.sockets.sockets.get(peerCurrentSocketId) : null;
            if (peerCurrentSocket) {
              peerCurrentSocket.join(roomId);
              peerCurrentSocket.emit('match:found', {
                roomId,
                sessionCode,
                peerName: peerPeerName,
                isVideoCapable: mediaType === 'video',
                isAi: false,
                isOfferer: false
              });
              socket.emit('match:found', {
                roomId,
                sessionCode,
                peerName: selfPeerName,
                isVideoCapable: mediaType === 'video',
                isAi: false,
                isOfferer: true
              });
            } else {
              // Peer truly gone, re-queue self
              await MatchmakerService.joinQueue(ticket);
            }
          }
        } else {
          // No match yet - start retry interval
          const retryInterval = setInterval(async () => {
            // Check if user is still in queue
            const stillInQueue = await redisClient.sIsMember(`matchmaking:queue:${mediaType}`, user.userId);
            if (!stillInQueue) {
              clearInterval(retryInterval);
              return;
            }

            const retryMatch = await MatchmakerService.findMatch(user.userId, mediaType);
            if (retryMatch) {
              clearInterval(retryInterval);
              const roomId = uuidv4();
              const sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();
              currentRoomId = roomId;
              peerUserId = retryMatch.userId;

              const selfPeerName = retryMatch.isRegistered ? 'Registered Stranger' : 'Guest Stranger';
              const peerPeerName = user.isRegistered ? 'Registered Stranger' : 'Guest Stranger';

              activeChats.set(user.userId, { roomId, peerUserId: retryMatch.userId, peerName: peerPeerName, sessionCode });
              activeChats.set(retryMatch.userId, { roomId, peerUserId: user.userId, peerName: selfPeerName, sessionCode });

              socket.join(roomId);

              let peerSocket = io.sockets.sockets.get(retryMatch.socketId);
              // Fallback: check active session for updated socket ID
              if (!peerSocket) {
                const currentPeerSocketId = await MatchmakerService.getActiveSocket(retryMatch.userId);
                if (currentPeerSocketId) peerSocket = io.sockets.sockets.get(currentPeerSocketId);
              }
              if (peerSocket) {
                peerSocket.join(roomId);
                peerSocket.emit('match:found', {
                  roomId,
                  sessionCode,
                  peerName: peerPeerName,
                  isVideoCapable: mediaType === 'video',
                  isAi: false,
                  isOfferer: false
                });
                socket.emit('match:found', {
                  roomId,
                  sessionCode,
                  peerName: selfPeerName,
                  isVideoCapable: mediaType === 'video',
                  isAi: false,
                  isOfferer: true
                });
              } else {
                // Peer truly gone, re-queue self
                const ticketData = await redisClient.hGet('matchmaking:tickets', user.userId);
                if (ticketData) await MatchmakerService.joinQueue(JSON.parse(ticketData));
              }
            }
          }, 1500); // Retry every 1.5 seconds

          // Clean up interval on disconnect
          socket.on('disconnect', () => clearInterval(retryInterval));
          socket.on('match:leave', () => clearInterval(retryInterval));
        }
      } catch (error) {
        console.error('Match join error', error);
      }
    });

    socket.on('match:leave', async (payload: { mediaType?: 'text' | 'voice' | 'video' }) => {
      const mediaType = payload?.mediaType || 'text';
      await MatchmakerService.leaveQueue(user.userId, mediaType);
      socket.emit('match:left', { message: 'Queue left.' });

      // Broadcast updated stats to remaining users
      const stats = await MatchmakerService.getQueueStats(mediaType);
      const queueKey = `matchmaking:queue:${mediaType}`;
      const allInQueue = await redisClient.sMembers(queueKey);
      for (const queuedUserId of allInQueue) {
        const ticketData = await redisClient.hGet('matchmaking:tickets', queuedUserId);
        if (ticketData) {
          const t = JSON.parse(ticketData);
          const queuedSocket = io.sockets.sockets.get(t.socketId);
          if (queuedSocket) {
            queuedSocket.emit('match:searching', {
              message: 'Looking for a stranger...',
              activeCount: stats.activeCount,
              estimatedWaitSec: stats.estimatedWaitSec
            });
          }
        }
      }
    });

    // --- Chat Messages ---

    socket.on('chat:send', async (payload: { roomId: string; text: string; imageUrl?: string; viewOnce?: boolean }) => {
      const { roomId, text, imageUrl, viewOnce } = payload;
      if ((!text && !imageUrl) || !roomId) return;

      if (text) {
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
          // Track violation and check for auto-mute escalation
          const violation = await ModerationService.trackViolation(user.userId, modResult.type || 'content');
          let warningMessage = modResult.reason || 'Content rejected.';
          if (violation.autoMuted) {
            warningMessage += ` You have been temporarily restricted for ${Math.floor(violation.muteDuration / 60)} minutes due to repeated violations.`;
          }
          socket.emit('system:warning', { message: warningMessage, type: modResult.type, severity: modResult.severity });
          return;
        }

        const messageText = modResult.cleanedText || text;

        socket.to(roomId).emit('chat:receive', {
          messageId: uuidv4(),
          sender: 'stranger',
          text: messageText,
          sentAt: new Date().toISOString(),
          encrypted: false,
          imageUrl: imageUrl || undefined,
          viewOnce: imageUrl ? (viewOnce === true) : false
        });

        socket.emit('chat:receive', {
          messageId: uuidv4(),
          sender: 'self',
          text: messageText,
          sentAt: new Date().toISOString(),
          encrypted: false,
          imageUrl: imageUrl || undefined,
          viewOnce: imageUrl ? (viewOnce === true) : false
        });
      } else if (imageUrl) {
        socket.to(roomId).emit('chat:receive', {
          messageId: uuidv4(),
          sender: 'stranger',
          text: '',
          sentAt: new Date().toISOString(),
          encrypted: false,
          imageUrl,
          viewOnce: viewOnce === true
        });

        socket.emit('chat:receive', {
          messageId: uuidv4(),
          sender: 'self',
          text: '',
          sentAt: new Date().toISOString(),
          encrypted: false,
          imageUrl,
          viewOnce: viewOnce === true
        });
      }
    });

    socket.on('chat:typing', (payload: { roomId: string; isTyping: boolean }) => {
      socket.to(payload.roomId).emit('chat:typing', { isTyping: payload.isTyping });
    });

    // --- WebRTC Signaling ---

    socket.on('chat:signal', (payload: { roomId: string; signal: any }) => {
      socket.to(payload.roomId).emit('chat:signal', { signal: payload.signal });
    });

    // --- Convert Text Chat to Call ---

    socket.on('chat:convert_to_call', async (payload: { roomId: string; mediaType: 'voice' | 'video' }) => {
      const { roomId, mediaType } = payload;
      if (!roomId || !peerUserId) return;

      // Check subscription
      const sub = await prisma.userSubscription.findFirst({
        where: { userId: user.userId, status: 'ACTIVE' }
      });
      if (!sub) {
        socket.emit('system:warning', { message: `${mediaType} chat requires an active paid subscription.` });
        return;
      }

      // Verify friendship - calls only between friends
      const friendship = await prisma.friend.findFirst({
        where: {
          OR: [
            { userId1: user.userId, userId2: peerUserId, status: 'ACCEPTED' },
            { userId1: peerUserId, userId2: user.userId, status: 'ACCEPTED' },
          ]
        }
      });
      if (!friendship) {
        socket.emit('call:error', { message: 'You can only call friends. Send a friend request first.' });
        return;
      }

      socket.to(roomId).emit('chat:convert_to_call', { mediaType, initiatedBy: user.userId });
      socket.emit('chat:convert_to_call', { mediaType, initiatedBy: user.userId });
    });

    // --- Private Call (DM) ---

    socket.on('call:initiate', async (payload: { roomId: string; type: 'voice' | 'video' }) => {
      const { roomId, type } = payload;
      if (!roomId) return;

      // Verify subscription
      const sub = await prisma.userSubscription.findFirst({
        where: { userId: user.userId, status: 'ACTIVE' }
      });
      if (!sub) {
        socket.emit('system:warning', { message: `${type} call requires an active subscription.` });
        return;
      }

      // Verify user is a member of this room
      const member = await prisma.chatRoomMember.findFirst({
        where: { roomId, userId: user.userId }
      });
      if (!member) {
        socket.emit('system:warning', { message: 'Access denied.' });
        return;
      }

      // Find the peer
      const peerMember = await prisma.chatRoomMember.findFirst({
        where: { roomId, userId: { not: user.userId } }
      });
      if (!peerMember) return;

      // Verify they are friends (calls only between friends)
      const friendship = await prisma.friend.findFirst({
        where: {
          OR: [
            { userId1: user.userId, userId2: peerMember.userId, status: 'ACCEPTED' },
            { userId1: peerMember.userId, userId2: user.userId, status: 'ACCEPTED' },
          ]
        }
      });
      if (!friendship) {
        socket.emit('call:error', { message: 'You can only call friends. Send a friend request first.' });
        return;
      }

      // Get initiator's display name
      const initiator = await prisma.user.findUnique({ where: { id: user.userId }, select: { username: true, displayName: true } });
      const initiatorName = initiator?.displayName || initiator?.username || 'User';

      // Make sure initiator is in the socket room
      socket.join(roomId);

      // Notify initiator that call is ringing (NOT call:started which triggers WebRTC)
      const callData = { roomId, type, initiatedBy: user.userId, initiatorName };
      socket.emit('call:ringing', callData);

      const peerSocketId = await MatchmakerService.getActiveSocket(peerMember.userId);
      if (peerSocketId) {
        // Make peer join the room too for signaling
        const peerSocket = io.sockets.sockets.get(peerSocketId);
        if (peerSocket) {
          peerSocket.join(roomId);
        }
        io.to(peerSocketId).emit('call:incoming', callData);
      } else {
        socket.emit('call:error', { message: 'User is offline. They need to be online to receive calls.' });
      }
    });

    // Accept an incoming call - notifies the initiator to start WebRTC
    socket.on('call:accept', async (payload: { roomId: string; type: 'voice' | 'video' }) => {
      const { roomId, type } = payload;
      if (!roomId) return;

      // Join the room for signaling
      socket.join(roomId);

      // Get acceptor's display name
      const acceptor = await prisma.user.findUnique({ where: { id: user.userId }, select: { username: true, displayName: true } });
      const acceptorName = acceptor?.displayName || acceptor?.username || 'User';

      // Notify the initiator that call was accepted - both sides start WebRTC
      const acceptData = { roomId, type, acceptedBy: user.userId, acceptorName };
      socket.emit('call:accepted', acceptData);
      socket.to(roomId).emit('call:accepted', acceptData);
    });

    // Decline an incoming call
    socket.on('call:decline', async (payload: { roomId: string }) => {
      const { roomId } = payload;
      if (!roomId) return;

      // Get decliner's display name
      const decliner = await prisma.user.findUnique({ where: { id: user.userId }, select: { username: true, displayName: true } });
      const declinerName = decliner?.displayName || decliner?.username || 'User';

      // Notify the initiator that call was declined
      socket.to(roomId).emit('call:declined', { roomId, declinedBy: user.userId, declinerName });
    });

    // End an active call
    socket.on('call:end', async (payload: { roomId: string }) => {
      const { roomId } = payload;
      if (!roomId) return;
      socket.to(roomId).emit('call:ended', { roomId, endedBy: user.userId });
    });

    // --- Skip & End Chat ---

    socket.on('chat:skip', async () => {
      if (currentRoomId) {
        const roomToClean = currentRoomId;
        const chatEntry = activeChats.get(user.userId);
        const peerId = peerUserId || chatEntry?.peerUserId || null;
        activeChats.delete(user.userId);
        
        // Emit to room (standard approach)
        socket.to(currentRoomId).emit('chat:peer_left', { reason: 'skip' });
        
        // ALSO emit directly to peer socket object for absolute reliability
        if (peerId) {
          activeChats.delete(peerId);
          const peerTimer = disconnectTimers.get(peerId);
          if (peerTimer) { clearTimeout(peerTimer); disconnectTimers.delete(peerId); }
          
          const peerSocketId = await MatchmakerService.getActiveSocket(peerId);
          if (peerSocketId) {
            const peerSocket = io.sockets.sockets.get(peerSocketId);
            if (peerSocket) {
              peerSocket.emit('chat:peer_left', { reason: 'skip' });
              peerSocket.emit('chat:ended');
              peerSocket.leave(roomToClean);
            }
          }
        }
        
        const bothTimer = bothOfflineTimers.get(roomToClean);
        if (bothTimer) { clearTimeout(bothTimer); bothOfflineTimers.delete(roomToClean); }
        socket.leave(currentRoomId);
        currentRoomId = null;
        peerUserId = null;
        import('../services/cleanup.js').then(({ CleanupService }) => {
          CleanupService.deleteAnonymousChatMessages(roomToClean).catch(() => {});
        });
      }
      socket.emit('chat:skipped');
    });

    socket.on('chat:end', async () => {
      if (currentRoomId) {
        const roomToClean = currentRoomId;
        const chatEntry = activeChats.get(user.userId);
        const peerId = peerUserId || chatEntry?.peerUserId || null;
        activeChats.delete(user.userId);
        
        // Emit to room (standard approach)
        socket.to(currentRoomId).emit('chat:peer_left', { reason: 'end' });
        
        // ALSO emit directly to peer socket object for absolute reliability
        if (peerId) {
          activeChats.delete(peerId);
          const peerTimer = disconnectTimers.get(peerId);
          if (peerTimer) { clearTimeout(peerTimer); disconnectTimers.delete(peerId); }
          
          const peerSocketId = await MatchmakerService.getActiveSocket(peerId);
          if (peerSocketId) {
            const peerSocket = io.sockets.sockets.get(peerSocketId);
            if (peerSocket) {
              peerSocket.emit('chat:peer_left', { reason: 'end' });
              peerSocket.emit('chat:ended');
              peerSocket.leave(roomToClean);
            }
          }
        }
        
        const bothTimer = bothOfflineTimers.get(roomToClean);
        if (bothTimer) { clearTimeout(bothTimer); bothOfflineTimers.delete(roomToClean); }
        socket.leave(currentRoomId);
        currentRoomId = null;
        peerUserId = null;
        import('../services/cleanup.js').then(({ CleanupService }) => {
          CleanupService.deleteAnonymousChatMessages(roomToClean).catch(() => {});
        });
      }
      socket.emit('chat:ended');
    });

    // --- Rejoin after reconnect ---

    socket.on('chat:rejoin', () => {
      const saved = activeChats.get(user.userId);
      if (saved) {
        currentRoomId = saved.roomId;
        peerUserId = saved.peerUserId;
        socket.join(saved.roomId);
        const timer = disconnectTimers.get(user.userId);
        if (timer) {
          clearTimeout(timer);
          disconnectTimers.delete(user.userId);
        }
        // Cancel both-offline timer if it was running
        const bothTimer = bothOfflineTimers.get(saved.roomId);
        if (bothTimer) {
          clearTimeout(bothTimer);
          bothOfflineTimers.delete(saved.roomId);
        }
        socket.to(saved.roomId).emit('chat:peer_reconnected');
        socket.emit('chat:rejoined');
        socket.emit('system:info', { message: 'Reconnected to chat.' });
        io.emit('user:status', { userId: user.userId, status: 'ONLINE', lastSeen: new Date().toISOString() });
      }
    });

    // --- Friend Request in Chat ---

    socket.on('friend:request_in_chat', async () => {
      const savedChat = activeChats.get(user.userId);
      const resolvedPeerUserId = peerUserId || savedChat?.peerUserId;
      const resolvedRoomId = currentRoomId || savedChat?.roomId;

      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { registrationType: true }
      });
      const isUserRegistered = dbUser && dbUser.registrationType !== 'GUEST';

      console.log('friend:request_in_chat triggered:', {
        userId: user.userId,
        isRegistered: user.isRegistered,
        dbRegistrationType: dbUser?.registrationType,
        isUserRegistered,
        resolvedPeerUserId,
        resolvedRoomId,
        hasSavedChat: !!savedChat,
        socketUser: socket.data.user
      });

      if (!isUserRegistered || !resolvedPeerUserId) {
        socket.emit('system:warning', { message: 'Cannot send friend request.' });
        return;
      }

      try {
        const existingFriend = await prisma.friend.findFirst({
          where: {
            OR: [
              { userId1: user.userId, userId2: resolvedPeerUserId },
              { userId1: resolvedPeerUserId, userId2: user.userId }
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
              { senderId: user.userId, receiverId: resolvedPeerUserId },
              { senderId: resolvedPeerUserId, receiverId: user.userId }
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
              { blockerId: user.userId, blockedId: resolvedPeerUserId },
              { blockerId: resolvedPeerUserId, blockedId: user.userId }
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
            receiverId: resolvedPeerUserId,
            status: 'PENDING'
          }
        });

        const senderInfo = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { id: true, email: true, displayName: true, avatarUrl: true, status: true, createdAt: true }
        });

        const receiverInfo = await prisma.user.findUnique({
          where: { id: resolvedPeerUserId },
          select: { displayName: true, username: true }
        });

        if (resolvedRoomId) {
          socket.to(resolvedRoomId).emit('friend:request_received_in_chat', {
            id: request.id,
            senderId: user.userId,
            status: 'PENDING',
            sender: senderInfo
          });
        }

        socket.emit('friend:request_sent_in_chat', {
          id: request.id,
          receiverName: receiverInfo?.displayName || receiverInfo?.username || 'Stranger',
          status: 'PENDING'
        });

        socket.emit('system:info', { message: 'Friend request sent!' });
      } catch (error) {
        console.error('Friend request in chat error:', error);
      }
    });

    // --- Accept Friend Request in Chat ---

    socket.on('friend:accept_in_chat', async (payload: { requestId: string }) => {
      const { requestId } = payload;
      const savedChat = activeChats.get(user.userId);
      const resolvedRoomId = currentRoomId || savedChat?.roomId;

      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { registrationType: true }
      });
      const isUserRegistered = dbUser && dbUser.registrationType !== 'GUEST';

      if (!requestId || !isUserRegistered) {
        socket.emit('system:warning', { message: 'Cannot accept friend request.' });
        return;
      }

      try {
        const request = await prisma.friendRequest.findUnique({
          where: { id: requestId },
          include: { sender: { select: { id: true, displayName: true, username: true } } }
        });

        console.log('[friend:accept_in_chat] check:', {
          requestId,
          request_receiverId: request?.receiverId,
          user_userId: user.userId,
          match: request?.receiverId === user.userId
        });

        if (!request || request.receiverId !== user.userId) {
          socket.emit('system:warning', { message: 'Friend request not found.' });
          return;
        }

        if (request.status !== 'PENDING') {
          socket.emit('system:info', { message: 'Request already processed.' });
          return;
        }

        // Use sender's ID from the DB request — no need for resolvedPeerUserId
        const peerFromRequest = request.senderId;

        const roomId = uuidv4();

        await prisma.$transaction([
          prisma.friendRequest.update({
            where: { id: requestId },
            data: { status: 'ACCEPTED' }
          }),
          prisma.friend.create({
            data: { userId1: user.userId, userId2: peerFromRequest, status: 'ACCEPTED' }
          }),
          prisma.chatRoom.create({
            data: {
              id: roomId,
              type: 'DIRECT',
              members: {
                  createMany: {
                    data: [
                      { userId: user.userId },
                      { userId: peerFromRequest }
                    ]
                  }
              }
            }
          })
        ]);

        const friendForReceiver = {
          id: request.sender.id,
          userId: request.sender.id,
          email: null,
          displayName: request.sender?.displayName || request.sender?.username || 'Stranger',
          avatarUrl: null,
          status: 'ONLINE' as const,
          lastSeen: new Date().toISOString(),
          friendSince: new Date().toISOString(),
          isFavorite: false,
          note: null,
        };

        // Fetch accepter's info from DB since socket.data.user only has userId/email
        const accepterInfo = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { id: true, email: true, displayName: true, username: true, avatarUrl: true }
        });
        const accepterName = accepterInfo?.displayName || accepterInfo?.username || 'Stranger';

        socket.emit('friend:request_accepted_in_chat', {
          requestId,
          friendName: friendForReceiver.displayName,
          friend: friendForReceiver,
          chatRoomId: roomId,
        });

        if (resolvedRoomId) {
          socket.to(resolvedRoomId).emit('friend:request_accepted_in_chat', {
            requestId,
            friendName: accepterName,
            friend: {
              id: user.userId,
              userId: user.userId,
              email: accepterInfo?.email || null,
              displayName: accepterName,
              avatarUrl: accepterInfo?.avatarUrl || null,
              status: 'ONLINE' as const,
              lastSeen: new Date().toISOString(),
              friendSince: new Date().toISOString(),
              isFavorite: false,
              note: null,
            },
            chatRoomId: roomId,
          });
        }

        socket.emit('system:info', { message: 'Friend request accepted!' });
      } catch (error) {
        console.error('Accept friend request error:', error);
      }
    });

    // --- Decline Friend Request in Chat ---

    socket.on('friend:decline_in_chat', async (payload: { requestId: string }) => {
      const { requestId } = payload;
      const savedChat = activeChats.get(user.userId);
      const resolvedPeerUserId = peerUserId || savedChat?.peerUserId;
      const resolvedRoomId = currentRoomId || savedChat?.roomId;

      if (!requestId || !resolvedPeerUserId) {
        socket.emit('system:warning', { message: 'Cannot decline friend request.' });
        return;
      }

      try {
        const request = await prisma.friendRequest.findUnique({
          where: { id: requestId },
          include: { sender: { select: { id: true, displayName: true, username: true } } }
        });

        if (!request || (request.receiverId !== user.userId && request.senderId !== user.userId)) {
          socket.emit('system:warning', { message: 'Friend request not found.' });
          return;
        }

        if (request.status !== 'PENDING') {
          socket.emit('system:info', { message: 'Request already processed.' });
          return;
        }

        await prisma.friendRequest.update({
          where: { id: requestId },
          data: { status: 'REJECTED' }
        });

        // Fetch decliner's info from DB since socket.data.user only has userId/email
        const declinerInfo = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { displayName: true, username: true }
        });
        const declinerName = declinerInfo?.displayName || declinerInfo?.username || 'Stranger';

        socket.emit('friend:request_declined_in_chat', {
          requestId,
          declinedByName: declinerName
        });

        if (resolvedRoomId) {
          socket.to(resolvedRoomId).emit('friend:request_declined_in_chat', {
            requestId,
            declinedByName: declinerName
          });
        }

        socket.emit('system:info', { message: 'Friend request declined.' });
      } catch (error) {
        console.error('Decline friend request error:', error);
      }
    });

    // --- Private Chat: Get or Create DM Room ---

    socket.on('private:get_or_create_room', async (payload: { peerUserId: string }, callback) => {
      const { peerUserId } = payload;
      if (!peerUserId) {
        callback?.({ error: 'peerUserId required' });
        return;
      }

      try {
        let room = await prisma.chatRoom.findFirst({
          where: {
            type: 'DIRECT',
            AND: [
              { members: { some: { userId: user.userId } } },
              { members: { some: { userId: peerUserId } } }
            ]
          }
        });

        if (!room) {
          const roomId = uuidv4();
          room = await prisma.chatRoom.create({
            data: {
              id: roomId,
              type: 'DIRECT',
              members: {
                createMany: {
                  data: [
                    { userId: user.userId },
                    { userId: peerUserId }
                  ]
                }
              }
            }
          });
        }

        // Join the socket room for signaling
        socket.join(room.id);

        callback?.({ roomId: room.id });
      } catch (error) {
        console.error('get_or_create_room error:', error);
        callback?.({ error: 'Failed to get or create room' });
      }
    });

    // --- Private Chat Messages ---

    socket.on('private:send', async (payload: { roomId: string; text: string; replyToId?: string; imageUrl?: string; viewOnce?: boolean }) => {
      const { roomId, text, replyToId, imageUrl, viewOnce } = payload;
      if ((!text && !imageUrl) || !roomId) return;

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

        const modResult = text ? ModerationService.checkContent(text) : { allowed: true, cleanedText: null, reason: null };
        if (!modResult.allowed) {
          socket.emit('system:warning', { message: (modResult as any).reason || 'Content rejected.' });
          return;
        }

        const message = await prisma.privateMessage.create({
          data: {
            roomId,
            senderId: user.userId,
            receiverId: otherMember.userId,
            text: modResult.cleanedText || text || '',
            status: 'SENT',
            replyToId: replyToId || null,
            imageUrl: imageUrl || null,
            viewOnce: imageUrl ? (viewOnce ?? false) : false,
          }
        });

        const emitData = {
          ...message,
          createdAt: message.createdAt.toISOString(),
          imageUrl: imageUrl || message.imageUrl || null,
          viewOnce: message.viewOnce,
        };

        socket.emit('private:message', emitData);

        const peerSocketId = await MatchmakerService.getActiveSocket(otherMember.userId);
        if (peerSocketId) {
          io.to(peerSocketId).emit('private:message', emitData);
          // Update status to DELIVERED and notify sender
          await prisma.privateMessage.update({ where: { id: message.id }, data: { status: 'DELIVERED' } });
          io.to(peerSocketId).emit('private:delivered', { messageId: message.id, roomId });
          socket.emit('private:status_update', { messageId: message.id, status: 'DELIVERED' });
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
        socket.emit('system:info', { message: 'Report submitted successfully. Thank you.' });
      } catch (error) {
        console.error('Reporting error', error);
      }
    });

    socket.on('user:block', async () => {
      const savedChat = activeChats.get(user.userId);
      const resolvedPeerUserId = peerUserId || savedChat?.peerUserId;
      const resolvedRoomId = currentRoomId || savedChat?.roomId;

      if (!resolvedPeerUserId) return;
      try {
        await prisma.block.create({
          data: { blockerId: user.userId, blockedId: resolvedPeerUserId }
        });
        
        // Clean up friend relation
        await prisma.friend.deleteMany({
          where: {
            OR: [
              { userId1: user.userId, userId2: resolvedPeerUserId },
              { userId1: resolvedPeerUserId, userId2: user.userId }
            ]
          }
        });

        // Clean up friend requests
        await prisma.friendRequest.deleteMany({
          where: {
            OR: [
              { senderId: user.userId, receiverId: resolvedPeerUserId },
              { senderId: resolvedPeerUserId, receiverId: user.userId }
            ]
          }
        });

        socket.emit('system:info', { message: 'Stranger blocked.' });
        if (resolvedRoomId) {
          activeChats.delete(user.userId);
          socket.to(resolvedRoomId).emit('chat:peer_left', { reason: 'block' });
          socket.leave(resolvedRoomId);
          currentRoomId = null;
          peerUserId = null;
        }
      } catch (error) {
        console.error('Blocking error', error);
      }
    });

    // --- Disconnect ---

    // --- Out-of-Chat Accept/Decline (Friends Page) ---

    socket.on('friend:accept_request', async (payload: { requestId: string }) => {
      const { requestId } = payload;
      if (!requestId) return;

      try {
        const request = await prisma.friendRequest.findUnique({
          where: { id: requestId },
          include: { sender: { select: { id: true, displayName: true, username: true } } }
        });

        console.log('[friend:accept_request] check:', {
          requestId,
          request_receiverId: request?.receiverId,
          user_userId: user.userId,
          match: request?.receiverId === user.userId
        });

        if (!request || request.receiverId !== user.userId) {
          socket.emit('system:warning', { message: 'Friend request not found.' });
          return;
        }

        if (request.status !== 'PENDING') {
          socket.emit('system:info', { message: 'Request already processed.' });
          return;
        }

        const roomId = uuidv4();

        await prisma.$transaction([
          prisma.friendRequest.update({
            where: { id: requestId },
            data: { status: 'ACCEPTED' }
          }),
          prisma.friend.create({
            data: { userId1: user.userId, userId2: request.senderId, status: 'ACCEPTED' }
          }),
          prisma.chatRoom.create({
            data: {
              id: roomId,
              type: 'DIRECT',
              members: {
                createMany: {
                  data: [
                    { userId: user.userId },
                    { userId: request.senderId }
                  ]
                }
              }
            }
          })
        ]);

        const friendForReceiver = {
          id: request.sender.id,
          userId: request.sender.id,
          email: null,
          displayName: request.sender?.displayName || request.sender?.username || 'Stranger',
          avatarUrl: null,
          status: 'ONLINE' as const,
          lastSeen: new Date().toISOString(),
          friendSince: new Date().toISOString(),
          isFavorite: false,
          note: null,
        };

        const receiverSocket = [...io.sockets.sockets.values()].find(
          (s) => s.data.user?.userId === request.senderId
        );
        if (receiverSocket) {
          receiverSocket.emit('friend:request_accepted', {
            requestId,
            chatRoomId: roomId,
            friend: {
              id: user.userId,
              userId: user.userId,
              email: null,
              displayName: user.displayName || user.username || 'Stranger',
              avatarUrl: null,
              status: 'ONLINE' as const,
              lastSeen: new Date().toISOString(),
              friendSince: new Date().toISOString(),
              isFavorite: false,
              note: null,
            }
          });
        }

        socket.emit('friend:request_accepted', {
          requestId,
          chatRoomId: roomId,
          friend: friendForReceiver,
        });

        socket.emit('system:info', { message: 'Friend request accepted!' });
      } catch (error) {
        console.error('Accept friend request error:', error);
      }
    });

    socket.on('friend:decline_request', async (payload: { requestId: string }) => {
      const { requestId } = payload;
      if (!requestId) return;

      try {
        const request = await prisma.friendRequest.findUnique({
          where: { id: requestId }
        });

        if (!request || (request.receiverId !== user.userId && request.senderId !== user.userId)) {
          socket.emit('system:warning', { message: 'Friend request not found.' });
          return;
        }

        if (request.status !== 'PENDING') {
          socket.emit('system:info', { message: 'Request already processed.' });
          return;
        }

        await prisma.friendRequest.update({
          where: { id: requestId },
          data: { status: 'REJECTED' }
        });

        const receiverSocket = [...io.sockets.sockets.values()].find(
          (s) => s.data.user?.userId === request.senderId
        );
        if (receiverSocket) {
          receiverSocket.emit('friend:request_declined', {
            requestId,
            declinedByName: user.displayName || user.username || 'Stranger'
          });
        }

        socket.emit('friend:request_declined', {
          requestId,
          declinedByName: user.displayName || user.username || 'Stranger'
        });
      } catch (error) {
        console.error('Decline friend request error:', error);
      }
    });

    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.id} (User: ${user.userId})`);

      try {
        await prisma.user.update({
          where: { id: user.userId },
          data: { status: 'OFFLINE', lastSeen: new Date() }
        });
      } catch (e: any) {
        // User may have been deleted — ignore P2025
        if (e?.code !== 'P2025') console.error('Disconnect update error:', e);
      }

      io.emit('user:status', { userId: user.userId, status: 'OFFLINE', lastSeen: new Date().toISOString() });

      await MatchmakerService.leaveQueue(user.userId, 'text');
      await MatchmakerService.leaveQueue(user.userId, 'voice');
      await MatchmakerService.leaveQueue(user.userId, 'video');
      await MatchmakerService.removeActiveSocket(user.userId);

      if (currentRoomId) {
        const uid = user.userId;
        const savedRoomId = currentRoomId;
        // Immediately notify peer that user went offline
        socket.to(savedRoomId).emit('chat:peer_offline');
        const timer = setTimeout(() => {
          const entry = activeChats.get(uid);
          if (entry) {
            activeChats.delete(uid);
            io.to(savedRoomId).emit('chat:peer_left', { reason: 'disconnected' });
          }
          disconnectTimers.delete(uid);
        }, 30000);
        disconnectTimers.set(uid, timer);

        // Check if peer is also offline (has a disconnect timer)
        const chatEntry = activeChats.get(uid);
        const peerId = chatEntry?.peerUserId || peerUserId;
        if (peerId && disconnectTimers.has(peerId)) {
          // Both users are offline — start 60s timer to fully delete the chat
          if (!bothOfflineTimers.has(savedRoomId)) {
            const bothTimer = setTimeout(() => {
              // Delete both entries and clean up
              activeChats.delete(uid);
              activeChats.delete(peerId);
              disconnectTimers.delete(uid);
              disconnectTimers.delete(peerId);
              bothOfflineTimers.delete(savedRoomId);
              io.to(savedRoomId).emit('chat:peer_left', { reason: 'disconnected' });
              io.to(savedRoomId).emit('chat:ended');
              // Clean up messages
              import('../services/cleanup.js').then(({ CleanupService }) => {
                CleanupService.deleteAnonymousChatMessages(savedRoomId).catch(() => {});
              });
              console.log(`[Chat] Both users offline >60s, deleted room: ${savedRoomId}`);
            }, 60000);
            bothOfflineTimers.set(savedRoomId, bothTimer);
          }
        }
      }
    });
  });
};
