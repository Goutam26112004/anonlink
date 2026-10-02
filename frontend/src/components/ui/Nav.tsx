"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "./Button";
import { AnimatedLogo } from "../AnimatedLogo";
import { ThemeToggle } from "./ThemeToggle";

const navLinks: { label: string; href: string }[] = [];

export function Nav() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkClass =
    "text-xs text-[var(--color-text-secondary)] tracking-widest uppercase hover:text-[var(--color-text-primary)] transition-colors focus-visible:outline-none";

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? "rgba(17, 17, 24, 0.4)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.05)" : "1px solid transparent",
      }}
    >
      <div
        className={`max-w-6xl mx-auto px-6 flex items-center justify-between transition-all duration-200 ${
          scrolled ? "h-14" : "h-16"
        }`}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <AnimatedLogo size={24} showText={false} />
          <span
            className="text-sm font-display font-bold tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            AnonLink
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) =>
            link.href.startsWith("/") ? (
              <Link key={link.label} href={link.href} className={linkClass}>
                {link.label}
              </Link>
            ) : (
              <a key={link.label} href={link.href} className={linkClass}>
                {link.label}
              </a>
            ),
          )}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/auth" className="hidden sm:inline">
            <Button variant="glass" size="sm">
              Start Chatting
            </Button>
          </Link>

        </div>
      </div>
    </header>
  );
}
