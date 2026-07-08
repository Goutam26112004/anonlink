import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useChatStore } from '../store/chatStore';
import { PrivateChatMessage, FriendRequestData } from '@anon-chat/types';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const {
    token,
    setMatchStatus,
    setRoomId,
    setPeerName,
    addMessage,
    clearMessages,
    setIsTyping,
    addNotification,
    setQueueStats,
    addFriendRequest,
    addPrivateChatRoom,
    addPrivateMessage,
    setPrivateMessages,
    setActivePrivateRoom,
    friends
  } = useChatStore();

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(BACKEND_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket.IO connection established');
    });

    socket.on('match:searching', (payload: { activeCount?: number; estimatedWaitSec?: number }) => {
      setMatchStatus('searching');
      if (payload) {
        setQueueStats(payload.activeCount || 0, payload.estimatedWaitSec || 0);
      }
    });

    socket.on('match:found', (payload: { roomId: string; peerName: string }) => {
      clearMessages();
      setRoomId(payload.roomId);
      setPeerName(payload.peerName);
      setMatchStatus('chat');
      addNotification({
        title: 'Stranger Connected',
        message: `You are matched with ${payload.peerName}`
      });
    });

    socket.on('match:left', () => {
      setMatchStatus('idle');
    });

    socket.on('chat:receive', (msg: any) => {
      addMessage({
        id: msg.messageId,
        sender: msg.sender,
        text: msg.text,
        sentAt: msg.sentAt,
        encrypted: msg.encrypted
      });
    });

    socket.on('chat:typing', (payload: { isTyping: boolean }) => {
      setIsTyping(payload.isTyping);
    });

    socket.on('chat:peer_left', (payload?: { reason?: string }) => {
      const reason = payload?.reason || 'disconnected';
      setRoomId(null);
      setPeerName(null);
      setMatchStatus('idle');
      addNotification({
        title: 'Stranger Disconnected',
        message: reason === 'skip'
          ? 'Stranger skipped to next match.'
          : reason === 'block'
            ? 'Stranger blocked.'
            : 'The stranger has disconnected.'
      });
    });

    socket.on('chat:skipped', () => {
      addNotification({ title: 'Skipped', message: 'You skipped to the next stranger.' });
    });

    socket.on('chat:ended', () => {
      addNotification({ title: 'Chat Ended', message: 'Chat has ended.' });
    });

    // Friend request events
    socket.on('friend:request_received_in_chat', (payload: FriendRequestData) => {
      addFriendRequest(payload);
      addNotification({
        title: 'Friend Request',
        message: `New friend request received!`
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
      addNotification({
        title: 'Friend Request Accepted',
        message: `${payload.friend?.displayName || payload.friend?.email || 'Someone'} accepted your friend request!`
      });
    });

    socket.on('friend:request_rejected', (payload: { requestId: string }) => {
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
      addNotification({ title: 'Delivered', message: 'Message delivered.' });
    });

    socket.on('private:seen', (payload: { roomId: string; userId: string }) => {
      addNotification({ title: 'Seen', message: 'Message seen.' });
    });

    socket.on('private:typing', (payload: { userId: string; isTyping: boolean }) => {
      // Handle typing indicator
    });

    // User status
    socket.on('user:status', (payload: { userId: string; status: string }) => {
      // Update friend status in store
    });

    socket.on('system:warning', (payload: { message: string }) => {
      alert(`Warning: ${payload.message}`);
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
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const joinQueue = (interests: string[], language: string, mediaType: 'text' | 'voice' | 'video' = 'text') => {
    socketRef.current?.emit('match:join', { interests, language, mediaType });
  };

  const leaveQueue = (mediaType: 'text' | 'voice' | 'video' = 'text') => {
    socketRef.current?.emit('match:leave', { mediaType });
    setMatchStatus('idle');
  };

  const sendMessage = (roomId: string, text: string) => {
    socketRef.current?.emit('chat:send', { roomId, text });
  };

  const sendTyping = (roomId: string, isTyping: boolean) => {
    socketRef.current?.emit('chat:typing', { roomId, isTyping });
  };

  const skip = () => {
    socketRef.current?.emit('chat:skip');
    setRoomId(null);
    setPeerName(null);
    setMatchStatus('idle');
  };

  const endChat = () => {
    socketRef.current?.emit('chat:end');
    setRoomId(null);
    setPeerName(null);
    setMatchStatus('idle');
  };

  const report = (reason: string) => {
    socketRef.current?.emit('user:report', { reason });
  };

  const block = () => {
    socketRef.current?.emit('user:block');
    setRoomId(null);
    setPeerName(null);
    setMatchStatus('idle');
  };

  // Friend request in chat
  const sendFriendRequestInChat = () => {
    socketRef.current?.emit('friend:request_in_chat');
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
    privateSend,
    privateSendTyping,
    privateMarkRead
  };
};
