"use client";

import { motion, type Variants } from "framer-motion";
import { ShieldCheck, Flag, Users, EyeOff } from "lucide-react";
import { PrivacyShield } from "./illustrations/PrivacyShield";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] },
  }),
};

const items = [
  {
    icon: ShieldCheck,
    title: "Real-time Moderation",
    desc: "Every session can be flagged with one click. Our moderation system reviews reported conversations. Repeated violations restrict network access.",
  },
  {
    icon: Flag,
    title: "One-tap Report & Block",
    desc: "Uncomfortable with someone? Tap the flag icon during any session. That user is immediately blocked from matching with you again, and their report is queued for review.",
  },
  {
    icon: Users,
    title: "Age Policy",
    desc: "AnonLink is strictly 18+. There are no accounts to attach verification to, but any user suspected of being underage is permanently removed from the network.",
  },
  {
    icon: EyeOff,
    title: "No-tracker Data Promise",
    desc: "We do not log IP addresses, store chat transcripts, record call metadata, or plant tracking cookies. When you disconnect, your session ceases to exist.",
  },
];

export default function TrustSafetySection() {
  return (
    <section
      id="trust-safety"
      className="py-24 md:py-32 px-6 relative overflow-hidden"
      style={{ backgroundColor: "var(--color-void)" }}
    >
      <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none hidden md:block">
        <PrivacyShield size={400} />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mb-16"
        >
          <motion.h2
            variants={fadeUp}
            custom={0}
            className="text-3xl md:text-4xl font-display font-bold text-balance tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            Trust & Safety
          </motion.h2>
          <motion.div
            variants={fadeUp}
            custom={1}
            className="section-accent mt-4"
          />
          <motion.p
            variants={fadeUp}
            custom={2}
            className="mt-4 max-w-xl leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Anonymous doesn&apos;t mean unaccountable. Here&apos;s how we keep the
            network safe.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              custom={i}
              className="glass-card group rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_40px_rgba(0,0,0,0.35)]"
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 group-hover:bg-white/[0.08] group-hover:border-[var(--brand)]/30"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.05)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <item.icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" style={{ color: "var(--brand)" }} />
                </div>
                <div>
                  <h3 className="text-base font-semibold mb-1.5" style={{ color: "var(--color-text-primary)" }}>
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                    {item.desc}
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
