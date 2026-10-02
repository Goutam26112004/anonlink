"use client";

import { motion } from "framer-motion";

const D = "M 50,50 C 50,30 25,25 25,50 C 25,75 50,70 50,50 C 50,30 75,25 75,50 C 75,75 50,70 50,50";

interface AnimatedLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function AnimatedLogo({ className = "", size = 32, showText = true }: AnimatedLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          style={{ filter: `drop-shadow(0 0 8px rgba(139, 92, 246, 0.12))` }}
        >
          <defs>
            <linearGradient id="infGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="50%" stopColor="#A78BFA" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
            </radialGradient>
            <filter id="neonBlur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
            </filter>
          </defs>

          {/* Glow underlay — pulses */}
          <motion.circle
            cx="50" cy="50" r="44"
            fill="url(#glowGrad)"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Infinity knot — breathing scale wrapper */}
          <motion.g
            style={{ originX: "50%", originY: "50%" }}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Base — dim full silhouette, always visible */}
            <path
              d={D}
              fill="none"
              stroke="#8B5CF6"
              strokeWidth={8}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.08"
            />

            {/* Neon glow halo — blurred light around the head */}
            <path
              d={D}
              fill="none"
              stroke="var(--color-text-primary, #FFFFFF)"
              strokeWidth={12}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={100}
              strokeDasharray="90 10"
              filter="url(#neonBlur)"
              opacity="0.6"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="0" to="-100"
                dur="3s"
                repeatCount="indefinite"
              />
            </path>

            {/* Core — bright white head */}
            <path
              d={D}
              fill="none"
              stroke="var(--color-text-primary, #FFFFFF)"
              strokeWidth={7}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={100}
              strokeDasharray="90 10"
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

        {/* Ambient blur glow */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(139, 92, 246, 0.06), transparent 70%)",
            filter: "blur(12px)",
          }}
        />
      </div>
      {showText && (
        <span
          className="font-display text-lg font-bold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          AnonLink
        </span>
      )}
    </div>
  );
}
