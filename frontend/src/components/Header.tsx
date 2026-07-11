"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AnimatedLogo } from "./AnimatedLogo";
import { LiveCounter } from "./LiveCounter";
import { ThemeToggle } from "./ThemeToggle";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[var(--bg-glass-heavy)] backdrop-blur-xl border-b border-[var(--border-primary)] shadow-[var(--shadow-md)]"
          : "bg-transparent"
      }`}
    >
      <div className="flex items-center justify-between h-14 px-3 sm:px-6 max-w-7xl mx-auto">
        <div className="flex items-center">
          <a href="#hero" aria-label="AnonLink home">
            <AnimatedLogo size={28} showText={false} />
          </a>
        </div>

        <div className="flex items-center">
          <LiveCounter compact />
        </div>

        <div className="flex items-center">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
