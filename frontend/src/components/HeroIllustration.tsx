"use client";

import { motion } from "framer-motion";

interface HeroIllustrationProps {
  className?: string;
}

export function HeroIllustration({ className = "" }: HeroIllustrationProps) {
  return (
    <div className={`relative ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="illum-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--lavender)" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="illum-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--brand)" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="illum-grad-3" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--lavender)" stopOpacity={0.2} />
            <stop offset="100%" stopColor="var(--cyan)" stopOpacity={0.1} />
          </linearGradient>
        </defs>

        {/* Outer ring */}
        <motion.circle
          cx="250"
          cy="250"
          r="180"
          stroke="url(#illum-grad-1)"
          strokeWidth="1"
          strokeOpacity={0.4}
          fill="none"
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          style={{ originX: "250px", originY: "250px" }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        />

        {/* Middle ring */}
        <motion.circle
          cx="250"
          cy="250"
          r="130"
          stroke="url(#illum-grad-2)"
          strokeWidth="0.8"
          strokeOpacity={0.3}
          fill="none"
          initial={{ rotate: 360 }}
          animate={{ rotate: 0 }}
          style={{ originX: "250px", originY: "250px" }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
        />

        {/* Inner ring */}
        <motion.circle
          cx="250"
          cy="250"
          r="80"
          stroke="url(#illum-grad-3)"
          strokeWidth="0.6"
          strokeOpacity={0.25}
          fill="none"
          initial={{ rotate: 0 }}
          animate={{ rotate: -360 }}
          style={{ originX: "250px", originY: "250px" }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />

        {/* Connection lines across rings */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0 }}
        >
          <line x1="180" y1="130" x2="250" y2="250" stroke="var(--brand)" strokeWidth="0.5" strokeOpacity={0.15} />
        </motion.g>
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        >
          <line x1="320" y1="160" x2="250" y2="250" stroke="var(--accent)" strokeWidth="0.5" strokeOpacity={0.15} />
        </motion.g>
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        >
          <line x1="300" y1="370" x2="250" y2="250" stroke="var(--lavender)" strokeWidth="0.5" strokeOpacity={0.15} />
        </motion.g>

        {/* Nodes on rings */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const r = 180;
          const cx = 250 + r * Math.cos(rad);
          const cy = 250 + r * Math.sin(rad);
          return (
            <motion.circle
              key={`outer-${i}`}
              cx={cx}
              cy={cy}
              r={3}
              fill="var(--brand)"
              fillOpacity={0.2}
              animate={{
                r: [2, 4, 2],
                fillOpacity: [0.1, 0.35, 0.1],
              }}
              transition={{
                duration: 3 + (i % 3),
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.4,
              }}
            />
          );
        })}

        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const r = 130;
          const cx = 250 + r * Math.cos(rad);
          const cy = 250 + r * Math.sin(rad);
          return (
            <motion.circle
              key={`mid-${i}`}
              cx={cx}
              cy={cy}
              r={2.5}
              fill="var(--accent)"
              fillOpacity={0.15}
              animate={{
                r: [1.5, 3.5, 1.5],
                fillOpacity: [0.08, 0.3, 0.08],
              }}
              transition={{
                duration: 4 + (i % 2),
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5 + 1,
              }}
            />
          );
        })}

        {[0, 72, 144, 216, 288].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const r = 80;
          const cx = 250 + r * Math.cos(rad);
          const cy = 250 + r * Math.sin(rad);
          return (
            <motion.circle
              key={`inner-${i}`}
              cx={cx}
              cy={cy}
              r={2}
              fill="var(--lavender)"
              fillOpacity={0.12}
              animate={{
                r: [1, 3, 1],
                fillOpacity: [0.06, 0.25, 0.06],
              }}
              transition={{
                duration: 3.5 + (i % 3),
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.6 + 2,
              }}
            />
          );
        })}

        {/* Center glow */}
        <motion.circle
          cx="250"
          cy="250"
          r="20"
          fill="var(--brand)"
          fillOpacity={0.06}
          animate={{ r: [18, 25, 18], fillOpacity: [0.04, 0.1, 0.04] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.circle
          cx="250"
          cy="250"
          r="8"
          fill="var(--brand)"
          fillOpacity={0.1}
          animate={{ r: [6, 10, 6], fillOpacity: [0.08, 0.15, 0.08] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}
