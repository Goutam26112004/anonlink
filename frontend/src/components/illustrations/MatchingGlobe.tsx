"use client";

import { motion } from "framer-motion";

interface MatchingGlobeProps {
  className?: string;
  size?: number;
  color?: string;
}

export function MatchingGlobe({ className = "", size = 200, color = "var(--brand)" }: MatchingGlobeProps) {
  const dots = 64;
  const radius = 70;

  const positions = Array.from({ length: dots }, (_, i) => {
    const phi = Math.acos(2 * (i / dots) - 1);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    const screenX = x;
    const screenY = y * 0.6;
    const depth = (z + radius) / (radius * 2);
    return { x: screenX, y: screenY, r: 1.5 + depth * 1.5, opacity: 0.2 + depth * 0.5 };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox="-100 -100 200 200"
      className={className}
      style={{ filter: `drop-shadow(0 0 30px color-mix(in srgb, ${color} 8%, transparent))` }}
    >
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "center" }}
      >
        {positions.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={p.r}
            fill={color}
            fillOpacity={p.opacity}
          />
        ))}
      </motion.g>
      {[
        { x1: -70, y1: 0, x2: 70, y2: 0, delay: 0 },
        { x1: -50, y1: -50, x2: 50, y2: 50, delay: 2 },
        { x1: -50, y1: 50, x2: 50, y2: -50, delay: 4 },
      ].map((line, i) => (
        <motion.line
          key={i}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke={color}
          strokeWidth={0.5}
          strokeOpacity={0.15}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 1, 0] }}
          transition={{
            duration: 4,
            delay: line.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      <motion.circle
        cx={0}
        cy={0}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={0.5}
        strokeOpacity={0.08}
      />
      <motion.circle
        cx={0}
        cy={0}
        r={3}
        fill={color}
        fillOpacity={0.4}
        animate={{ r: [3, 5, 3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}
