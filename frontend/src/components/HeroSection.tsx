"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Shield, Lock, Eye } from "lucide-react";
import { Button } from "./ui/Button";
import { WavelengthSync } from "./ui/WavelengthSync";

type SyncState = "idle" | "searching" | "matched";

const wordVariants = {
  hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.23, 1, 0.32, 1] as const },
  },
};

const staggerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

function FloatingOrb({ index, mouseX, mouseY }: { index: number; mouseX: any; mouseY: any }) {
  const size = [180, 140, 100][index];
  const colors = [
    "rgba(139, 92, 246, 0.05)",
    "rgba(245, 158, 11, 0.04)",
    "rgba(139, 92, 246, 0.03)",
  ];
  const baseX = [60, -40, 30][index];
  const baseY = [-30, 50, -40][index];
  const depth = [30, 45, 15][index];
  const floatDuration = [8, 10, 6][index];

  const parallaxX = useTransform(mouseX, (v: number) => baseX + v * depth);
  const parallaxY = useTransform(mouseY, (v: number) => baseY + v * depth);

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${colors[index]}, transparent 70%)`,
        filter: "blur(60px)",
        x: parallaxX,
        y: parallaxY,
      }}
      animate={{
        scale: [1, 1.06, 1],
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{
        duration: floatDuration,
        repeat: Infinity,
        ease: "easeInOut",
        delay: index * 2,
      }}
    />
  );
}

export default function HeroSection() {
  const router = useRouter();
  const [syncState, setSyncState] = useState<SyncState>("idle");

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 60, damping: 15 });
  const smoothY = useSpring(mouseY, { stiffness: 60, damping: 15 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    mouseX.set(x);
    mouseY.set(y);
  };

  const cycleSync = useCallback(() => {
    setSyncState("idle");
    setTimeout(() => setSyncState("searching"), 1500);
    setTimeout(() => setSyncState("matched"), 4000);
    setTimeout(() => cycleSync(), 6500);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => cycleSync(), 500);
    return () => clearTimeout(t);
  }, [cycleSync]);

  return (
    <section
      className="relative min-h-screen w-full overflow-hidden"
      style={{ backgroundColor: "var(--color-void)" }}
      onMouseMove={handleMouseMove}
    >
      {/* Ambient background layer */}
      <div className="absolute inset-0 pointer-events-none">
        <FloatingOrb index={0} mouseX={smoothX} mouseY={smoothY} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <FloatingOrb index={1} mouseX={smoothX} mouseY={smoothY} />
        </div>
        <FloatingOrb index={2} mouseX={smoothX} mouseY={smoothY} />

        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* WavelengthSync as ambient backdrop */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <motion.div
            animate={{ scale: [2.2, 2.5, 2.2] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="opacity-[0.035]"
          >
            <WavelengthSync state="searching" />
          </motion.div>
        </div>

        {/* Vignette edge fade */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, transparent 40%, var(--color-void) 100%)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Foreground content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pt-24 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          {/* Heading — animated gradient with word stagger */}
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={staggerVariants}
            className="text-5xl md:text-7xl lg:text-8xl font-display font-extrabold tracking-tight leading-[1.05]"
          >
            <span className="animated-gradient-text">
              <motion.span variants={wordVariants} className="inline-block">
                Real{" "}
              </motion.span>
              <motion.span variants={wordVariants} className="inline-block">
                Connections.
              </motion.span>
              <br />
              <motion.span variants={wordVariants} className="inline-block">
                Zero{" "}
              </motion.span>
              <motion.span variants={wordVariants} className="inline-block">
                Footprint.
              </motion.span>
            </span>
          </motion.h1>

          {/* Tagline — glass pills */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="mt-6 flex flex-wrap items-center justify-center gap-2"
          >
            {["No sign-up", "No ads", "No trackers"].map((text) => (
              <span
                key={text}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition-all duration-300 hover:shadow-[0_0_20px_rgba(139,92,246,0.08)]"
              >
                {text}
              </span>
            ))}
          </motion.div>

          {/* Sub-text */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="text-lg md:text-xl max-w-2xl mx-auto mt-3 leading-relaxed text-balance"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Just{" "}
            <span style={{ color: "#F59E0B" }} className="font-semibold">
              raw, unfiltered
            </span>{" "}
            conversation — voice, video, or text.
          </motion.p>
        </div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0, ease: [0.23, 1, 0.32, 1] }}
          className="mt-8 flex flex-col sm:flex-row items-center gap-4"
        >
          <Button
            variant="glass"
            size="xl"
            onMouseEnter={() => router.prefetch("/auth")}
            onClick={() => router.push("/auth")}
          >
            Start Chatting
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </Button>
          <Button
            variant="ghost"
            size="xl"
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({})}
          >
            See how it works
          </Button>
        </motion.div>
      </div>

      {/* Trust badges bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="relative z-10 border-t border-b border-[var(--color-border)] bg-[var(--color-surface)]/50 backdrop-blur-lg"
      >
        <div className="max-w-4xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
          {[
            { icon: Shield, text: "No account required" },
            { icon: Lock, text: "End-to-end encrypted" },
            { icon: Eye, text: "Zero logs stored" },
          ].map((item) => (
            <div
              key={item.text}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(139,92,246,0.1)]"
            >
              <item.icon className="w-3.5 h-3.5 text-[var(--color-signal-violet)]" />
              {item.text}
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
