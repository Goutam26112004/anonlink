"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useChatStore } from "../../store/chatStore";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { MatchingGlobe } from "../../components/illustrations/MatchingGlobe";
import { ConnectionLines } from "../../components/illustrations/ConnectionLines";
import { CelebrationAnimation } from "../../components/CelebrationAnimation";
import { AnimatedLogo } from "../../components/AnimatedLogo";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

const AGE_OPTIONS = [
  { value: "UNDER_18", label: "Under 18" },
  { value: "AGE_18_24", label: "18 � 24", recommend: true },
  { value: "AGE_25_34", label: "25 � 34" },
  { value: "AGE_35_44", label: "35 � 44" },
  { value: "AGE_45_PLUS", label: "45+" },
];

const GENDER_OPTIONS = [
  { value: "MALE", label: "Male", emoji: "??", description: "Match with everyone" },
  { value: "FEMALE", label: "Female", emoji: "??", description: "Match with everyone" },
  { value: "PREFER_NOT_TO_SAY", label: "Rather not say", emoji: "??", description: "Privacy first" },
];

const STEPS = ["welcome", "age", "gender", "confirm", "celebrate"] as const;
type Step = (typeof STEPS)[number];

const STEP_COLORS = ["var(--brand)", "var(--cyan)", "var(--lavender)", "var(--accent)", "var(--brand)"];

