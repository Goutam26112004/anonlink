"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Zap, Shield, Eye, Monitor, WifiOff, Smartphone } from "lucide-react";

const reasons = [
  { icon: Zap, title: "Fast", description: "Instant matching with zero waiting time." },
  { icon: Shield, title: "Secure", description: "End-to-end encrypted conversations." },
  { icon: Eye, title: "Anonymous", description: "No personal data required. Stay invisible." },
  { icon: Monitor, title: "Modern", description: "Clean, intuitive interface designed for you." },
  { icon: WifiOff, title: "No Installation", description: "Works in your browser. No downloads needed." },
  { icon: Smartphone, title: "Responsive", description: "Perfect on desktop, tablet, and mobile." },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

function ReasonCard({ reason, index }: { reason: typeof reasons[0]; index: number }) {
  return (
    <motion.div
      variants={itemVariants}
      className="flex items-start gap-4 p-5 rounded-2xl glass-lift"
    >
      <div className="w-10 h-10 rounded-xl bg-[var(--brand-subtle)] flex items-center justify-center shrink-0">
        <reason.icon className="w-5 h-5 text-[var(--brand)]" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">{reason.title}</h3>
        <p className="text-sm text-[var(--text-secondary)]">{reason.description}</p>
      </div>
    </motion.div>
  );
}

export default function WhyChooseUs() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="text-center mb-14"
        >
          <h2 className="heading-section text-3xl sm:text-4xl mb-4">
            Why Choose AnonLink?
          </h2>
          <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
            We built the best anonymous chat experience. Here is why thousands choose us.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        >
          {reasons.map((reason, index) => (
            <ReasonCard key={reason.title} reason={reason} index={index} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
