"use client";

import { motion } from "framer-motion";

interface PrivacyShieldProps {
  className?: string;
  size?: number;
  brandColor?: string;
  accentColor?: string;
}

export function PrivacyShield({
  className = "",
  size = 160,
  brandColor = "var(--brand)",
  accentColor = "var(--accent)",
}: PrivacyShieldProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 180"
      className={className}
      style={{ filter: `drop-shadow(0 0 40px color-mix(in srgb, ${brandColor} 10%, transparent))` }}
    >
      <motion.path
        d="M80 10 L140 40 L140 90 C140 130 110 160 80 170 C50 160 20 130 20 90 L20 40 Z"
        fill="none"
        stroke={brandColor}
        strokeWidth={2}
        strokeOpacity={0.25}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />
      <motion.path
        d="M80 15 L135 42 L135 90 C135 127 108 155 80 165 C52 155 25 127 25 90 L25 42 Z"
        fill={brandColor}
        fillOpacity={0.04}
        stroke={brandColor}
        strokeWidth={1.5}
        strokeOpacity={0.15}
      />
      <motion.path
        d="M50 88 L70 108 L112 66"
        fill="none"
        stroke={accentColor}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity={0.6}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
      />
      <motion.circle
        cx={80}
        cy={90}
        r={38}
        fill="none"
        stroke={brandColor}
        strokeWidth={1}
        strokeOpacity={0.08}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
      />
    </svg>
  );
}
