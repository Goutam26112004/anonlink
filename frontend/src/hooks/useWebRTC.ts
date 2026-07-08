import { useEffect, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import { useSocket } from './useSocket';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export const useWebRTC = () => {
  const {
    token,
    roomId,
    localStream,
    setLocalStream,
    setRemoteStream,
    screenStream,
    setScreenStream,
    pc,
    setPc,
    isMicMuted,
    setMicMuted,
    isCamOff,
    setCamOff,
    setConnectionQuality,
    chatMode
  } = useChatStore();

  const { socket } = useSocket();
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const fetchIceConfig = async (): Promise<RTCConfiguration> => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/webrtc/credentials`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch TURN configurations');
      const data = await res.json();
      return { iceServers: data.iceServers };
    } catch (error) {
      console.warn('TURN config fetch error, falling back to public STUN:', error);
      return {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      };
    }
  };

  const startLocalMedia = async (mode?: 'text' | 'voice' | 'video') => {
    const mediaType = mode || chatMode || 'text';

    if (mediaType === 'text') return null;

    try {
      const constraints: MediaStreamConstraints = {
        audio: mediaType === 'voice' || mediaType === 'video'
          ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
          : false,
        video: mediaType === 'video'
          ? { width: 640, height: 480, frameRate: 24 }
          : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error(`Failed to access ${mediaType} devices:`, error);
      if (mediaType === 'video') {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setLocalStream(audioStream);
          return audioStream;
        } catch (err) {
          console.error('Failed fallback audio capture:', err);
        }
      }
    }
    return null;
  };

  const stopLocalMedia = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
    }
  };

  const initPeerConnection = async (room: string, activeLocalStream: MediaStream) => {
    const rtcConfig = await fetchIceConfig();
    const peerConnection = new RTCPeerConnection(rtcConfig);
    pcRef.current = peerConnection;
    setPc(peerConnection);

    activeLocalStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, activeLocalStream);
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('chat:signal', {
          roomId: room,
          signal: { candidate: event.candidate }
        });
      }
    };

    peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    const interval = setInterval(async () => {
      if (peerConnection.connectionState === 'closed') {
        clearInterval(interval);
        return;
      }
      try {
        const stats = await peerConnection.getStats();
        stats.forEach((report) => {
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            const rtt = report.currentRoundTripTime;
            if (rtt < 0.15) setConnectionQuality('excellent');
            else if (rtt < 0.3) setConnectionQuality('fair');
            else setConnectionQuality('poor');
          }
        });
      } catch (e) {}
    }, 3000);

    return peerConnection;
  };

  const createOffer = async (peerConnection: RTCPeerConnection, room: string) => {
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket?.emit('chat:signal', { roomId: room, signal: { sdp: offer } });
    } catch (e) {
      console.error('Failed to create WebRTC offer:', e);
    }
  };

  useEffect(() => {
    if (!socket || !roomId) return;

    const handleSignal = async (payload: { signal: any }) => {
      const { signal } = payload;
      if (!pcRef.current) return;

      try {
        if (signal.sdp) {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          if (signal.sdp.type === 'offer') {
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);
            socket.emit('chat:signal', { roomId, signal: { sdp: answer } });
          }
        } else if (signal.candidate) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch (error) {
        console.error('Signaling processing failed:', error);
      }
    };

    socket.on('chat:signal', handleSignal);

    return () => {
      socket.off('chat:signal', handleSignal);
    };
  }, [socket, roomId]);

  useEffect(() => {
    if (roomId && (chatMode === 'voice' || chatMode === 'video')) {
      const setupCall = async () => {
        const stream = localStream || (await startLocalMedia(chatMode));
        if (stream) {
          const connection = await initPeerConnection(roomId, stream);
          if (socket && socket.id && socket.id < roomId) {
            await createOffer(connection, roomId);
          }
        }
      };
      setupCall();
    } else if (!roomId) {
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
        setPc(null);
      }
      setRemoteStream(null);
      setConnectionQuality('searching');
    } else if (roomId && chatMode === 'text') {
      setRemoteStream(null);
      setConnectionQuality('searching');
    }
  }, [roomId, chatMode]);

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleCam = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCamOff(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!pcRef.current) return;

    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);

      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          const sender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) await sender.replaceTrack(videoTrack);
        }
      }
    } else {
      try {
        const captureStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(captureStream);

        const screenTrack = captureStream.getVideoTracks()[0];
        if (screenTrack) {
          const sender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) await sender.replaceTrack(screenTrack);

          screenTrack.onended = () => {
            toggleScreenShare();
          };
        }
      } catch (err) {
        console.error('Screen sharing acquisition failed:', err);
      }
    }
  };

  return {
    startLocalMedia,
    stopLocalMedia,
    toggleMic,
    toggleCam,
    toggleScreenShare,
    isMicMuted,
    isCamOff,
    isSharingScreen: !!screenStream
  };
};
