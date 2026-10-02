"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Mic, Video, Users, Clock, X, ChevronDown, ChevronUp, Crown, Lock, Filter, Sparkles, ArrowRight } from "lucide-react";
import { PremiumModal } from "../ui/PremiumModal";

const modes = [
  { mode: "text" as const, icon: MessageCircle, title: "Text Chat", desc: "Instant text conversations with strangers worldwide", color: "from-violet-500 to-purple-600", glow: "shadow-violet-500/20" },
  { mode: "voice" as const, icon: Mic, title: "Voice Chat", desc: "Real-time voice calls with crystal clear audio", color: "from-blue-500 to-cyan-600", glow: "shadow-blue-500/20" },
  { mode: "video" as const, icon: Video, title: "Video Chat", desc: "Face-to-face video with end-to-end encryption", color: "from-rose-500 to-pink-600", glow: "shadow-rose-500/20" },
];

const interestTags = [
  "Music", "Gaming", "Tech", "Travel", "Sports", "Movies", "Art", "Food", "Science", "Books",
];

const genderOptions = [
  { value: "NO_PREFERENCE" as const, label: "Any" },
  { value: "MALE" as const, label: "Male" },
  { value: "FEMALE" as const, label: "Female" },
];

const ageOptions = [
  { value: "", label: "Any" },
  { value: "AGE_18_24", label: "18-24" },
  { value: "AGE_25_34", label: "25-34" },
  { value: "AGE_35_44", label: "35-44" },
  { value: "AGE_45_PLUS", label: "45+" },
];

interface ModeSelectProps {
  chatMode: "text" | "voice" | "video";
  onSelectMode: (mode: "text" | "voice" | "video") => void;
  onFindMatch: () => void;
  interests: string[];
  onToggleInterest: (tag: string) => void;
  canVoice: boolean;
  canVideo: boolean;
  activeCount: number;
  estimatedWaitSec: number;
  genderPreference: "MALE" | "FEMALE" | "NO_PREFERENCE";
  onGenderPreferenceChange: (v: "MALE" | "FEMALE" | "NO_PREFERENCE") => void;
  ageRange: string;
  onAgeRangeChange: (v: string) => void;
  canGenderFilter: boolean;
  showPreferences: boolean;
  onTogglePreferences: () => void;
}

