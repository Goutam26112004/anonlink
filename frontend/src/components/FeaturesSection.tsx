"use client";

import { motion, type Variants } from "framer-motion";
import { Shield, MessageCircle, Video, Zap } from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] },
  }),
};

const tiles = [
  {
    icon: Shield,
    title: "Privacy & Safety",
    desc: "Your identity never leaves your device. No accounts, no emails, no IP logs. Conversations are ephemeral — they don't exist after you disconnect.",
  },
  {
    icon: MessageCircle,
    title: "Anonymous Chat",
    desc: "No name, no history, no trace. Every session is a clean slate. Type, share, disconnect — zero record.",
  },
  {
    icon: Video,
    title: "Voice & Video",
    desc: "Crystal-clear WebRTC calls with end-to-end encryption. Voice, video, or text — switch mid-session.",
  },
  {
    icon: Zap,
    title: "Instant Matching",
    desc: "Select your mode and get connected. Our algorithm pairs you with someone real anywhere in the world.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 md:py-32 px-6" style={{ backgroundColor: "var(--color-void)" }}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-16"
        >
          <motion.h2
            variants={fadeUp}
            custom={0}
            className="text-3xl md:text-4xl font-display font-bold text-balance tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            Everything you need. Nothing you don&apos;t.
          </motion.h2>
          <motion.div
            variants={fadeUp}
            custom={1}
            className="section-accent mx-auto mt-4"
          />
          <motion.p
            variants={fadeUp}
            custom={2}
            className="mt-4 max-w-md mx-auto leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Four tools. One purpose: real connection without compromise.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tiles.map((tile, i) => (
            <motion.div
              key={tile.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              custom={i}
              className="glass-card group rounded-2xl p-6 md:p-8 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_40px_rgba(0,0,0,0.35)]"
            >
              <div className="flex flex-col items-start gap-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:bg-white/[0.08] group-hover:border-[var(--brand)]/30"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.05)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <tile.icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" style={{ color: "var(--brand)" }} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
                    {tile.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                    {tile.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
