"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { HeroBackground } from "./HeroBackground";
import { HeroIllustration } from "./HeroIllustration";
import { LiveCounter } from "./LiveCounter";
import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";

const easeSnappy = [0.16, 1, 0.3, 1] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easeSnappy },
  },
};

export default function HeroSection() {
  const router = useRouter();
  const sectionRef = useRef<HTMLDivElement>(null);

  const handleLearnMore = () => {
    const features = document.getElementById("features");
    if (features) {
      features.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      <HeroBackground />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16"
      >
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text content */}
          <div className="text-center lg:text-left">
            <motion.div variants={itemVariants}>
              <LiveCounter className="justify-center lg:justify-start mb-8" />
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="heading-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl mb-6 leading-[1.05]"
            >
              <span className="text-[var(--text-primary)]">Real</span>{" "}
              <span className="text-gradient-brand">Conversations.</span>
              <br />
              <span className="text-[var(--text-primary)]">Zero</span>{" "}
              <span className="text-gradient-brand">Pressure.</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-base sm:text-lg text-[var(--text-secondary)] max-w-lg mx-auto lg:mx-0 mb-10 leading-relaxed"
            >
              Chat anonymously with people from around the world. No trackers, no ads, no subscriptions.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
            >
              <PrimaryButton onClick={() => router.push("/auth")}>
                <span className="flex items-center gap-2">
                  Start Chatting
                  <ArrowRight className="w-4 h-4" />
                </span>
              </PrimaryButton>
              <SecondaryButton onClick={handleLearnMore}>
                Learn More
              </SecondaryButton>
            </motion.div>
          </div>

          {/* Right: Illustration */}
          <motion.div
            variants={itemVariants}
            className="hidden lg:flex items-center justify-center"
          >
            <HeroIllustration className="w-full max-w-[440px]" />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
