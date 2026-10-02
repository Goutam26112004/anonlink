import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useChatStore } from '../store/chatStore';
import { PrivateChatMessage, FriendRequestData, FriendData, MessageStatusType } from '@anon-chat/types';
import { getApiBase } from '../lib/api';

// ── Chat persistence helpers ──
function saveActiveChat() {
  try {
    const { roomId, peerName, messages, matchStatus } = useChatStore.getState();
    if (roomId && matchStatus === 'chat') {
      sessionStorage.setItem('activeChat', JSON.stringify({
        roomId, peerName, matchStatus,
        messages: messages.slice(-100), // Keep last 100 messages
      }));
    }
  } catch {}
}

function clearActiveChat() {
  try { sessionStorage.removeItem('activeChat'); } catch {}
}

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const {
    token,
    setMatchStatus,
    setRoomId,
    setPeerName,
    addMessage,
    removeMessageById,
    clearMessages,
    setIsTyping,
    addNotification,
    setQueueStats,
    addFriend,
    addFriendRequest,
    removeFriendRequest,
    addPrivateChatRoom,
    addPrivateMessage,
    setPrivateMessages,
    setActivePrivateRoom,
    setElapsedSec,
    setShowReportModal,
    setSocketDisconnected,
    addBlockedUser,
    friends,
    setPeerStatus,
    setChatMode,
    setPeerLastSeen,
    setSessionCode,
    setPendingFriendRequestOnReconnect,
    setPendingAcceptRequestId,
    setSocket,
    setIsPrivateChat,
    roomId: storeRoomId,
    matchStatus: storeMatchStatus
  } = useChatStore();

  const isUpgradedRef = useRef(false);
  const roomIdRef = useRef(storeRoomId);
  const matchStatusRef = useRef(storeMatchStatus);
  roomIdRef.current = storeRoomId;
  matchStatusRef.current = storeMatchStatus;

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    if (socketRef.current) {
      socketRef.current.auth = { token };
      const currentSocket = socketRef.current;
      return () => {
        if (isUpgradedRef.current) {
          isUpgradedRef.current = false;
          return;
        }
        currentSocket.disconnect();
        if (socketRef.current === currentSocket) socketRef.current = null;
        setSocket(null);
      };
    }

    const socket = io(getApiBase(), {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;
    setSocket(socket);

    socket.on('connect', () => {
      console.log('Socket.IO connection established');
      setSocketDisconnected(false);
      const canRejoin = !!(roomIdRef.current && (matchStatusRef.current === 'chat' || matchStatusRef.current === 'reconnecting'));
      if (canRejoin) {
        setPeerStatus('online');
        socket.emit('chat:rejoin');
        // If rejoin doesn't succeed within 5s, clear state and go to idle
        const rejoinTimeout = setTimeout(() => {
          if (useChatStore.getState().matchStatus === 'reconnecting') {
            setMatchStatus('idle');
            setRoomId(null);
            setPeerName(null);
            clearActiveChat();
            addNotification({ title: 'Chat Expired', message: 'Previous chat session has expired.' });
          }
        }, 5000);
        // Clear timeout when rejoined succeeds
        const onRejoined = () => {
          clearTimeout(rejoinTimeout);
          socket.off('chat:rejoined', onRejoined);
        };
        socket.on('chat:rejoined', onRejoined);
      }
      const deferredState = useChatStore.getState();
      if (deferredState.pendingAcceptRequestId && !canRejoin) {
        setPendingAcceptRequestId(null);
        addNotification({ title: 'Chat Ended', message: 'Could not accept friend request — chat session ended.' });
      }
      if (deferredState.pendingFriendRequestOnReconnect && !canRejoin) {
        setPendingFriendRequestOnReconnect(false);
        addNotification({ title: 'Chat Ended', message: 'Could not send friend request — chat session ended.' });
      }
    });

    socket.on('match:searching', (payload: { activeCount?: number; estimatedWaitSec?: number }) => {
      setMatchStatus('searching');
      if (payload) {
        setQueueStats(payload.activeCount || 0, payload.estimatedWaitSec || 0);
      }
    });

    socket.on('match:found', (payload: { roomId: string; sessionCode: string; peerName: string; isOfferer?: boolean }) => {
      clearMessages();
      setRoomId(payload.roomId);
      setPeerName(payload.peerName);
      setPeerStatus('online');
      setPeerLastSeen(new Date().toISOString());
      setMatchStatus('chat');
      setSessionCode(payload.sessionCode);
      // Server designates exactly one side as the WebRTC offerer so voice/
      // video matches actually connect (see useWebRTC's setupCall()).
      useChatStore.setState({ isCallOfferer: !!payload.isOfferer });
      addNotification({
        title: 'Stranger Connected',
        message: `You are matched with ${payload.peerName}`
      });
      // Persist chat state
      setTimeout(saveActiveChat, 100);
    });

    socket.on('match:left', () => {
      setMatchStatus('partner_left');
    });

    socket.on('chat:receive', (msg: any) => {
      if (msg.sender === 'self') return;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setIsTyping(false);
      setPeerStatus('online');
      addMessage({
        id: msg.messageId,
        sender: msg.sender,
        text: msg.text,
        sentAt: msg.sentAt,
        encrypted: msg.encrypted,
        imageUrl: msg.imageUrl,
        viewOnce: msg.viewOnce === true,
      });
      // Update persisted chat
      setTimeout(saveActiveChat, 50);
    });

    socket.on('chat:typing', (payload: { isTyping: boolean }) => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setIsTyping(payload.isTyping);
      setPeerStatus(payload.isTyping ? 'typing' : 'online');
      if (payload.isTyping) {
        setPeerLastSeen(new Date().toISOString());
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          setPeerStatus('online');
        }, 3000);
      }
    });

    socket.on('chat:peer_left', (payload?: { reason?: string }) => {
      const reason = payload?.reason || 'disconnected';
      setPeerStatus('offline');
      setRoomId(null);
      setPeerName(null);
      setMatchStatus('partner_left');
      setPendingFriendRequestOnReconnect(false);
      clearActiveChat();
      addNotification({
        title: 'Stranger Disconnected',
        message: reason === 'skip'
          ? 'Stranger skipped to next match.'
          : reason === 'block'
            ? 'Stranger blocked.'
            : 'The stranger has disconnected.'
      });
    });

    socket.on('chat:peer_reconnected', () => {
      setPeerStatus('online');
      setPeerLastSeen(new Date().toISOString());
      addNotification({
        title: 'Stranger Reconnected',
        message: 'The stranger has reconnected.'
      });
    });

    socket.on('chat:peer_offline', () => {
      setPeerStatus('offline');
      setPeerLastSeen(new Date().toISOString());
    });

    socket.on('chat:rejoined', () => {
      setPeerStatus('online');
      setMatchStatus('chat');
      console.log('[chat:rejoined] room restored, checking deferred actions');
      const currState = useChatStore.getState();
      if (currState.pendingFriendRequestOnReconnect) {
        console.log('[chat:rejoined] emitting friend:request_in_chat');
        setPendingFriendRequestOnReconnect(false);
        socket.emit('friend:request_in_chat');
      }
      if (currState.pendingAcceptRequestId) {
        console.log('[chat:rejoined] emitting friend:accept_in_chat for', currState.pendingAcceptRequestId);
        const rid = currState.pendingAcceptRequestId;
        setPendingAcceptRequestId(null);
        socket.emit('friend:accept_in_chat', { requestId: rid });
      }
    });

    socket.on('chat:skipped', () => {
      addNotification({ title: 'Skipped', message: 'You skipped to the next stranger.' });
    });

    socket.on('chat:ended', () => {
      setPeerStatus('offline');
      setRoomId(null);
      setPeerName(null);
      setMatchStatus('idle');
      setPendingFriendRequestOnReconnect(false);
      clearActiveChat();
      addNotification({ title: 'Chat Ended', message: 'Chat has ended.' });
    });

    // Friend request events
    socket.on('friend:request_received_in_chat', (payload: FriendRequestData) => {
      addFriendRequest(payload);
      addMessage({
        id: `fr_${payload.id}`,
        type: 'friend_request',
        sender: 'stranger',
        text: '',
        sentAt: new Date().toISOString(),
        requestId: payload.id,
        username: payload.sender?.displayName || payload.sender?.email || 'Stranger',
        senderCreatedAt: (payload.sender as any)?.createdAt
      } as any);
      addNotification({
        title: 'Friend Request',
        message: `New friend request received!`
      });
    });

    socket.on('friend:request_sent_in_chat', (payload: { id: string; receiverName: string; status: string }) => {
      addMessage({
        id: `fr_sent_${payload.id}`,
        type: 'friend_request_sent',
        sender: 'self',
        text: '',
        sentAt: new Date().toISOString(),
        requestId: payload.id,
        friendName: payload.receiverName || 'Stranger',
      } as any);
    });

    socket.on('friend:request_accepted_in_chat', (payload: { requestId: string; friendName?: string; friend?: FriendData; chatRoomId?: string }) => {
      removeMessageById(`fr_${payload.requestId}`);
      removeMessageById(`fr_sent_${payload.requestId}`);
      removeFriendRequest(payload.requestId);
      setIsPrivateChat(true);
      if (payload.friend) {
        addFriend(payload.friend);
      }
      addMessage({
        id: `fr_accept_${payload.requestId}`,
        type: 'friend_request_accepted',
        sender: 'stranger',
        text: '',
        sentAt: new Date().toISOString(),
        requestId: payload.requestId,
        friendName: payload.friendName || 'Stranger',
      } as any);
      addNotification({
        title: 'Friend Request Accepted',
        message: `${payload.friendName || 'Stranger'} is now your friend! Redirecting to private chat...`
      });
      // Migrate current chat messages to the new DM room and redirect
      if (payload.friend?.userId && payload.chatRoomId) {
        const currentMessages = useChatStore.getState().messages;
        // Convert anonymous messages to private message format and store in DM room
        const migratedMessages = currentMessages
          .filter((m: any) => m.text && m.type !== 'friend_request' && m.type !== 'friend_request_sent' && m.type !== 'friend_request_accepted' && m.type !== 'friend_request_declined')
          .map((m: any) => ({
            id: m.id,
            roomId: payload.chatRoomId!,
            senderId: m.sender === 'self' ? (useChatStore.getState().user?.userId || 'self') : payload.friend!.userId,
            receiverId: m.sender === 'self' ? payload.friend!.userId : (useChatStore.getState().user?.userId || 'self'),
            text: m.text || m.content || '',
            status: 'SEEN',
            createdAt: m.sentAt || new Date().toISOString(),
            imageUrl: m.imageUrl || null,
            viewOnce: m.viewOnce || false,
          }));
        if (migratedMessages.length > 0) {
          useChatStore.setState((state: any) => ({
            privateMessages: {
              ...state.privateMessages,
              [payload.chatRoomId!]: migratedMessages,
            }
          }));
        }
        setTimeout(() => {
          window.location.href = `/dm/${payload.friend!.userId}`;
        }, 1500);
      }
    });

    socket.on('friend:request_declined_in_chat', (payload: { requestId: string; declinedByName?: string }) => {
      removeFriendRequest(payload.requestId);
      removeMessageById(`fr_${payload.requestId}`);
      removeMessageById(`fr_sent_${payload.requestId}`);
      addMessage({
        id: `fr_declined_${payload.requestId}`,
        type: 'friend_request_declined',
        sender: 'stranger',
        text: '',
        sentAt: new Date().toISOString(),
        requestId: payload.requestId,
        friendName: payload.declinedByName || 'Stranger',
      } as any);
      addNotification({
        title: 'Friend Request Declined',
        message: `${payload.declinedByName || 'Stranger'} declined your friend request.`
      });
    });

    socket.on('friend:request_received', (payload: FriendRequestData) => {
      addFriendRequest(payload);
      addNotification({
        title: 'Friend Request',
        message: `${payload.sender?.displayName || payload.sender?.email || 'Someone'} sent you a friend request.`
      });
    });

    socket.on('friend:request_accepted', (payload: { requestId: string; chatRoomId: string; friend: any }) => {
      removeFriendRequest(payload.requestId);
      if (payload.friend) {
        addFriend(payload.friend);
      }
      addNotification({
        title: 'Friend Request Accepted',
        message: `${payload.friend?.displayName || payload.friend?.email || 'Someone'} accepted your friend request! Redirecting...`
      });
      // Redirect to DM page with the new friend
      if (payload.friend?.userId) {
        setTimeout(() => {
          window.location.href = `/dm/${payload.friend.userId}`;
        }, 1500);
      }
    });

    socket.on('friend:request_declined', (payload: { requestId: string; declinedByName?: string }) => {
      removeFriendRequest(payload.requestId);
      addNotification({
        title: 'Friend Request Declined',
        message: `${payload.declinedByName || 'Someone'} declined your friend request.`
      });
    });

    socket.on('friend:request_rejected', (payload: { requestId: string }) => {
      removeFriendRequest(payload.requestId);
      addNotification({
        title: 'Friend Request Rejected',
        message: 'Your friend request was rejected.'
      });
    });

    // Private chat events
    socket.on('private:message', (msg: PrivateChatMessage) => {
      addPrivateMessage(msg.roomId, msg);

      const peerUser = friends.find(f => f.userId === msg.senderId);
      if (peerUser) {
        addPrivateChatRoom({
          roomId: msg.roomId,
          peerUser,
          lastMessage: msg
        });
      }

      addNotification({
        title: 'New Message',
        message: `${peerUser?.displayName || 'Friend'} sent a message.`
      });
    });

    socket.on('private:delivered', (payload: { messageId: string; roomId: string }) => {
      useChatStore.getState().updateMessageStatus(payload.roomId, payload.messageId, 'DELIVERED');
    });

    socket.on('private:status_update', (payload: { messageId: string; roomId?: string; status: MessageStatusType }) => {
      // roomId is only included on some emit sites; fall back to scanning all rooms if absent.
      const state = useChatStore.getState();
      const roomId = payload.roomId || Object.keys(state.privateMessages).find((rid) =>
        state.privateMessages[rid].some((m) => m.id === payload.messageId)
      );
      if (roomId) state.updateMessageStatus(roomId, payload.messageId, payload.status);
    });

    socket.on('private:seen', (payload: { roomId: string; userId: string }) => {
      // The other user (payload.userId) has read our messages in this room —
      // mark every message WE sent in this room as SEEN immediately.
      const myUserId = useChatStore.getState().user?.userId;
      if (!myUserId) return;
      useChatStore.getState().markRoomSeenBySender(payload.roomId, myUserId);
    });

    socket.on('private:typing', (_payload: { userId: string; isTyping: boolean }) => {
      // Handled by the DM page's own listener (needs the peer's userId to
      // filter, which this generic handler doesn't have context for).
    });

    // User status
    socket.on('user:status', (payload: { userId: string; status: string }) => {
      // Update friend status in store
    });

    socket.on('system:warning', (payload: { message: string; type?: string; severity?: string }) => {
      // Show in-app warning
      const { setModerationWarning, messages } = useChatStore.getState();
      setModerationWarning(payload.message);
      // Auto-dismiss after 5 seconds
      setTimeout(() => useChatStore.getState().setModerationWarning(null), 5000);
      // Remove the last self message (it was blocked and not delivered)
      const lastSelfIdx = [...messages].reverse().findIndex(m => m.sender === 'self');
      if (lastSelfIdx >= 0) {
        const actualIdx = messages.length - 1 - lastSelfIdx;
        const msgToRemove = messages[actualIdx];
        if (msgToRemove && Date.now() - new Date(msgToRemove.sentAt).getTime() < 3000) {
          // Only remove if it was sent in the last 3 seconds (likely the blocked message)
          useChatStore.setState((s) => ({
            messages: s.messages.filter((_, i) => i !== actualIdx)
          }));
        }
      }
    });

    socket.on('system:info', (payload: { message: string }) => {
      addNotification({
        title: 'System Notice',
        message: payload.message
      });
    });

    socket.on('feature:locked', (payload: { feature: string; message: string }) => {
      alert(payload.message);
    });

    socket.on('disconnect', () => {
      console.log('Socket.IO connection lost');
      setPeerStatus('offline');
      setSocketDisconnected(true);
    });

    socket.on('chat:convert_to_call', (payload: { mediaType: 'voice' | 'video'; initiatedBy: string }) => {
      // For random chat, determine offerer by comparing our userId with initiator
      const myUserId = useChatStore.getState().user?.userId;
      useChatStore.setState({ isCallOfferer: payload.initiatedBy === myUserId });
      setChatMode(payload.mediaType);
    });

    // ── Private Call Events ──

    // Initiator receives this: call is ringing on the other end
    socket.on('call:ringing', (payload: { roomId: string; type: 'voice' | 'video'; initiatedBy: string; initiatorName: string }) => {
      console.log('[Call] Ringing...', payload);
      useChatStore.setState({
        activeCall: { roomId: payload.roomId, type: payload.type, peerName: '' },
      });
    });

    // Receiver gets this: show incoming call UI
    socket.on('call:incoming', (payload: { roomId: string; type: 'voice' | 'video'; initiatedBy: string; initiatorName: string }) => {
      console.log('[Call] Incoming call from:', payload.initiatorName);
      useChatStore.setState({
        incomingCall: payload,
      });
    });

    // Both sides get this after receiver accepts - START WebRTC
    socket.on('call:accepted', (payload: { roomId: string; type: 'voice' | 'video'; acceptedBy: string; acceptorName: string }) => {
      console.log('[Call] Call accepted:', payload);
      const myUserId = useChatStore.getState().user?.userId;
      const isInitiator = payload.acceptedBy !== myUserId;
      useChatStore.setState({
        isCallOfferer: isInitiator,
        incomingCall: null,
        activeCall: { roomId: payload.roomId, type: payload.type, peerName: isInitiator ? payload.acceptorName : '' },
      });
      setRoomId(payload.roomId);
      setChatMode(payload.type);
    });

    // Initiator gets this if receiver declines
    socket.on('call:declined', (payload: { roomId: string; declinedBy: string; declinerName: string }) => {
      console.log('[Call] Call declined by:', payload.declinerName);
      useChatStore.setState({ activeCall: null, incomingCall: null });
      addNotification({ title: 'Call Declined', message: `${payload.declinerName} declined your call.` });
    });

    // Peer gets this when other side ends the call
    socket.on('call:ended', (payload: { roomId: string; endedBy: string }) => {
      console.log('[Call] Call ended');
      // Immediately stop local media tracks
      const { localStream: stream } = useChatStore.getState();
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      useChatStore.setState({ activeCall: null, incomingCall: null, isCallFullscreen: false, localStream: null, remoteStream: null });
      setChatMode('text');
      setRoomId(null);
      addNotification({ title: 'Call Ended', message: 'The call has ended.' });
    });

    // Call error (e.g., user offline)
    socket.on('call:error', (payload: { message: string }) => {
      console.log('[Call] Error:', payload.message);
      useChatStore.setState({ activeCall: null, incomingCall: null });
      addNotification({ title: 'Call Failed', message: payload.message });
      // Show visible toast popup
      import('../components/ui/Toast').then(({ toast }) => {
        toast('error', 'Call Failed', payload.message);
      }).catch(() => {});
    });

    return () => {
      if (isUpgradedRef.current) {
        isUpgradedRef.current = false;
        return;
      }
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
      setSocket(null);
    };
  }, [token]);

  const joinQueue = (interests: string[], language: string, mediaType: 'text' | 'voice' | 'video' = 'text', genderPreference?: string, ageRange?: string) => {
    socketRef.current?.emit('match:join', { interests, language, mediaType, genderPreference, ageRange });
  };

  const leaveQueue = (mediaType: 'text' | 'voice' | 'video' = 'text') => {
    socketRef.current?.emit('match:leave', { mediaType });
    setMatchStatus('idle');
    setElapsedSec(0);
    setShowReportModal(false);
  };

  const sendMessage = (roomId: string, text: string, imageUrl?: string, viewOnce?: boolean) => {
    socketRef.current?.emit('chat:send', { roomId, text, imageUrl, viewOnce });
  };

  const sendTyping = (roomId: string, isTyping: boolean) => {
    socketRef.current?.emit('chat:typing', { roomId, isTyping });
  };

  const skip = () => {
    socketRef.current?.emit('chat:skip');
    setRoomId(null);
    setPeerName(null);
    setElapsedSec(0);
    setShowReportModal(false);
    clearActiveChat();
    // Re-queue immediately for next match instead of going to idle
    const state = useChatStore.getState();
    setMatchStatus('searching');
    socketRef.current?.emit('match:join', {
      interests: [],
      language: 'en',
      mediaType: state.chatMode || 'text',
    });
  };

  const endChat = () => {
    socketRef.current?.emit('chat:end');
    setRoomId(null);
    setPeerName(null);
    setMatchStatus('idle');
    setElapsedSec(0);
    setShowReportModal(false);
    clearActiveChat();
  };

  const report = (reason: string) => {
    socketRef.current?.emit('user:report', { reason });
  };

  const block = () => {
    const state = useChatStore.getState();
    socketRef.current?.emit('user:block');
    if (state.peerName) addBlockedUser(state.peerName);
    setRoomId(null);
    setPeerName(null);
    setMatchStatus('idle');
    setElapsedSec(0);
    setShowReportModal(false);
  };

  // Friend request in chat
  const sendFriendRequestInChat = () => {
    socketRef.current?.emit('friend:request_in_chat');
  };

  const acceptFriendRequestInChat = (requestId: string) => {
    socketRef.current?.emit('friend:accept_in_chat', { requestId });
  };

  // Private messaging
  const privateSend = (roomId: string, text: string) => {
    socketRef.current?.emit('private:send', { roomId, text });
  };

  const privateSendTyping = (roomId: string, isTyping: boolean) => {
    socketRef.current?.emit('private:typing', { roomId, isTyping });
  };

  const privateMarkRead = (roomId: string) => {
    socketRef.current?.emit('private:read', { roomId });
  };

  // Convert text chat to voice/video call
  const convertToCall = (roomId: string, mediaType: 'voice' | 'video') => {
    socketRef.current?.emit('chat:convert_to_call', { roomId, mediaType });
  };

  const upgradeSocket = (newToken: string) => {
    isUpgradedRef.current = true;
    if (socketRef.current) {
      socketRef.current.auth = { token: newToken };
    }
  };

  return {
    socket: socketRef.current,
    joinQueue,
    leaveQueue,
    sendMessage,
    sendTyping,
    skip,
    endChat,
    report,
    block,
    sendFriendRequestInChat,
    acceptFriendRequestInChat,
    convertToCall,
    privateSend,
    privateSendTyping,
    privateMarkRead,
    upgradeSocket
  };
};
