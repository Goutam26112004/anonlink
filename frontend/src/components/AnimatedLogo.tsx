"use client";

import { motion } from "framer-motion";

interface AnimatedLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function AnimatedLogo({ className = "", size = 32, showText = true }: AnimatedLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <motion.div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          style={{
            filter: `drop-shadow(0 0 8px color-mix(in srgb, var(--brand) 25%, transparent))`,
          }}
        >
          <defs>
            <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--brand)" />
              <stop offset="50%" stopColor="var(--lavender)" />
              <stop offset="100%" stopColor="var(--accent)" />
            </linearGradient>
            <motion.linearGradient
              id="logo-grad-anim"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
              animate={{ x1: ["0%", "100%", "0%"], y1: ["0%", "100%", "0%"] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <stop offset="0%" stopColor="var(--brand)" />
              <stop offset="50%" stopColor="var(--lavender)" />
              <stop offset="100%" stopColor="var(--accent)" />
            </motion.linearGradient>
          </defs>
          <rect
            x="1"
            y="1"
            width="30"
            height="30"
            rx="8"
            fill="url(#logo-grad-anim)"
            fillOpacity={0.12}
            stroke="url(#logo-grad)"
            strokeWidth="1.5"
          />
          <motion.text
            x="16"
            y="21"
            textAnchor="middle"
            fill="url(#logo-grad)"
            fontSize="18"
            fontWeight="800"
            fontFamily="var(--font-display), system-ui, sans-serif"
            animate={{ opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            A
          </motion.text>
          <motion.circle
            cx="16"
            cy="16"
            r="12"
            fill="none"
            stroke="url(#logo-grad)"
            strokeWidth="0.5"
            strokeOpacity={0.2}
            animate={{ rotate: 360 }}
            style={{ originX: "16px", originY: "16px" }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
        </svg>
        <motion.div
          className="absolute inset-0 rounded-lg"
          style={{
            background: "var(--brand)",
            opacity: 0.06,
            filter: "blur(8px)",
          }}
          animate={{ opacity: [0.04, 0.1, 0.04] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
      {showText && (
        <span className="heading-display text-lg font-bold tracking-tight text-[var(--text-primary)]">
          AnonLink
        </span>
      )}
    </div>
  );
}
