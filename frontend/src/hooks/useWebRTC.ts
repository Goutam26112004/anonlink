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
    setConnectionQuality
  } = useChatStore();

  const { socket } = useSocket();
  const pcRef = useRef<RTCPeerConnection | null>(null);

  /**
   * Fetch Ephemeral ICE configuration from Coturn credential API.
   */
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

  /**
   * Initialize Local Media Capture.
   */
  const startLocalMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, frameRate: 24 },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Failed to access camera or microphone:', error);
      // Fallback to audio only
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setLocalStream(audioStream);
        return audioStream;
      } catch (err) {
        console.error('Failed fallback audio capture:', err);
      }
    }
    return null;
  };

  /**
   * Stop all active local tracks.
   */
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

  /**
   * Initialize Peer Connection & Listeners.
   */
  const initPeerConnection = async (room: string, activeLocalStream: MediaStream) => {
    const rtcConfig = await fetchIceConfig();
    const peerConnection = new RTCPeerConnection(rtcConfig);
    pcRef.current = peerConnection;
    setPc(peerConnection);

    // Add local tracks to peer connection
    activeLocalStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, activeLocalStream);
    });

    // Listen for candidate discovery
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('chat:signal', {
          roomId: room,
          signal: { candidate: event.candidate }
        });
      }
    };

    // Track remote tracks
    peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    // Connection Quality Checker Loop
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
            if (rtt < 0.15) {
              setConnectionQuality('excellent');
            } else if (rtt < 0.3) {
              setConnectionQuality('fair');
            } else {
              setConnectionQuality('poor');
            }
          }
        });
      } catch (e) {
        // Stats error ignore
      }
    }, 3000);

    return peerConnection;
  };

  /**
   * Negotiate connection (Offerer role).
   */
  const createOffer = async (peerConnection: RTCPeerConnection, room: string) => {
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket?.emit('chat:signal', { roomId: room, signal: { sdp: offer } });
    } catch (e) {
      console.error('Failed to create WebRTC offer:', e);
    }
  };

  // Listen for socket signaling messages
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

  // WebRTC Match Lifecycle Triggers
  useEffect(() => {
    if (roomId) {
      const setupCall = async () => {
        const stream = localStream || (await startLocalMedia());
        if (stream) {
          const connection = await initPeerConnection(roomId, stream);
          // Let matching initiator trigger the offer
          // Simple logic: user with alphabetically lower socket ID triggers offer
          if (socket && socket.id && socket.id < (roomId)) {
            await createOffer(connection, roomId);
          }
        }
      };
      setupCall();
    } else {
      // Cleanup on room teardown
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
        setPc(null);
      }
      setRemoteStream(null);
      setConnectionQuality('searching');
    }
  }, [roomId]);

  /**
   * Toggle microphone mute.
   */
  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicMuted(!audioTrack.enabled);
      }
    }
  };

  /**
   * Toggle camera off/on.
   */
  const toggleCam = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCamOff(!videoTrack.enabled);
      }
    }
  };

  /**
   * Screen Share Toggle.
   */
  const toggleScreenShare = async () => {
    if (!pcRef.current) return;

    if (screenStream) {
      // Stop screen sharing and return to camera
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);

      // Re-enable camera track
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          const sender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) await sender.replaceTrack(videoTrack);
        }
      }
    } else {
      // Start screen sharing
      try {
        const captureStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(captureStream);

        const screenTrack = captureStream.getVideoTracks()[0];
        if (screenTrack) {
          const sender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) await sender.replaceTrack(screenTrack);

          screenTrack.onended = () => {
            toggleScreenShare(); // return to camera when user stops sharing via browser bar
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
