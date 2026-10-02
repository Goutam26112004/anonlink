"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { useChatStore } from "../../store/chatStore";
import { ArrowRight, ArrowLeft, Check, ExternalLink, Lock, User, EyeOff, Shield, AlertTriangle, Heart, Flag, Loader2 } from "lucide-react";

const AGE_RANGES = [
  { value: "AGE_18_24", label: "18-24", badge: "Most active" },
  { value: "AGE_25_34", label: "25-34" },
  { value: "AGE_35_44", label: "35-44" },
  { value: "AGE_45_PLUS", label: "45+" },
];

const GENDER_OPTIONS = [
  { value: "MALE", label: "Male", icon: User, color: "from-blue-500/20 to-blue-600/5" },
  { value: "FEMALE", label: "Female", icon: Heart, color: "from-pink-500/20 to-pink-600/5" },
  { value: "PREFER_NOT_TO_SAY", label: "Rather not say", icon: EyeOff, color: "from-neutral-500/20 to-neutral-600/5" },
];

const GUIDELINES = [
  { icon: Shield, text: "No harassment or hate speech — treat everyone with respect.", color: "text-emerald-400" },
  { icon: AlertTriangle, text: "No scams, malicious links, or solicitation of any kind.", color: "text-amber-400" },
  { icon: Flag, text: "Report inappropriate behavior using the flag icon in chat.", color: "text-blue-400" },
  { icon: Lock, text: "Never share personal info — phone, address, full name, socials.", color: "text-purple-400" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { token, setOnboardingComplete, setConsentGiven } = useChatStore();
  const [step, setStep] = useState(0);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => { if (!token) router.push("/"); }, [token, router]);

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      await apiFetch("/api/v1/onboarding/complete", {
        method: "POST",
        body: JSON.stringify({ ageRange: age, gender, genderPreference: "NO_PREFERENCE", consentGiven: true }),
      });
      setOnboardingComplete(true);
      setConsentGiven(true);
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (e: any) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const canProceed = age && gender && age !== "UNDER_18";

  return (
    <div className="min-h-screen bg-[var(--color-void)] flex items-center justify-center p-4 sm:p-6">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(139, 92, 246, 0.04) 0%, transparent 70%)" }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {[0, 1].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                step === s ? 'bg-[var(--brand)] text-white shadow-lg shadow-[var(--brand)]/30' :
                step > s ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
              }`}>
                {step > s ? <Check className="w-3.5 h-3.5" /> : s + 1}
              </div>
              {s < 1 && <div className={`w-12 h-0.5 rounded-full transition-all duration-300 ${step > 0 ? 'bg-emerald-500/40' : 'bg-[var(--color-border)]'}`} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6 sm:p-8" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
          <AnimatePresence mode="wait">
            {step === 0 ? (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Age Selection */}
                <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">How old are you?</h2>
                <p className="text-xs text-[var(--color-text-secondary)] mb-5">This helps us match you with the right people.</p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {AGE_RANGES.map((o) => {
                    const selected = age === o.value;
                    return (
                      <button
                        key={o.value}
                        onClick={() => setAge(o.value)}
                        className={`relative flex flex-col items-center justify-center py-5 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                          selected
                            ? 'border-[var(--brand)] bg-[var(--brand)]/8 shadow-lg shadow-[var(--brand)]/10'
                            : 'border-[var(--color-border)] bg-[var(--color-surface-2)]/50 hover:bg-[var(--color-surface-2)] hover:border-[var(--color-text-secondary)]/30'
                        }`}
                      >
                        <span className={`text-lg font-bold ${selected ? 'text-[var(--brand)]' : 'text-[var(--color-text-primary)]'}`}>
                          {o.label}
                        </span>
                        {o.badge && (
                          <span className="mt-1.5 text-[10px] font-bold text-[var(--color-accent)] px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10">
                            {o.badge}
                          </span>
                        )}
                        {selected && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--brand)] flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setAge(age === "UNDER_18" ? "" : "UNDER_18")}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all mb-6 ${
                    age === "UNDER_18" ? "border-[var(--color-danger)]/40 bg-[var(--color-danger)]/5" : "border-[var(--color-border)] bg-[var(--color-surface-2)]/30 opacity-60 hover:opacity-80"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-[var(--color-text-secondary)]" />
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">Under 18</span>
                  </div>
                  <span className="text-[10px] font-bold text-[var(--color-text-secondary)] bg-[var(--color-surface-2)] px-2 py-0.5 rounded">NOT ELIGIBLE</span>
                </button>

                {age === "UNDER_18" && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-3 rounded-xl bg-[var(--color-danger)]/8 border border-[var(--color-danger)]/20">
                    <p className="text-xs text-[var(--color-danger)] font-medium">AnonLink requires users to be 18 or older to use the platform.</p>
                  </motion.div>
                )}

                {/* Gender Selection */}
                <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">How do you identify?</h2>
                <p className="text-xs text-[var(--color-text-secondary)] mb-5">Used for matching preferences only.</p>

                <div className="space-y-2.5 mb-6">
                  {GENDER_OPTIONS.map((o) => {
                    const selected = gender === o.value;
                    const Icon = o.icon;
                    return (
                      <button
                        key={o.value}
                        onClick={() => setGender(o.value)}
                        className={`w-full flex items-center gap-3.5 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                          selected
                            ? 'border-[var(--brand)] bg-[var(--brand)]/8 shadow-lg shadow-[var(--brand)]/10'
                            : 'border-[var(--color-border)] bg-[var(--color-surface-2)]/50 hover:bg-[var(--color-surface-2)] hover:border-[var(--color-text-secondary)]/30'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${o.color} flex items-center justify-center border border-white/5`}>
                          <Icon className={`w-5 h-5 ${selected ? 'text-[var(--brand)]' : 'text-[var(--color-text-secondary)]'}`} />
                        </div>
                        <span className={`font-semibold text-sm ${selected ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-primary)]/80'}`}>
                          {o.label}
                        </span>
                        {selected && (
                          <div className="ml-auto w-5 h-5 rounded-full bg-[var(--brand)] flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Next button */}
                <button
                  onClick={() => canProceed && setStep(1)}
                  disabled={!canProceed}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                    canProceed
                      ? 'text-white cursor-pointer hover:brightness-110 shadow-lg shadow-[var(--brand)]/20'
                      : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] cursor-not-allowed border border-[var(--color-border)]'
                  }`}
                  style={canProceed ? { background: "linear-gradient(135deg, var(--brand), var(--color-primary-deep))" } : {}}
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">Community Guidelines</h2>
                <p className="text-xs text-[var(--color-text-secondary)] mb-5">
                  Please read carefully. Full policy available <a href="/help" target="_blank" className="text-[var(--brand)] hover:underline inline-flex items-center gap-0.5">here <ExternalLink className="w-3 h-3" /></a>.
                </p>

                <div className="space-y-2.5 mb-6">
                  {GUIDELINES.map((item, i) => (
                    <div key={i} className="flex gap-3 p-3.5 rounded-xl bg-[var(--color-surface-2)]/60 border border-[var(--color-border)]/50">
                      <div className="w-8 h-8 rounded-lg bg-[var(--color-surface)] flex items-center justify-center shrink-0 border border-[var(--color-border)]">
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed pt-1.5">{item.text}</p>
                    </div>
                  ))}
                </div>

                {/* Consent checkboxes */}
                <div className="space-y-2.5 mb-6">
                  {[
                    { checked: c1, set: setC1, label: "I confirm I am 18 years or older" },
                    { checked: c2, set: setC2, label: "I agree to the Community Guidelines" },
                  ].map((cb) => (
                    <label key={cb.label} className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                      cb.checked ? 'bg-[var(--brand)]/5 border-[var(--brand)]/30' : 'bg-[var(--color-surface-2)]/50 border-[var(--color-border)] hover:bg-[var(--color-surface-2)]'
                    }`}>
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        cb.checked ? 'bg-[var(--brand)] border-[var(--brand)]' : 'border-[var(--color-border)] bg-transparent'
                      }`}>
                        {cb.checked && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <input type="checkbox" checked={cb.checked} onChange={(e) => cb.set(e.target.checked)} className="sr-only" />
                      <span className="text-sm text-[var(--color-text-primary)] font-medium">{cb.label}</span>
                    </label>
                  ))}
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-3 rounded-xl bg-[var(--color-danger)]/8 border border-[var(--color-danger)]/20">
                    <p className="text-xs text-[var(--color-danger)] font-medium">{error}</p>
                  </motion.div>
                )}

                {success && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-4 p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
                    <p className="text-xs text-emerald-400 font-medium flex items-center gap-2"><Check className="w-3.5 h-3.5" /> All set! Redirecting to dashboard...</p>
                  </motion.div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(0)}
                    className="flex-1 py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] font-bold text-sm hover:bg-[var(--color-surface-2)] transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={submit}
                    disabled={loading || !c1 || !c2 || success}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                      loading || !c1 || !c2 || success
                        ? 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] cursor-not-allowed border border-[var(--color-border)]'
                        : 'text-white cursor-pointer hover:brightness-110 shadow-lg shadow-[var(--brand)]/20'
                    }`}
                    style={!loading && c1 && c2 && !success ? { background: "linear-gradient(135deg, var(--brand), var(--color-primary-deep))" } : {}}
                  >
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Setting up...</> : success ? <><Check className="w-4 h-4" /> Done!</> : <>Finish Setup <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-[var(--color-text-secondary)] mt-6 opacity-60">
          Your information is only used for matching and is never shared.
        </p>
      </motion.div>
    </div>
  );
}
