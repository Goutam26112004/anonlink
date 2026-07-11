"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { Users, MessageCircle, Heart, Globe } from "lucide-react";

const stats = [
  { icon: Users, label: "Online Now", value: 2847 },
  { icon: MessageCircle, label: "Today's Matches", value: 12530 },
  { icon: Heart, label: "Messages Sent", value: 892140 },
  { icon: Globe, label: "Countries Connected", value: 156 },
];

function AnimatedCounter({ target, inView }: { target: number; inView: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <span className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] tabular-nums">
      {count.toLocaleString()}+
    </span>
  );
}

function StatCard({ stat, index }: { stat: typeof stats[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="text-center p-6"
    >
      <div className="w-12 h-12 rounded-xl bg-[var(--brand-subtle)] flex items-center justify-center mx-auto mb-4">
        <stat.icon className="w-6 h-6 text-[var(--brand)]" />
      </div>
      <AnimatedCounter target={stat.value} inView={isInView} />
      <p className="text-sm text-[var(--text-muted)] mt-1">{stat.label}</p>
    </motion.div>
  );
}

export default function StatsSection() {
  return (
    <section className="py-16 lg:py-20 border-y border-[var(--border-primary)] bg-[var(--bg-secondary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <StatCard key={stat.label} stat={stat} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
