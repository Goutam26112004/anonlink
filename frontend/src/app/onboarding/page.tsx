"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChatStore } from "../../store/chatStore";
import { User, Calendar, ArrowRight, CheckCircle } from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

const AGE_OPTIONS = [
  { value: "UNDER_18", label: "Under 18" },
  { value: "AGE_18_24", label: "18 – 24" },
  { value: "AGE_25_34", label: "25 – 34" },
  { value: "AGE_35_44", label: "35 – 44" },
  { value: "AGE_45_PLUS", label: "45+" },
];

const GENDER_OPTIONS = [
  { value: "MALE", label: "Male", emoji: "👨" },
  { value: "FEMALE", label: "Female", emoji: "👩" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say", emoji: "🙂" },
];

type Step = "age" | "gender" | "confirm";

export default function OnboardingPage() {
  const router = useRouter();
  const { token, theme, setOnboardingComplete } = useChatStore();
  const [step, setStep] = useState<Step>("age");
  const [selectedAge, setSelectedAge] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) router.push("/");
  }, [token, router]);

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
      router.push("/dashboard");
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === "dark";
  const bg = isDark ? "bg-[#0B0F19]" : "bg-[#F8FAFC]";
  const card = isDark ? "bg-[#1E293B]/80 border-white/5" : "bg-white border-slate-200";
  const text = isDark ? "text-white" : "text-slate-900";
  const subText = isDark ? "text-slate-400" : "text-slate-500";
  const btnBase = "w-full py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer";
  const optionBase = `rounded-xl border-2 p-4 cursor-pointer transition-all duration-200 text-center ${isDark ? "border-white/10 hover:border-indigo-500/50" : "border-slate-200 hover:border-indigo-400"}`;
  const optionSelected = "border-indigo-500 bg-indigo-500/10";

  const stepIcons: Record<Step, React.ReactNode> = {
    age: <Calendar className="w-6 h-6" />,
    gender: <User className="w-6 h-6" />,
    confirm: <CheckCircle className="w-6 h-6" />,
  };

  const stepTitles: Record<Step, string> = {
    age: "How old are you?",
    gender: "How do you identify?",
    confirm: "Almost there!",
  };

  const stepSubs: Record<Step, string> = {
    age: "This helps us provide age-appropriate content and matching.",
    gender: "This information is kept private and used only for your experience.",
    confirm: "Review your choices before continuing.",
  };

  return (
    <div className={`min-h-screen ${bg} ${text} flex flex-col items-center justify-center p-6`}>
      {/* Progress Bar */}
      <div className="w-full max-w-md mb-8">
        <div className="flex items-center justify-between mb-2">
          {(["age", "gender", "confirm"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === s ? "bg-indigo-600 text-white" :
                (["age", "gender", "confirm"].indexOf(step) > i ? "bg-indigo-600/30 text-indigo-400" : (isDark ? "bg-white/5 text-slate-500" : "bg-slate-100 text-slate-400"))
              }`}>{i + 1}</div>
              {i < 2 && <div className={`flex-1 h-0.5 mx-2 ${isDark ? "bg-white/5" : "bg-slate-200"}`}></div>}
            </div>
          ))}
        </div>
      </div>

      <div className={`w-full max-w-md p-8 rounded-3xl border backdrop-blur-xl shadow-2xl ${card}`}>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 bg-indigo-600/20 text-indigo-400`}>
          {stepIcons[step]}
        </div>

        <h1 className="text-2xl font-bold mb-2">{stepTitles[step]}</h1>
        <p className={`text-sm mb-6 ${subText}`}>{stepSubs[step]}</p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            {error}
          </div>
        )}

        {step === "age" && (
          <div className="grid grid-cols-1 gap-3">
            {AGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedAge(opt.value)}
                className={`${optionBase} ${selectedAge === opt.value ? optionSelected : ""} ${text}`}
              >
                <span className="font-semibold">{opt.label}</span>
              </button>
            ))}
            <button
              onClick={() => selectedAge && setStep("gender")}
              disabled={!selectedAge}
              className={`${btnBase} mt-4 ${selectedAge ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:brightness-110" : "bg-slate-500/20 text-slate-500 cursor-not-allowed"}`}
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === "gender" && (
          <div className="space-y-3">
            {GENDER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedGender(opt.value)}
                className={`${optionBase} w-full flex items-center gap-3 ${selectedGender === opt.value ? optionSelected : ""} ${text}`}
              >
                <span className="text-2xl">{opt.emoji}</span>
                <span className="font-semibold">{opt.label}</span>
              </button>
            ))}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setStep("age")} className={`${btnBase} flex-1 ${isDark ? "bg-white/5 hover:bg-white/10" : "bg-slate-100 hover:bg-slate-200"}`}>Back</button>
              <button
                onClick={() => selectedGender && setStep("confirm")}
                disabled={!selectedGender}
                className={`${btnBase} flex-1 ${selectedGender ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:brightness-110" : "bg-slate-500/20 text-slate-500 cursor-not-allowed"}`}
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${subText}`}>Age Group</p>
              <p className="font-semibold">{AGE_OPTIONS.find(a => a.value === selectedAge)?.label}</p>
            </div>
            <div className={`p-4 rounded-xl ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${subText}`}>Gender</p>
              <p className="font-semibold">{GENDER_OPTIONS.find(g => g.value === selectedGender)?.label}</p>
            </div>
            <div className={`p-3 rounded-xl text-xs ${isDark ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
              🔒 This information is stored privately and used only to improve your experience.
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep("gender")} className={`${btnBase} flex-1 ${isDark ? "bg-white/5 hover:bg-white/10" : "bg-slate-100 hover:bg-slate-200"}`}>Back</button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`${btnBase} flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:brightness-110`}
              >
                {loading ? "Saving..." : "Get Started 🚀"}
              </button>
            </div>
          </div>
        )}
      </div>

      <p className={`mt-6 text-xs ${subText}`}>AnonLink — Anonymous, Safe, Private</p>
    </div>
  );
}
