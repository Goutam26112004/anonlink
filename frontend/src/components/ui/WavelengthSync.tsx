"use client";

import { motion } from "framer-motion";

type SyncState = "idle" | "searching" | "matched";

interface WavelengthSyncProps {
  state?: SyncState;
  className?: string;
}

const D = "M 50,50 C 50,30 25,25 25,50 C 25,75 50,70 50,50 C 50,30 75,25 75,50 C 75,75 50,70 50,50";

export function WavelengthSync({
  state = "idle",
  className = "",
}: WavelengthSyncProps) {
  const isActive = state !== "idle";

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      role="status"
      aria-label={
        state === "matched"
          ? "Connected"
          : state === "searching"
            ? "Searching for match"
            : "Ready to connect"
      }
    >
      <svg
        width={100}
        height={100}
        viewBox="0 0 100 100"
        className="overflow-visible"
      >
        <defs>
          <radialGradient id="syncGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
          <filter id="syncNeonBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
          </filter>
        </defs>

        {/* Glow underlay */}
        <motion.circle
          cx="50" cy="50" r="44"
          fill="url(#syncGlow)"
          animate={{ opacity: isActive ? [0.4, 0.8, 0.4] : 0.3 }}
          transition={isActive ? { duration: 2.5, repeat: Infinity, ease: "easeInOut" } : { duration: 0 }}
        />

        {/* Breathing scale wrapper — always active */}
        <motion.g
          style={{ originX: "50%", originY: "50%" }}
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Base infinity silhouette — always visible */}
          <path
            d={D}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={7}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={state === "idle" ? 0.06 : state === "searching" ? 0.15 : 0.25}
            style={{ transition: "opacity 0.8s" }}
          />

          {/* Neon glow halo — always active, varies by state */}
          <path
            d={D}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={10}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={100}
            strokeDasharray="90 10"
            filter="url(#syncNeonBlur)"
            opacity={state === "idle" ? 0.08 : state === "matched" ? 0.6 : 0.4}
            style={{ transition: "opacity 0.8s" }}
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0" to="-100"
              dur="3s"
              repeatCount="indefinite"
            />
          </path>

          {/* Core — bright head, always active */}
          <path
            d={D}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={100}
            strokeDasharray="90 10"
            opacity={state === "idle" ? 0.1 : state === "matched" ? 1 : 0.7}
            style={{ transition: "opacity 0.8s" }}
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0" to="-100"
              dur="3s"
              repeatCount="indefinite"
            />
          </path>
        </motion.g>
      </svg>
    </div>
  );
}
