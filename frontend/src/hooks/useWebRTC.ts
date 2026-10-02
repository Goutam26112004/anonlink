import { useEffect, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import { apiFetch } from '../lib/api';

export const useWebRTC = () => {
  const {
    token,
    roomId,
    socket,
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
    chatMode,
    isCallOfferer
  } = useChatStore();
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const candidateQueueRef = useRef<RTCIceCandidate[]>([]);
  const roomIdRef = useRef<string | null>(roomId);
  roomIdRef.current = roomId;

  const fetchIceConfig = async (): Promise<RTCConfiguration> => {
    try {
      const data = await apiFetch('/api/v1/webrtc/credentials');
      return { iceServers: data.iceServers };
    } catch (error) {
      console.warn('TURN config fetch error, falling back to public STUN:', error);
      return {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      };
    }
  };

  const startLocalMedia = async (mode?: 'text' | 'voice' | 'video') => {
    const mediaType = mode || chatMode || 'text';
    if (mediaType === 'text') return null;

    try {
      const constraints: MediaStreamConstraints = {
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: mediaType === 'video'
          ? { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24 } }
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

  const processCandidateQueue = async (pc: RTCPeerConnection) => {
    const queue = [...candidateQueueRef.current];
    candidateQueueRef.current = [];
    
    for (const item of queue) {
      try {
        if ((item as any).__sdp) {
          // This is a queued SDP that arrived before PC was ready
          const sdp = (item as any).__sdp;
          if (sdp.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            const { socket: sock } = useChatStore.getState();
            sock?.emit('chat:signal', { roomId: roomIdRef.current, signal: { sdp: answer } });
            console.log('[WebRTC] Processed queued offer, answer sent');
          } else if (sdp.type === 'answer' && pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            console.log('[WebRTC] Processed queued answer');
          }
        } else {
          // Regular ICE candidate
          if (pc.remoteDescription) {
            await pc.addIceCandidate(item as RTCIceCandidate);
          } else {
            // Re-queue if remote description still not set
            candidateQueueRef.current.push(item);
          }
        }
      } catch (e) {
        console.warn('[WebRTC] Failed to process queued item:', e);
      }
    }
  };

  const initPeerConnection = async (room: string, activeLocalStream: MediaStream) => {
    // Clean up existing connection
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    // Don't clear candidateQueue here - there may be signals queued from before PC init

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

    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      console.log('[WebRTC] Connection state:', state);
      if (state === 'connected') setConnectionQuality('excellent');
      else if (state === 'disconnected' || state === 'failed') setConnectionQuality('poor');
    };

    return peerConnection;
  };

  const createOffer = async (peerConnection: RTCPeerConnection, room: string) => {
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket?.emit('chat:signal', { roomId: room, signal: { sdp: offer } });
      console.log('[WebRTC] Offer sent');
    } catch (e) {
      console.error('Failed to create WebRTC offer:', e);
    }
  };

  // Signal handler - register early and keep it stable
  useEffect(() => {
    if (!socket) return;

    const handleSignal = async (payload: { signal: any; roomId?: string }) => {
      const { signal } = payload;
      
      // Ignore ready signals here (handled by setupCall)
      if (signal.ready) return;
      
      if (!pcRef.current) {
        // Queue candidates/signals that arrive before PC is ready
        if (signal.candidate) {
          candidateQueueRef.current.push(new RTCIceCandidate(signal.candidate));
        } else if (signal.sdp) {
          // Queue the SDP too - it might arrive before PC is initialized
          candidateQueueRef.current.push({ __sdp: signal.sdp } as any);
        }
        return;
      }

      const pc = pcRef.current;

      try {
        if (signal.sdp) {
          if (signal.sdp.type === 'offer') {
            console.log('[WebRTC] Received offer, state:', pc.signalingState);
            // Handle glare (both sent offers)
            if (pc.signalingState === 'have-local-offer') {
              const isPolite = !useChatStore.getState().isCallOfferer;
              if (isPolite) {
                await pc.setLocalDescription({ type: 'rollback' });
              } else {
                console.warn('[WebRTC] Ignoring glare offer (we are offerer)');
                return;
              }
            }
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            // Process any queued candidates
            await processCandidateQueue(pc);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('chat:signal', { roomId: roomIdRef.current, signal: { sdp: answer } });
            console.log('[WebRTC] Answer sent');
          } else if (signal.sdp.type === 'answer') {
            if (pc.signalingState === 'have-local-offer') {
              await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
              console.log('[WebRTC] Answer set');
              // Process any queued candidates
              await processCandidateQueue(pc);
            } else {
              console.warn('[WebRTC] Ignoring answer in state:', pc.signalingState);
            }
          }
        } else if (signal.candidate) {
          if (pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } else {
            // Queue if remote description not set yet
            candidateQueueRef.current.push(new RTCIceCandidate(signal.candidate));
          }
        }
      } catch (error) {
        console.error('Signaling processing failed:', error);
      }
    };

    socket.on('chat:signal', handleSignal);

    return () => {
      socket.off('chat:signal', handleSignal);
    };
  }, [socket]);

  // Setup call when roomId + chatMode indicate an active call
  useEffect(() => {
    if (roomId && (chatMode === 'voice' || chatMode === 'video')) {
      const setupCall = async () => {
        // Read latest isCallOfferer from store (may have been set in same batch)
        const shouldOffer = useChatStore.getState().isCallOfferer;
        console.log('[WebRTC] Setting up call, mode:', chatMode, 'offerer:', shouldOffer);

        const stream = localStream || (await startLocalMedia(chatMode));
        if (stream) {
          const connection = await initPeerConnection(roomId, stream);

          // Process any signals that arrived before PC was ready
          if (candidateQueueRef.current.length > 0) {
            console.log('[WebRTC] Processing', candidateQueueRef.current.length, 'queued signals');
            await processCandidateQueue(connection);
          }

          if (shouldOffer) {
            // Signal that we're ready, then wait for receiver's ready signal or timeout
            socket?.emit('chat:signal', { roomId, signal: { ready: true } });
            
            // Wait for receiver to be ready (they'll signal back) or timeout after 3s
            const waitForReady = () => new Promise<void>((resolve) => {
              const timeout = setTimeout(() => {
                console.log('[WebRTC] Timed out waiting for peer ready, sending offer anyway');
                resolve();
              }, 3000);

              const checkReady = (payload: { signal: any }) => {
                if (payload.signal?.ready) {
                  clearTimeout(timeout);
                  socket?.off('chat:signal', checkReady);
                  console.log('[WebRTC] Peer signaled ready');
                  // Small delay to ensure peer PC is fully initialized
                  setTimeout(resolve, 200);
                }
              };
              socket?.on('chat:signal', checkReady);
            });

            await waitForReady();
            await createOffer(connection, roomId);
          } else {
            // Receiver: signal offerer that we're ready
            socket?.emit('chat:signal', { roomId, signal: { ready: true } });
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
      candidateQueueRef.current = [];
      // Stop local media tracks (release mic/camera)
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        setLocalStream(null);
      }
      setRemoteStream(null);
      setConnectionQuality('searching');
    } else if (roomId && chatMode === 'text') {
      // Call ended, clean up
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
        setPc(null);
      }
      candidateQueueRef.current = [];
      // Stop local media tracks (release mic/camera)
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        setLocalStream(null);
      }
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
