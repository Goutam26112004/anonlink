"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Video, Mic, MicOff, VideoOff, Minimize2, Maximize2, X } from "lucide-react";
import { useChatStore } from "../../store/chatStore";

// ── Incoming Call Overlay (ring screen) ──
export function IncomingCallOverlay() {
  const incomingCall = useChatStore((s) => s.incomingCall);
  const socket = useChatStore((s) => s.socket);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!incomingCall || !mounted) return null;

  const handleAccept = () => {
    socket?.emit("call:accept", { roomId: incomingCall.roomId, type: incomingCall.type });
  };

  const handleDecline = () => {
    socket?.emit("call:decline", { roomId: incomingCall.roomId });
    useChatStore.setState({ incomingCall: null });
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/80 backdrop-blur-lg"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 30 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="flex flex-col items-center gap-6 p-8"
        >
          {/* Pulsing ring animation */}
          <div className="relative">
            <div className="absolute inset-0 w-28 h-28 rounded-full bg-[var(--color-signal-violet)]/20 animate-ping" />
            <div className="absolute inset-2 w-24 h-24 rounded-full bg-[var(--color-signal-violet)]/30 animate-pulse" />
            <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-[var(--color-signal-violet)] to-purple-700 flex items-center justify-center shadow-2xl shadow-[var(--color-signal-violet)]/40">
              {incomingCall.type === "video" ? (
                <Video className="w-10 h-10 text-white" />
              ) : (
                <Phone className="w-10 h-10 text-white" />
              )}
            </div>
          </div>

          {/* Caller info */}
          <div className="text-center">
            <p className="text-xl font-bold text-white mb-1">{incomingCall.initiatorName}</p>
            <p className="text-sm text-white/60">
              Incoming {incomingCall.type === "video" ? "Video" : "Voice"} Call
            </p>
          </div>

          {/* Animated dots */}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white/60 animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-white/60 animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-white/60 animate-bounce [animation-delay:300ms]" />
          </div>

          {/* Accept / Decline buttons */}
          <div className="flex items-center gap-8 mt-4">
            <button
              onClick={handleDecline}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 transition-all hover:scale-110 cursor-pointer"
            >
              <PhoneOff className="w-7 h-7 text-white" />
            </button>
            <button
              onClick={handleAccept}
              className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg shadow-green-500/30 transition-all hover:scale-110 cursor-pointer"
            >
              <Phone className="w-7 h-7 text-white" />
            </button>
          </div>

          <div className="flex items-center gap-6 text-xs text-white/40 mt-2">
            <span>Decline</span>
            <span>Accept</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

// ── Active Call UI (voice bar + video full-screen) ──
export function ActiveCallUI() {
  const chatMode = useChatStore((s) => s.chatMode);
  const localStream = useChatStore((s) => s.localStream);
  const remoteStream = useChatStore((s) => s.remoteStream);
  const activeCall = useChatStore((s) => s.activeCall);
  const isCallFullscreen = useChatStore((s) => s.isCallFullscreen);
  const socket = useChatStore((s) => s.socket);
  const isMicMuted = useChatStore((s) => s.isMicMuted);
  const isCamOff = useChatStore((s) => s.isCamOff);
  const [callDuration, setCallDuration] = useState(0);
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const localVideoElRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoElRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // Call timer
  useEffect(() => {
    if (activeCall && (chatMode === "voice" || chatMode === "video")) {
      timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    } else {
      setCallDuration(0);
    }
  }, [activeCall, chatMode]);

  // Ref callbacks to attach streams directly when elements mount
  const attachLocalVideo = (el: HTMLVideoElement | null) => {
    if (el) {
      localVideoElRef.current = el;
      if (localStream && el.srcObject !== localStream) {
        el.srcObject = localStream;
      }
    }
  };
  const attachRemoteVideo = (el: HTMLVideoElement | null) => {
    if (el) {
      remoteVideoElRef.current = el;
      if (remoteStream && el.srcObject !== remoteStream) {
        el.srcObject = remoteStream;
      }
    }
  };
  const attachRemoteAudio = (el: HTMLAudioElement | null) => {
    if (el && remoteStream) {
      el.srcObject = remoteStream;
    }
  };

  // Re-attach streams when they change (handles late-arriving streams)
  useEffect(() => {
    if (localVideoElRef.current && localStream) {
      localVideoElRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoElRef.current && remoteStream) {
      remoteVideoElRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const isInCall = activeCall && (chatMode === "voice" || chatMode === "video");
  if (!isInCall || !mounted) return null;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const endCall = () => {
    socket?.emit("call:end", { roomId: activeCall.roomId });
    // Stop local media tracks immediately
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    useChatStore.setState({ activeCall: null, isCallFullscreen: false, localStream: null, remoteStream: null });
    useChatStore.getState().setChatMode("text");
    useChatStore.getState().setRoomId(null);
  };

  const toggleMic = () => {
    if (localStream) {
      const track = localStream.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        useChatStore.setState({ isMicMuted: !track.enabled });
      }
    }
  };

  const toggleCam = () => {
    if (localStream) {
      const track = localStream.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        useChatStore.setState({ isCamOff: !track.enabled });
      }
    }
  };

  const toggleFullscreen = () => {
    useChatStore.setState({ isCallFullscreen: !isCallFullscreen });
  };

  // ── Full-screen Video Call ──
  if (chatMode === "video" && isCallFullscreen) {
    return createPortal(
      <div className="fixed inset-0 z-[9997] bg-black flex flex-col">
        {/* Remote video (full screen) */}
        <div className="flex-1 relative overflow-hidden">
          <video
            ref={attachRemoteVideo}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${remoteStream ? '' : 'hidden'}`}
          />
          {!remoteStream && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3 animate-pulse">
                  <Video className="w-8 h-8 text-white/60" />
                </div>
                <p className="text-white/60 text-sm">Connecting video...</p>
              </div>
            </div>
          )}

          {/* Local video (small overlay) */}
          <div className="absolute top-4 right-4 w-28 h-20 sm:w-32 sm:h-24 rounded-xl overflow-hidden border-2 border-white/20 shadow-xl z-10">
            {localStream ? (
              <video
                ref={attachLocalVideo}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <VideoOff className="w-5 h-5 text-white/40" />
              </div>
            )}
          </div>

          {/* Timer overlay */}
          <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm z-10">
            <span className="text-xs text-white font-medium tabular-nums">{formatTime(callDuration)}</span>
          </div>

          {/* Minimize button */}
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 left-1/2 -translate-x-1/2 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white/80 hover:text-white cursor-pointer z-10"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>

        {/* Controls bar - always visible */}
        <div className="shrink-0 bg-black px-6 py-5 flex items-center justify-center gap-5 safe-bottom">
          <button
            onClick={toggleMic}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isMicMuted ? "bg-red-500/90 text-white" : "bg-white/15 text-white hover:bg-white/25"
            }`}
          >
            {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <button
            onClick={toggleCam}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isCamOff ? "bg-red-500/90 text-white" : "bg-white/15 text-white hover:bg-white/25"
            }`}
          >
            {isCamOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
          <button
            onClick={endCall}
            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 transition-all cursor-pointer"
          >
            <PhoneOff className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>,
      document.body
    );
  }

  // ── Minimized Video Call (inline bar in DM page) ──
  if (chatMode === "video" && !isCallFullscreen) {
    return (
      <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 py-3 shrink-0">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            {/* Mini remote video preview */}
            <div
              className="w-16 h-12 rounded-lg overflow-hidden bg-black border border-[var(--color-border)] cursor-pointer relative"
              onClick={toggleFullscreen}
            >
              {remoteStream ? (
                <video
                  ref={attachRemoteVideo}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Video className="w-4 h-4 text-white/40" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                <Maximize2 className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--color-text-primary)]">Video Call</p>
              <p className="text-[10px] text-[var(--color-text-secondary)] tabular-nums">{formatTime(callDuration)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleFullscreen} className="p-2 rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer">
              <Maximize2 className="w-4 h-4" />
            </button>
            <button onClick={toggleMic} className={`p-2 rounded-full transition-all cursor-pointer ${isMicMuted ? "bg-red-500/20 text-red-400" : "bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]"}`}>
              {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button onClick={toggleCam} className={`p-2 rounded-full transition-all cursor-pointer ${isCamOff ? "bg-red-500/20 text-red-400" : "bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]"}`}>
              {isCamOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </button>
            <button onClick={endCall} className="p-2 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 cursor-pointer">
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* Hidden audio element to play remote audio */}
        {remoteStream && <audio ref={(el) => { if (el) el.srcObject = remoteStream; }} autoPlay className="hidden" />}
      </div>
    );
  }

  // ── Voice Call Bar ──
  return (
    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-green-500/20 px-4 py-3 shrink-0">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <Phone className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--color-text-primary)]">
              {remoteStream ? "Voice Call" : "Connecting..."}
            </p>
            <p className="text-[10px] text-green-400 tabular-nums">{formatTime(callDuration)}</p>
          </div>
          {/* Audio wave animation */}
          {remoteStream && (
            <div className="flex items-end gap-0.5 h-4 ml-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-green-400 rounded-full animate-pulse"
                  style={{ height: `${8 + Math.random() * 8}px`, animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleMic} className={`p-2 rounded-full transition-all cursor-pointer ${isMicMuted ? "bg-red-500/20 text-red-400" : "bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]"}`}>
            {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button onClick={endCall} className="p-2 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 cursor-pointer">
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* Hidden audio element */}
      {remoteStream && <audio ref={(el) => { if (el) el.srcObject = remoteStream; }} autoPlay className="hidden" />}
    </div>
  );
}

// ── Calling Overlay (initiator waiting for answer) ──
export function CallingOverlay() {
  const activeCall = useChatStore((s) => s.activeCall);
  const chatMode = useChatStore((s) => s.chatMode);
  const socket = useChatStore((s) => s.socket);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Only show when activeCall exists but chatMode is still 'text' (not yet connected)
  const isRinging = activeCall && chatMode === "text";
  if (!isRinging || !mounted) return null;

  const handleCancel = () => {
    socket?.emit("call:end", { roomId: activeCall.roomId });
    useChatStore.setState({ activeCall: null });
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/80 backdrop-blur-lg"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="flex flex-col items-center gap-6 p-8"
      >
        {/* Pulsing icon */}
        <div className="relative">
          <div className="absolute inset-0 w-24 h-24 rounded-full bg-green-500/20 animate-ping" />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-green-500/30">
            {activeCall.type === "video" ? (
              <Video className="w-9 h-9 text-white" />
            ) : (
              <Phone className="w-9 h-9 text-white" />
            )}
          </div>
        </div>

        <div className="text-center">
          <p className="text-lg font-bold text-white mb-1">Calling...</p>
          <p className="text-sm text-white/50">
            {activeCall.type === "video" ? "Video" : "Voice"} Call
          </p>
        </div>

        {/* Animated dots */}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400/80 animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 rounded-full bg-green-400/80 animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 rounded-full bg-green-400/80 animate-bounce [animation-delay:300ms]" />
        </div>

        {/* Cancel button */}
        <button
          onClick={handleCancel}
          className="mt-4 w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 transition-all hover:scale-110 cursor-pointer"
        >
          <PhoneOff className="w-6 h-6 text-white" />
        </button>
        <span className="text-xs text-white/40">Cancel</span>
      </motion.div>
    </motion.div>,
    document.body
  );
}
