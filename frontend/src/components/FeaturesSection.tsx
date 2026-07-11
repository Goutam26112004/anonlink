"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  MessageCircle,
  Mic,
  Video,
  Zap,
  Users,
  Shield,
  Target,
  Lock,
} from "lucide-react";

const features = [
  { icon: MessageCircle, title: "Anonymous Chat", description: "Chat without revealing your identity. Your privacy is our priority.", size: "large" },
  { icon: Mic, title: "Voice Chat", description: "Real-time voice with crystal clear audio.", size: "small" },
  { icon: Video, title: "Video Chat", description: "Face-to-face calls with anyone, anywhere.", size: "small" },
  { icon: Zap, title: "Instant Matching", description: "Matched in seconds. No waiting, no forms.", size: "small" },
  { icon: Users, title: "Private Friends", description: "Add people you vibe with and keep talking.", size: "small" },
  { icon: Shield, title: "Safe Moderation", description: "Report and block anyone instantly.", size: "large" },
  { icon: Target, title: "Smart Matching", description: "Algorithm finds your perfect conversation partner.", size: "large" },
  { icon: Lock, title: "Privacy First", description: "No trackers, no data collection, no ads.", size: "small" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    ref.current.style.setProperty("--rotate-x", `${y * -8}deg`);
    ref.current.style.setProperty("--rotate-y", `${x * 8}deg`);
  };

  const handleMouseLeave = () => {
    if (!ref.current) return;
    ref.current.style.setProperty("--rotate-x", "0deg");
    ref.current.style.setProperty("--rotate-y", "0deg");
  };

  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group glass-lift rounded-2xl p-6 ${
        feature.size === "large"
          ? "sm:col-span-2 lg:row-span-1"
          : ""
      }`}
      style={{
        perspective: "800px",
        transform: "rotateX(var(--rotate-x, 0deg)) rotateY(var(--rotate-y, 0deg))",
      }}
    >
      <div className="w-11 h-11 rounded-xl bg-[var(--brand-subtle)] flex items-center justify-center mb-4 group-hover:bg-[var(--brand)]/20 transition-colors duration-300">
        <feature.icon className="w-5 h-5 text-[var(--brand)]" />
      </div>
      <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">{feature.title}</h3>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{feature.description}</p>
    </motion.div>
  );
}

export default function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="features" className="py-20 lg:py-28 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[var(--brand)]/3 blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="text-center mb-14"
        >
          <h2 className="heading-section text-3xl sm:text-4xl mb-4">
            Everything You Need
          </h2>
          <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
            Connect, chat, and build connections with people from around the globe.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
