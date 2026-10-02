"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Video, VideoOff, Flag, Shield, X, Monitor, SkipForward } from "lucide-react";
import { Button } from "../ui/Button";

interface MediaChatProps {
  chatMode: "voice" | "video";
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMicMuted: boolean;
  isCamOff: boolean;
  connectionQuality: "excellent" | "fair" | "poor" | "searching";
  onToggleMic: () => void;
  onToggleCam: () => void;
  onReport: () => void;
  onEnd: () => void;
  /** Only provided for public (non-friend) calls; omit to hide the Skip button */
  onSkip?: () => void;
  onStartMedia: () => void;
  callDuration: number;
}

const qualityColors: Record<string, string> = {
  excellent: "bg-[var(--color-success)]",
  fair: "bg-[var(--color-warning)]",
  poor: "bg-[var(--color-danger)]",
  searching: "bg-[var(--color-text-secondary)]",
};

function formatDuration(start: number) {
  const elapsed = Math.floor((Date.now() - start) / 1000);
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function MediaChat({
  chatMode, localStream, remoteStream,
  isMicMuted, isCamOff, connectionQuality,
  onToggleMic, onToggleCam, onReport, onEnd, onSkip, onStartMedia,
  callDuration,
}: MediaChatProps) {
  const router = useRouter();
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const [showDock, setShowDock] = useState(true);
  const dockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [duration, setDuration] = useState("00:00");

  const resetDockTimer = useCallback(() => {
    setShowDock(true);
    if (dockTimerRef.current) clearTimeout(dockTimerRef.current);
    dockTimerRef.current = setTimeout(() => setShowDock(false), 4000);
  }, []);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    resetDockTimer();
    return () => {
      if (dockTimerRef.current) clearTimeout(dockTimerRef.current);
    };
  }, [resetDockTimer]);

  useEffect(() => {
    if (callDuration > 0) {
      const id = setInterval(() => {
        setDuration(formatDuration(callDuration));
      }, 1000);
      return () => clearInterval(id);
    } else {
      setDuration("00:00");
    }
  }, [callDuration]);

  if (chatMode === "voice" && !localStream) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-[var(--color-signal-violet)]/10 flex items-center justify-center mx-auto mb-4">
            <Mic className="w-8 h-8 text-[var(--color-signal-violet)]" />
          </div>
          <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-2">
            Microphone access needed
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            This is only used for this session. No data is stored.
          </p>
          <Button variant="primary" size="lg" onClick={onStartMedia}>
            Allow access
          </Button>
        </div>
      </div>
    );
  }

  if (chatMode === "video" && !localStream) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-[var(--color-signal-violet)]/10 flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-[var(--color-signal-violet)]" />
          </div>
          <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-2">
            Camera and microphone access needed
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            This is only used for this session. No data is stored.
          </p>
          <Button variant="primary" size="lg" onClick={onStartMedia}>
            Allow access
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 relative bg-black/40 flex items-center justify-center overflow-hidden"
      onClick={resetDockTimer}
      onMouseMove={resetDockTimer}
      onTouchMove={resetDockTimer}
    >
      {chatMode === "video" && remoteStream ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : chatMode === "video" ? (
        <div className="text-center text-[var(--color-text-secondary)]">
          <div className="w-24 h-24 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center mx-auto mb-3">
            <Video className="w-10 h-10" />
          </div>
          <p className="text-sm">Waiting for peer to connect...</p>
        </div>
      ) : (
        <div className="text-center">
          {remoteStream ? (
            <div className="flex items-center gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="audio-bar w-1.5 rounded-full bg-[var(--color-signal-violet)]"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          ) : (
            <>
              <div className="w-40 h-40 mx-auto mb-4 relative">
                <div className="absolute inset-0 rounded-full bg-[var(--color-signal-violet)]/10 pulse-ring" />
                <div className="absolute inset-4 rounded-full bg-[var(--color-signal-violet)]/20" />
                <div className="absolute inset-8 rounded-full bg-[var(--color-signal-violet)]/30 flex items-center justify-center">
                  <Mic className="w-8 h-8 text-[var(--color-signal-violet)]" />
                </div>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Voice connected
              </p>
            </>
          )}
        </div>
      )}

      {chatMode === "video" && localStream && (
        <div className="absolute top-4 left-4 w-28 h-20 rounded-xl overflow-hidden border-2 border-[var(--color-border)] shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {isCamOff && (
            <div className="absolute inset-0 bg-[var(--color-void)]/80 flex items-center justify-center">
              <VideoOff className="w-5 h-5 text-[var(--color-text-secondary)]" />
            </div>
          )}
        </div>
      )}

      <div className="absolute top-4 right-4 flex items-center gap-2">
        <span className="text-xs font-mono text-white/80 bg-black/40 px-2 py-1 rounded-lg backdrop-blur-sm">
          {duration}
        </span>
        <div className={`w-2 h-2 rounded-full ${qualityColors[connectionQuality] || qualityColors.searching}`} />
        <span className="text-xs text-white/60 font-mono uppercase">
          {connectionQuality}
        </span>
      </div>

      <div
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 transition-all duration-300 ${
          showDock ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/70 backdrop-blur-xl border border-white/10">
          {onSkip && (
            <button
              onClick={onSkip}
              className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-full bg-white/10 text-white text-xs sm:text-sm font-bold hover:bg-white/20 transition-all flex items-center gap-1.5"
              aria-label="Skip to next"
            >
              <SkipForward className="w-4 h-4" />
              <span className="hidden sm:inline">Skip</span>
            </button>
          )}
          <button
            onClick={onToggleMic}
            className={`p-2.5 sm:p-3 rounded-full transition-all ${
              isMicMuted
                ? "bg-[var(--color-danger)] text-white"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
            aria-label={isMicMuted ? "Unmute" : "Mute"}
          >
            {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          {chatMode === "video" && (
            <button
              onClick={onToggleCam}
              className={`p-2.5 sm:p-3 rounded-full transition-all ${
                isCamOff
                  ? "bg-[var(--color-danger)] text-white"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
              aria-label={isCamOff ? "Camera on" : "Camera off"}
            >
              {isCamOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          )}
          <div className="w-px h-8 bg-white/10" />
          <button
            onClick={onReport}
            className="p-2.5 sm:p-3 rounded-full bg-white/10 text-white/70 hover:text-[var(--color-danger)] transition-colors"
            aria-label="Report"
          >
            <Flag className="w-5 h-5" />
          </button>
          <button
            onMouseEnter={() => router.prefetch("/help")}
            onClick={() => router.push("/help")}
            className="p-2.5 sm:p-3 rounded-full bg-white/10 text-white/70 hover:text-white transition-colors"
            aria-label="Safety"
          >
            <Shield className="w-5 h-5" />
          </button>
          <button
            onClick={onEnd}
            className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-full bg-[var(--color-danger)] text-white text-xs sm:text-sm font-bold hover:bg-rose-600 transition-all flex items-center gap-1.5"
            aria-label="End call"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">End</span>
          </button>
        </div>
      </div>
    </div>
  );
}
