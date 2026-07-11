"use client";

import { motion } from "framer-motion";

interface ConnectionLinesProps {
  className?: string;
  color?: string;
  width?: number;
  height?: number;
  count?: number;
}

export function ConnectionLines({
  className = "",
  color = "var(--brand)",
  width = 300,
  height = 100,
  count = 3,
}: ConnectionLinesProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ overflow: "visible" }}
    >
      {Array.from({ length: count }, (_, i) => {
        const leftY = 20 + (i * (height - 40)) / (count - 1 || 1);
        const rightY = height - leftY;
        const midY = (leftY + rightY) / 2 + (Math.random() - 0.5) * 20;
        return (
          <motion.path
            key={i}
            d={`M 0 ${leftY} Q ${width / 3} ${midY}, ${width / 2} ${(leftY + rightY) / 2} Q ${(2 * width) / 3} ${height - midY}, ${width} ${rightY}`}
            fill="none"
            stroke={color}
            strokeWidth={1}
            strokeOpacity={0.12}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 1, 0] }}
            transition={{
              duration: 3 + i,
              delay: i * 0.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        );
      })}
      {Array.from({ length: count }, (_, i) => {
        const y = 20 + (i * (height - 40)) / (count - 1 || 1);
        return (
          <motion.circle
            key={`l-${i}`}
            cx={0}
            cy={y}
            r={2}
            fill={color}
            fillOpacity={0.3}
            animate={{ cx: [0, width] }}
            transition={{
              duration: 3 + i,
              delay: i * 0.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        );
      })}
    </svg>
  );
}