export default function OnboardingPage() {
  const router = useRouter();
  const { token, setOnboardingComplete } = useChatStore();
  const [step, setStep] = useState<Step>("welcome");
  const [selectedAge, setSelectedAge] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [celebrate, setCelebrate] = useState(false);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (!token) router.push("/");
  }, [token, router]);

  const goTo = (s: Step, dir: number = 1) => {
    setDirection(dir);
    setStep(s);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/onboarding/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ageRange: selectedAge, gender: selectedGender }),
        ...({ credentials: "include" } as any),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save onboarding.");
      setOnboardingComplete(true);
      setCelebrate(true);
      goTo("celebrate");
      setTimeout(() => router.push("/dashboard"), 2500);
    } catch (e: any) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d * 60, filter: "blur(4px)" }),
    center: { opacity: 1, x: 0, filter: "blur(0px)" },
    exit: (d: number) => ({ opacity: 0, x: d * -60, filter: "blur(4px)" }),
  };

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div
        className="absolute inset-0 transition-all duration-700 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, color-mix(in srgb, ${STEP_COLORS[stepIndex]} 4%, transparent) 0%, transparent 70%)`,
        }}
      />

      <div className="absolute top-6 left-6">
        <AnimatedLogo size={24} showText={false} />
      </div>

      <div className="w-full max-w-md mb-10">
        <div className="flex items-center justify-between">
          {STEPS.slice(0, -1).map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <motion.div
                animate={{
                  backgroundColor: stepIndex >= i ? "var(--brand)" : "var(--bg-tertiary)",
                  color: stepIndex >= i ? "#fff" : "var(--text-muted)",
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors relative z-10"
              >
                {stepIndex > i ? <Check className="w-4 h-4" /> : i + 1}
              </motion.div>
              {i < STEPS.length - 2 && (
                <motion.div
                  animate={{
                    backgroundColor: stepIndex > i ? "var(--brand)" : "var(--border-primary)",
                  }}
                  className="flex-1 h-0.5 mx-2 transition-colors"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="relative w-full max-w-md min-h-[400px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="w-full"
          >
            {step === "welcome" && (
              <div className="glass-card rounded-3xl p-8 sm:p-10 text-center border border-[var(--border-primary)] shadow-[var(--shadow-xl)]">
                <MatchingGlobe size={140} className="mx-auto mb-6" />
                <h1 className="heading-display text-2xl mb-2">
                  You&apos;re in!
                </h1>
                <p className="text-sm text-[var(--text-secondary)] mb-8">
                  Just a few quick questions to personalize your experience.
                </p>
                <button
                  onClick={() => goTo("age")}
                  className="btn-primary px-8 py-3 text-base w-full"
                >
                  Let&apos;s Go <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {step === "age" && (
              <div className="glass-card rounded-3xl p-8 sm:p-10 border border-[var(--border-primary)] shadow-[var(--shadow-xl)]">
                <h2 className="heading-section text-xl mb-2">How old are you?</h2>
                <p className="text-sm text-[var(--text-secondary)] mb-6">
                  This helps us provide age-appropriate content and matching.
                </p>
                <div className="grid grid-cols-1 gap-2.5">
                  {AGE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedAge(opt.value)}
                      className={`relative flex items-center justify-between p-3.5 rounded-xl border-2 transition-all duration-200 text-left ${
                        selectedAge === opt.value
                          ? "border-[var(--brand)] bg-[var(--brand-subtle)]"
                          : "border-[var(--border-primary)] hover:border-[var(--brand)]/50 bg-transparent"
                      }`}
                    >
                      <span className="font-semibold text-sm">{opt.label}</span>
                      {opt.recommend && (
                        <span className="text-[10px] font-bold text-[var(--accent)] bg-[var(--accent-subtle)] px-2 py-0.5 rounded-full">
                          Most common
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => goTo("welcome", -1)}
                    className="btn-secondary flex-1"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => selectedAge && goTo("gender")}
                    disabled={!selectedAge}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      selectedAge
                        ? "btn-primary"
                        : "bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-not-allowed"
                    }`}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {step === "gender" && (
              <div className="glass-card rounded-3xl p-8 sm:p-10 border border-[var(--border-primary)] shadow-[var(--shadow-xl)]">
                <h2 className="heading-section text-xl mb-2">How do you identify?</h2>
                <p className="text-sm text-[var(--text-secondary)] mb-6">
                  This is kept private and never shared.
                </p>
                <div className="space-y-2.5">
                  {GENDER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedGender(opt.value)}
                      className={`w-full flex items-center gap-4 p-3.5 rounded-xl border-2 transition-all duration-200 ${
                        selectedGender === opt.value
                          ? "border-[var(--brand)] bg-[var(--brand-subtle)]"
                          : "border-[var(--border-primary)] hover:border-[var(--brand)]/50 bg-transparent"
                      }`}
                    >
                      <span className="text-2xl">{opt.emoji}</span>
                      <div className="text-left">
                        <span className="font-semibold text-sm block">{opt.label}</span>
                        <span className="text-xs text-[var(--text-muted)]">{opt.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => goTo("age", -1)}
                    className="btn-secondary flex-1"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => selectedGender && goTo("confirm")}
                    disabled={!selectedGender}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      selectedGender
                        ? "btn-primary"
                        : "bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-not-allowed"
                    }`}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {step === "confirm" && (
              <div className="glass-card rounded-3xl p-8 sm:p-10 border border-[var(--border-primary)] shadow-[var(--shadow-xl)]">
                <ConnectionLines className="mx-auto mb-4" width={200} height={40} count={2} />
                <h2 className="heading-section text-xl mb-2">Almost there!</h2>
                <p className="text-sm text-[var(--text-secondary)] mb-6">
                  Review your preferences before we start.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--text-muted)]">Age Group</span>
                    <span className="text-sm font-semibold">
                      {AGE_OPTIONS.find((a) => a.value === selectedAge)?.label}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--text-muted)]">Gender</span>
                    <span className="text-sm font-semibold">
                      {GENDER_OPTIONS.find((g) => g.value === selectedGender)?.label}
                    </span>
                  </div>
                </div>
                <div className="p-3.5 rounded-xl text-xs bg-[var(--warning-subtle)] text-[var(--warning)] border border-[var(--warning)]/20 mb-6 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>This information is stored privately and never shared with other users.</span>
                </div>
                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-[var(--danger-subtle)] border border-[var(--danger)]/20 text-[var(--danger)] text-xs">
                    {error}
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => goTo("gender", -1)}
                    className="btn-secondary flex-1"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="btn-primary flex-1"
                  >
                    {loading ? "Setting up..." : "Get Started"}
                  </button>
                </div>
              </div>
            )}

            {step === "celebrate" && (
              <div className="glass-card rounded-3xl p-8 sm:p-10 text-center border border-[var(--border-primary)] shadow-[var(--shadow-xl)] relative overflow-hidden">
                <CelebrationAnimation active={celebrate} />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  className="w-16 h-16 rounded-2xl bg-[var(--accent-subtle)] flex items-center justify-center mx-auto mb-6"
                >
                  <Check className="w-8 h-8 text-[var(--accent)]" />
                </motion.div>
                <h1 className="heading-display text-2xl mb-2">
                  You&apos;re all set!
                </h1>
                <p className="text-sm text-[var(--text-secondary)] mb-2">
                  Redirecting you to the dashboard...
                </p>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 border-2 border-[var(--brand)] border-t-transparent rounded-full mx-auto mt-4"
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="mt-8 text-xs text-[var(--text-muted)]">AnonLink � Anonymous, Safe, Private</p>
    </div>
  );
}
