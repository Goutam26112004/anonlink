"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

interface LiveCounterProps {
  className?: string;
  compact?: boolean;
}

export function LiveCounter({ className = "", compact = false }: LiveCounterProps) {
  const [count, setCount] = useState(18542);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((c) => c + getRandomInt(-2, 5));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex items-center gap-2 ${className}`} aria-live="polite" aria-label={`${count.toLocaleString()} users online`}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]" />
      </span>
      <motion.span
        key={count}
        initial={{ opacity: 0, y: compact ? -6 : -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className={`font-semibold text-[var(--text-secondary)] ${
          compact ? "text-sm" : "text-base"
        }`}
      >
        <span className="text-[var(--accent)]">{count.toLocaleString()}</span>
        <span className="ml-1">Online</span>
      </motion.span>
    </div>
  );
}
