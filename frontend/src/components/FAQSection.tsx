"use client";

import { motion, type Variants } from "framer-motion";
import { Accordion } from "./ui/Accordion";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] },
  },
};

const faqs = [
  {
    id: "anonymous",
    title: "Is AnonLink truly anonymous?",
    content:
      "Yes. We do not require any personal information to use the platform. No email, no phone number, no social login. Every session is ephemeral — once you disconnect, there is no record of your conversation or identity.",
  },
  {
    id: "matching",
    title: "How does the matching work?",
    content:
      "Our matching engine pairs you with a random user based on your selected preferences (voice, video, or text). Typically you are connected within a few seconds to someone real anywhere in the world.",
  },
  {
    id: "encryption",
    title: "Is my conversation encrypted?",
    content:
      "All voice and video calls use end-to-end encryption via WebRTC. Text messages are encrypted in transit. We cannot access, record, or monitor your conversations under any circumstances.",
  },
  {
    id: "data",
    title: "What data do you collect?",
    content:
      "We collect zero personal data. No IP logs, no chat logs, no usage patterns, no cookies for tracking. The platform operates on a strict no-log policy.",
  },
  {
    id: "reporting",
    title: "Can I report inappropriate behavior?",
    content:
      "While we respect anonymity, we maintain community guidelines. Users can report violations within a session. Repeated violations result in shadow bans or permanent exclusion from the network.",
  },
  {
    id: "account",
    title: "Do I need to create an account?",
    content:
      "No. Click 'Start Chatting' on the homepage and you are connected instantly. No email, no password, no personal data required.",
  },
];

export default function FAQSection() {
  return (
    <section id="faq" className="py-24 md:py-32 px-6" style={{ backgroundColor: "var(--color-surface)" }}>
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-balance tracking-tight" style={{ color: "var(--color-text-primary)" }}>
            Frequently Asked Questions
          </h2>
          <div className="section-accent mx-auto mt-4" />
          <p className="mt-4 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            Everything you need to know about anonymous chat.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
          className="glass-card rounded-2xl p-1"
        >
          <Accordion
            items={faqs}
          />
        </motion.div>
      </div>
    </section>
  );
}
