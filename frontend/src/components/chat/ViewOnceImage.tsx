"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, EyeOff, Clock } from "lucide-react";

interface ViewOnceImageProps {
  url: string;
  viewOnce: boolean;
  isMine: boolean;
}

function getFullUrl(url: string): string {
  if (url.startsWith("http")) return url;
  const base =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000"
      : "http://localhost:4000";
  return `${base}${url}`;
}

// Persist viewed state in localStorage
function getViewedKey(url: string): string {
  return `vo_viewed_${url}`;
}

function isAlreadyViewed(url: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(getViewedKey(url)) === "1";
}

function markAsViewed(url: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getViewedKey(url), "1");
}

const TIMER_DURATION = 60;

export function ViewOnceImage({ url, viewOnce, isMine }: ViewOnceImageProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [timer, setTimer] = useState(TIMER_DURATION);
  const [expired, setExpired] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);

  const fullUrl = getFullUrl(url);
  const progress = timer / TIMER_DURATION;

  // On mount: check if this image was already viewed
  useEffect(() => {
    setMounted(true);
    if (viewOnce && !isMine && isAlreadyViewed(url)) {
      setExpired(true);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [url, viewOnce, isMine]);

  const openPopup = () => {
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  // Receiver taps: start timer + open popup
  const handleReceiverTap = () => {
    if (timerStarted) {
      openPopup();
      return;
    }
    setTimerStarted(true);
    setShowPopup(true);
    // Mark as viewed immediately so refresh shows expired
    markAsViewed(url);
    intervalRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setExpired(true);
          setShowPopup(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  // ── Expired state ──
  if (expired) {
    return (
      <div className="w-[200px] h-[120px] rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex flex-col items-center justify-center mb-1.5">
        <EyeOff className="w-6 h-6 text-[var(--color-text-secondary)] mb-1" />
        <p className="text-[11px] font-medium text-[var(--color-text-secondary)]">Photo expired</p>
      </div>
    );
  }

  // ── Non view-once: normal image card ──
  if (!viewOnce) {
    return (
      <>
        <div
          className="rounded-xl overflow-hidden mb-1.5 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={openPopup}
        >
          <img
            src={fullUrl}
            alt="Shared"
            className="rounded-xl max-w-[240px] max-h-[200px] object-cover"
          />
        </div>
        {mounted && showPopup && createPortal(
          <ImagePopup url={fullUrl} onClose={closePopup} />,
          document.body
        )}
      </>
    );
  }

  // ── Sender: blurred card with VIEW ONCE badge ──
  if (isMine) {
    return (
      <>
        <div
          className="w-[200px] h-[140px] rounded-xl overflow-hidden mb-1.5 cursor-pointer group relative"
          onClick={openPopup}
        >
          <img
            src={fullUrl}
            alt=""
            className="w-full h-full object-cover blur-[12px] scale-110 opacity-50 group-hover:opacity-70 group-hover:blur-[8px] transition-all duration-300"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-black/50 px-2.5 py-0.5 rounded-full">
              View Once
            </span>
          </div>
        </div>
        {mounted && showPopup && createPortal(
          <ImagePopup url={fullUrl} onClose={closePopup} badge="Sent as View Once" />,
          document.body
        )}
      </>
    );
  }

  // ── Receiver: not yet tapped - blurred card with "Tap to view" ──
  if (!timerStarted) {
    return (
      <>
        <div
          className="w-[200px] h-[140px] rounded-xl overflow-hidden mb-1.5 cursor-pointer group relative border border-[var(--color-border)] hover:border-[var(--color-signal-violet)]/50 transition-colors"
          onClick={handleReceiverTap}
        >
          <img
            src={fullUrl}
            alt=""
            className="w-full h-full object-cover blur-[20px] scale-125 opacity-20"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-transparent to-black/30">
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/25 flex items-center justify-center mb-2 group-hover:scale-110 group-hover:bg-white/20 transition-all duration-300">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-white font-semibold">Tap to view</span>
            <span className="text-[10px] text-white/50 mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Disappears in 60s
            </span>
          </div>
        </div>
        {mounted && showPopup && createPortal(
          <TimerPopup url={fullUrl} timer={timer} progress={progress} onClose={closePopup} />,
          document.body
        )}
      </>
    );
  }

  // ── Receiver: timer running - show card with timer, click reopens popup ──
  return (
    <>
      <div
        className="w-[200px] h-[100px] rounded-xl overflow-hidden mb-1.5 cursor-pointer group relative border border-[var(--color-border)]"
        onClick={openPopup}
      >
        <img
          src={fullUrl}
          alt=""
          className="w-full h-full object-cover blur-[16px] scale-110 opacity-30"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/60 backdrop-blur-sm">
            <div className="relative w-5 h-5">
              <svg className="w-5 h-5 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15" fill="none"
                  stroke={progress > 0.5 ? "#8B5CF6" : progress > 0.2 ? "#F59E0B" : "#EF4444"}
                  strokeWidth="3"
                  strokeDasharray={`${progress * 94.2} 94.2`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="text-sm text-white font-bold tabular-nums">{timer}s</span>
          </div>
          <span className="text-[10px] text-white/50 mt-1.5">Tap to view again</span>
        </div>
      </div>
      {mounted && showPopup && createPortal(
        <TimerPopup url={fullUrl} timer={timer} progress={progress} onClose={closePopup} />,
        document.body
      )}
    </>
  );
}

// ── Simple image popup (for non view-once and sender preview) ──
function ImagePopup({ url, onClose, badge }: { url: string; onClose: () => void; badge?: string }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={url}
            alt="Full view"
            className="max-w-[88vw] max-h-[82vh] object-contain rounded-2xl shadow-2xl"
          />
          {badge && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm">
              <span className="text-xs text-white/80 font-medium">{badge}</span>
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-black/80 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Timer popup with animated border ──
function TimerPopup({
  url,
  timer,
  progress,
  onClose,
}: {
  url: string;
  timer: number;
  progress: number;
  onClose: () => void;
}) {
  const borderColor =
    progress > 0.5
      ? "rgba(139, 92, 246, 0.95)"
      : progress > 0.2
        ? "rgba(245, 158, 11, 0.95)"
        : "rgba(239, 68, 68, 0.95)";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: "spring", damping: 22, stiffness: 280 }}
          className="relative p-[5px] rounded-2xl"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: `conic-gradient(${borderColor} ${progress * 360}deg, rgba(255,255,255,0.08) ${progress * 360}deg)`,
          }}
        >
          <div className="rounded-[13px] overflow-hidden bg-black relative">
            <img
              src={url}
              alt="View once"
              className="max-w-[85vw] max-h-[78vh] object-contain block"
            />
            {/* Timer overlay */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-sm border border-white/10">
              <div className="relative w-4 h-4">
                <svg className="w-4 h-4 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15" fill="none"
                    stroke={borderColor}
                    strokeWidth="3"
                    strokeDasharray={`${progress * 94.2} 94.2`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
              </div>
              <span className="text-xs text-white font-bold tabular-nums">{timer}s</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
