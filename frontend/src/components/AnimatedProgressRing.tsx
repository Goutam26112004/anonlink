"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface AnimatedProgressRingProps {
  value: number;
  max: number;
  label: string;
  icon?: React.ReactNode;
  color?: string;
  size?: number;
  strokeWidth?: number;
}

export function AnimatedProgressRing({
  value,
  max,
  label,
  icon,
  color = "var(--brand)",
  size = 100,
  strokeWidth = 6,
}: AnimatedProgressRingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(value / max, 1);
  const offset = circumference * (1 - percentage);

  return (
    <div ref={ref} className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--bg-tertiary)"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: isInView ? offset : circumference }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{
              strokeDasharray: circumference,
              filter: `drop-shadow(0 0 6px ${color})`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {icon || (
            <motion.span
              className="text-lg font-bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: isInView ? 1 : 0 }}
              transition={{ delay: 0.8, duration: 0.3 }}
            >
              {Math.round(percentage * 100)}%
            </motion.span>
          )}
        </div>
      </div>
      <span className="text-xs text-[var(--text-muted)] font-medium">{label}</span>
    </div>
  );
}
