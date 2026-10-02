"use client";

import { motion, type Variants } from "framer-motion";
import { MessageCircle, Video, SkipForward } from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] },
  }),
};

const steps = [
  {
    num: "01",
    icon: MessageCircle,
    title: "Choose your mode",
    desc: "Pick voice, video, or text chat. No account needed — just click and you're in.",
  },
  {
    num: "02",
    icon: Video,
    title: "Get matched instantly",
    desc: "Our system finds someone real who shares your preferences. Typical wait is a few seconds.",
  },
  {
    num: "03",
    icon: SkipForward,
    title: "Talk, skip, or save",
    desc: "Having a great conversation? Keep going. Not vibing? One tap moves you to someone new.",
  },
];

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="py-24 md:py-32 px-6"
      style={{ backgroundColor: "var(--color-surface)" }}
    >
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
            How it works
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
            Three steps to your next conversation.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              custom={i}
              className="glass-card relative flex flex-col items-center text-center rounded-2xl p-8 transition-all duration-300 hover:-translate-y-0.5"
            >
              {/* Connector line between cards */}
              {i < steps.length - 1 && (
                <div
                  className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px"
                  style={{
                    background: "linear-gradient(90deg, var(--brand), rgba(139, 92, 246, 0.2))",
                  }}
                />
              )}

              {/* Number badge */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-4"
                style={{
                  backgroundColor: "rgba(255,255,255,0.06)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "var(--brand)",
                }}
              >
                {step.num}
              </div>

              {/* Icon circle */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <step.icon className="w-7 h-7" style={{ color: "var(--brand)" }} />
              </div>

              <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
                {step.title}
              </h3>
              <p className="text-sm max-w-xs" style={{ color: "var(--color-text-secondary)" }}>
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
