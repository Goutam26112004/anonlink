import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useChatStore } from '../store/chatStore';

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
    setQueueStats
  } = useChatStore();

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Initialize socket connection
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

    socket.on('chat:peer_left', () => {
      setRoomId(null);
      setPeerName(null);
      setMatchStatus('idle');
      addNotification({
        title: 'Stranger Disconnected',
        message: 'The stranger has disconnected. Click match to find another.'
      });
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

    socket.on('disconnect', () => {
      console.log('Socket.IO connection lost');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const joinQueue = (interests: string[], language: string, country: string, mediaType: 'text' | 'voice' | 'video' = 'text') => {
    socketRef.current?.emit('match:join', { interests, language, country, mediaType });
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

  const report = (reason: string) => {
    socketRef.current?.emit('user:report', { reason });
  };

  const block = () => {
    socketRef.current?.emit('user:block');
    setRoomId(null);
    setPeerName(null);
    setMatchStatus('idle');
  };

  return {
    socket: socketRef.current,
    joinQueue,
    leaveQueue,
    sendMessage,
    sendTyping,
    skip,
    report,
    block
  };
};
