"use client";

import { motion } from "framer-motion";

interface AnonBlobProps {
  className?: string;
  color?: string;
  size?: number;
  delay?: number;
}

const paths = [
  "M60,10 C80,5 100,20 105,40 C110,60 95,80 75,85 C55,90 35,80 25,60 C15,40 30,15 60,10Z",
  "M65,8 C85,15 100,30 95,50 C90,70 70,82 50,80 C30,78 15,60 20,40 C25,20 45,2 65,8Z",
  "M55,15 C75,5 105,15 110,35 C115,55 95,85 70,82 C45,79 20,60 25,40 C30,20 35,25 55,15Z",
];

export function AnonBlob({ className = "", color = "var(--brand)", size = 120, delay = 0 }: AnonBlobProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={className}
      style={{ filter: `drop-shadow(0 0 30px color-mix(in srgb, ${color} 15%, transparent))` }}
    >
      <motion.path
        fill={color}
        fillOpacity={0.08}
        stroke={color}
        strokeWidth={1}
        strokeOpacity={0.3}
        initial={{ d: paths[0] }}
        animate={{ d: paths }}
        transition={{
          d: {
            duration: 8,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
            delay,
          },
        }}
      />
    </svg>
  );
}