export function ModeSelect({
  chatMode, onSelectMode, onFindMatch, interests, onToggleInterest,
  canVoice, canVideo, activeCount, estimatedWaitSec,
  genderPreference, onGenderPreferenceChange, ageRange, onAgeRangeChange,
  canGenderFilter, showPreferences, onTogglePreferences,
}: ModeSelectProps) {
  const [premiumFeature, setPremiumFeature] = useState<string | null>(null);

  return (
    <div className="flex-1 flex flex-col items-center p-3 sm:p-6 lg:p-10 overflow-y-auto">
      <div className="w-full max-w-2xl lg:max-w-3xl space-y-5 sm:space-y-8 lg:space-y-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-signal-violet)]/10 border border-[var(--color-signal-violet)]/20 text-[var(--color-signal-violet)] text-xs font-bold mb-4">
            <Sparkles className="w-3 h-3" />
            {activeCount} people online now
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-[var(--color-text-primary)]">
            Start a Conversation
          </h1>
          <p className="text-sm lg:text-base text-[var(--color-text-secondary)] mt-2 max-w-md lg:max-w-lg mx-auto">
            Choose your mode, pick your interests, and connect instantly
          </p>
        </motion.div>

        {/* Mode Cards */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4"
        >
          {modes.map((card, i) => {
            const locked = (card.mode === "voice" && !canVoice) || (card.mode === "video" && !canVideo);
            const selected = chatMode === card.mode;
            return (
              <motion.button
                key={card.mode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                onClick={() => locked ? setPremiumFeature(card.title) : onSelectMode(card.mode)}
                className={`group relative rounded-xl sm:rounded-2xl p-3 sm:p-5 lg:p-6 text-center sm:text-left transition-all duration-200 cursor-pointer border overflow-hidden ${
                  locked
                    ? "border-[var(--color-border)] bg-[var(--color-surface)] opacity-60 hover:opacity-80"
                    : selected
                      ? `border-[var(--color-signal-violet)]/50 bg-[var(--color-signal-violet)]/5 shadow-lg ${card.glow}`
                      : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-signal-violet)]/30 hover:shadow-lg hover:shadow-[var(--color-signal-violet)]/5"
                }`}
              >
                {selected && <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-signal-violet)]/5 to-transparent" />}
                <div className="relative flex flex-col items-center sm:items-start">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-2 sm:mb-3 transition-transform group-hover:scale-105`}>
                    <card.icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  <h3 className="text-[11px] sm:text-sm lg:text-base font-bold text-[var(--color-text-primary)] flex items-center gap-1">
                    {card.mode === "text" ? "Text" : card.mode === "voice" ? "Voice" : "Video"}
                    {locked && <Lock className="w-3 h-3 text-[var(--color-warning)]" />}
                  </h3>
                  <p className="hidden sm:block text-xs lg:text-sm text-[var(--color-text-secondary)] leading-relaxed mt-1">{card.desc}</p>
                  {selected && (
                    <div className="absolute top-1 right-1 sm:top-0 sm:right-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[var(--color-signal-violet)] flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Interests */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
            Interests <span className="text-[var(--color-text-secondary)]/50 normal-case tracking-normal font-normal">(optional)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {interestTags.map((tag) => {
              const selected = interests.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => onToggleInterest(tag)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                    selected
                      ? "bg-[var(--color-signal-violet)] text-white shadow-md shadow-[var(--color-signal-violet)]/20"
                      : "bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]"
                  }`}
                >
                  {tag}
                  {selected && <X className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Preferences Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <button
            onClick={onTogglePreferences}
            className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-signal-violet)] transition-colors uppercase tracking-wider"
          >
            <Filter className="w-3.5 h-3.5" />
            Advanced Filters
            {showPreferences ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {!canGenderFilter && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--color-warning)] bg-[var(--color-warning)]/10 px-2 py-0.5 rounded-full normal-case tracking-normal">
                <Crown className="w-3 h-3" /> Premium
              </span>
            )}
          </button>

          {showPreferences && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-4"
            >
              <div>
                <p className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">Gender</p>
                <div className="flex gap-2">
                  {genderOptions.map((opt) => {
                    const locked = !canGenderFilter && opt.value !== "NO_PREFERENCE";
                    const active = genderPreference === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => locked ? setPremiumFeature("Gender Filters") : onGenderPreferenceChange(opt.value)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                          locked ? "border-[var(--color-border)] text-[var(--color-text-secondary)] opacity-50" :
                          active ? "border-[var(--color-signal-violet)] bg-[var(--color-signal-violet)]/10 text-[var(--color-signal-violet)]" :
                          "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-signal-violet)]/30"
                        }`}
                      >
                        {locked && <Lock className="w-3 h-3 inline mr-1 text-[var(--color-warning)]" />}
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">Age Range</p>
                <div className="flex flex-wrap gap-2">
                  {ageOptions.map((opt) => {
                    const locked = !canGenderFilter && opt.value !== "";
                    const active = ageRange === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => locked ? setPremiumFeature("Advanced Filters") : onAgeRangeChange(opt.value)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                          locked ? "border-[var(--color-border)] text-[var(--color-text-secondary)] opacity-50" :
                          active ? "border-[var(--color-signal-violet)] bg-[var(--color-signal-violet)]/10 text-[var(--color-signal-violet)]" :
                          "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-signal-violet)]/30"
                        }`}
                      >
                        {locked && <Lock className="w-3 h-3 inline mr-1 text-[var(--color-warning)]" />}
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="sticky bottom-0 bg-gradient-to-t from-[var(--color-void)] via-[var(--color-void)]/95 to-transparent pt-4 pb-2 -mx-3 px-3 sm:static sm:bg-transparent sm:pt-0 sm:pb-0 sm:mx-0 sm:px-0"
        >
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <button
              onClick={onFindMatch}
              className="w-full sm:w-auto px-8 lg:px-10 py-3.5 sm:py-4 lg:py-4.5 rounded-2xl text-white font-bold text-sm lg:text-base transition-all hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[var(--color-signal-violet)]/25 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, var(--brand), var(--color-primary-deep))" }}
            >
              Find Someone
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-4 text-xs lg:text-sm text-[var(--color-text-secondary)]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
                <Users className="w-3.5 h-3.5" /> {activeCount} online
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> ~{estimatedWaitSec || 5}s avg
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      <PremiumModal
        open={premiumFeature !== null}
        onClose={() => setPremiumFeature(null)}
        featureName={premiumFeature || ""}
      />
    </div>
  );
}
