"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";

const faqs = [
  {
    q: "Is AnonLink really free?",
    a: "Yes! AnonLink is 100% free to use. Text chat is always free. Voice and video chat are also available with optional premium features.",
  },
  {
    q: "Do I need to create an account?",
    a: "You can start chatting immediately as a guest. Creating an account lets you save your preferences and access additional features.",
  },
  {
    q: "Is my identity protected?",
    a: "Absolutely. We do not collect personal information. Your conversations are anonymous and we do not store chat logs.",
  },
  {
    q: "How does matching work?",
    a: "Our smart matching algorithm pairs you with random strangers based on your selected interests and language preferences.",
  },
  {
    q: "Can I report inappropriate behavior?",
    a: "Yes, we have a robust moderation system. You can report or block any user who violates our community guidelines.",
  },
  {
    q: "Is there a mobile app?",
    a: "AnonLink works perfectly in your mobile browser. A native app is coming soon!",
  },
];

function FAQItem({ faq, index }: { faq: typeof faqs[0]; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="border-b border-[var(--border-primary)] last:border-0"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left text-sm font-medium text-[var(--text-primary)] hover:text-[var(--brand)] transition-colors gap-4"
      >
        {faq.q}
        <span className="relative w-5 h-5 shrink-0">
          <motion.span
            className="absolute inset-0 flex items-center justify-center"
            animate={{ rotate: open ? 90 : 0, opacity: open ? 0 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="7" y1="1" x2="7" y2="13" />
              <line x1="1" y1="7" x2="13" y2="7" />
            </svg>
          </motion.span>
          <motion.span
            className="absolute inset-0 flex items-center justify-center"
            animate={{ rotate: open ? 0 : -90, opacity: open ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="1" y1="7" x2="13" y2="7" />
            </svg>
          </motion.span>
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm text-[var(--text-secondary)] leading-relaxed">
              {faq.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="faq" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="text-center mb-14"
        >
          <h2 className="heading-section text-3xl sm:text-4xl mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
            Everything you need to know about AnonLink.
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          <div className="glass-lift rounded-2xl px-6">
            {faqs.map((faq, i) => (
              <FAQItem key={faq.q} faq={faq} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
