"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useChatStore } from "../../store/chatStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown, Clock, Check, X, RefreshCw, AlertCircle,
  Mic, Video, Filter, MessageCircle, Image, Flag, Sparkles,
} from "lucide-react";
import { AuthenticatedLayout } from "../../components/AuthenticatedLayout";

type Plan = {
  id: string; type: string; priceInr: number; validityDays: number;
  isActive: boolean; isVoiceEnabled: boolean; isVideoEnabled: boolean;
};
type Subscription = {
  id: string; status: string; purchasedAt: string; expiresAt: string;
  plan: Plan; grantedByAdmin: boolean; transactionRef: string | null;
};

function formatCountdown(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${mins}m remaining`;
  return `${mins}m remaining`;
}

const PLAN_META: Record<string, { label: string; badge: string; gradient: string; badgeColor: string; popular?: boolean }> = {
  DAILY: { label: "Daily", badge: "Starter", gradient: "from-slate-600 to-slate-800", badgeColor: "bg-slate-500/20 text-slate-300" },
  WEEKLY: { label: "Weekly", badge: "Most Popular", gradient: "from-violet-600 to-purple-800", badgeColor: "bg-violet-500/20 text-violet-300", popular: true },
  MONTHLY: { label: "Monthly", badge: "Best Value", gradient: "from-amber-500 to-orange-700", badgeColor: "bg-amber-500/20 text-amber-300" },
};

const FEATURES = [
  { label: "Text Chat", icon: MessageCircle, free: true, paid: true },
  { label: "Image Sharing (60s)", icon: Image, free: false, paid: true },
  { label: "Report & Block", icon: Flag, free: true, paid: true },
  { label: "Voice Chat", icon: Mic, free: false, paid: true },
  { label: "Video Chat", icon: Video, free: false, paid: true },
  { label: "Gender Filter", icon: Filter, free: false, paid: true },
];

export default function SubscriptionPage() {
  const router = useRouter();
  const { token } = useChatStore();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [active, setActive] = useState<Subscription | null>(null);
  const [history, setHistory] = useState<Subscription[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [selectedPlanName, setSelectedPlanName] = useState("");

  useEffect(() => { if (!token) router.push("/"); }, [token, router]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const plansData = await apiFetch("/api/v1/subscriptions/plans", { skipAuth: true }).catch(() => null);
      if (plansData) setPlans(plansData.plans || []);
    } catch {}
    try {
      const myData = await apiFetch("/api/v1/subscriptions/my").catch(() => null);
      if (myData) {
        setActive(myData.active);
        setHistory(myData.history || []);
        setRemainingSeconds(myData.remainingSeconds);
      }
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!remainingSeconds) return;
    const timer = setInterval(() => setRemainingSeconds(s => s !== null && s > 0 ? s - 1 : 0), 1000);
    return () => clearInterval(timer);
  }, [remainingSeconds]);

  const handleUpgrade = (plan: Plan) => {
    setSelectedPlanName(PLAN_META[plan.type]?.label || plan.type);
    setShowComingSoon(true);
  };

  if (loading) return (
    <AuthenticatedLayout>
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3 text-[var(--color-signal-violet)]"><RefreshCw className="w-5 h-5 animate-spin" /> Loading...</div>
      </div>
    </AuthenticatedLayout>
  );

  return (
    <AuthenticatedLayout><div className="flex-1 flex flex-col overflow-hidden text-[var(--color-text-primary)]">
      <header className="app-header shrink-0 z-30 bg-[var(--color-surface)]/80 backdrop-blur-xl border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between px-4 sm:px-6 pl-[4.5rem] lg:pl-4" style={{ minHeight: '64px', paddingTop: '14px', paddingBottom: '14px' }}>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Subscription</h1>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto">
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.06) 0%, transparent 60%)" }} />

      {/* Coming Soon Modal */}
      <AnimatePresence>
        {showComingSoon && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-signal-violet)] to-purple-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[var(--color-signal-violet)]/20">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Coming Soon!</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                Payment for the <strong className="text-[var(--color-text-primary)]">{selectedPlanName}</strong> plan is being set up. Contact the admin for manual activation.
              </p>
              <div className="p-3 rounded-xl text-xs mb-6 bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-secondary)] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[var(--color-signal-violet)]" />
                <span>Payment gateway integration coming in a future update. You can request a subscription from the admin panel.</span>
              </div>
              <button onClick={() => setShowComingSoon(false)} className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--color-signal-violet)] to-purple-700 text-white font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-[var(--color-signal-violet)]/20">
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-14 lg:pt-0 py-8 sm:py-12 relative z-10">
        {/* Header */}


        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-signal-violet)]/10 border border-[var(--color-signal-violet)]/20 text-[var(--color-signal-violet)] text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5" /> PREMIUM
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Unlock the Full Experience</h1>
          <p className="text-[var(--color-text-secondary)] max-w-lg mx-auto">Voice chat, video calls, and advanced matching. No ads, no trackers — just premium features.</p>
        </motion.div>

        {/* Active Subscription Banner */}
        <AnimatePresence>
          {active && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-10 p-5 rounded-2xl border border-[var(--color-signal-violet)]/30 bg-[var(--color-signal-violet)]/5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-signal-violet)]/5 to-transparent" />
              <div className="relative flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-signal-violet)] to-purple-700 flex items-center justify-center shadow-lg">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-[var(--color-text-primary)]">{PLAN_META[active.plan.type]?.label} Plan — Active</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{active.grantedByAdmin ? "Granted by Admin" : `Since ${new Date(active.purchasedAt).toLocaleDateString()}`}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[var(--color-signal-violet)]">{formatCountdown(active.expiresAt)}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">Expires {new Date(active.expiresAt).toLocaleDateString()}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Plans Grid */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
          {plans.map((plan, i) => {
            const meta = PLAN_META[plan.type] || { label: plan.type, badge: "", gradient: "from-slate-600 to-slate-800", badgeColor: "bg-slate-500/20 text-slate-300" };
            const isCurrentPlan = active?.plan?.type === plan.type;
            const isPopular = meta.popular;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className={`relative bg-[var(--color-surface)] border rounded-2xl p-6 flex flex-col ${
                  isPopular ? 'border-[var(--color-signal-violet)]/40 shadow-xl shadow-[var(--color-signal-violet)]/10 scale-[1.02] md:-mt-2 md:mb-[-8px]' :
                  isCurrentPlan ? 'border-[var(--color-signal-violet)]/30' :
                  'border-[var(--color-border)]'
                }`}
              >
                {/* Badge */}
                {meta.badge && (
                  <span className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold ${
                    isPopular ? 'bg-[var(--color-signal-violet)] text-white shadow-lg shadow-[var(--color-signal-violet)]/30' : meta.badgeColor
                  }`}>
                    {meta.badge}
                  </span>
                )}

                {/* Plan icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                  <Crown className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-xl font-bold mb-1">{meta.label}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-extrabold">₹{plan.priceInr}</span>
                  <span className="text-sm text-[var(--color-text-secondary)]">/{plan.validityDays === 1 ? 'day' : plan.validityDays === 7 ? 'week' : 'month'}</span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mb-5">{plan.validityDays} day{plan.validityDays > 1 ? 's' : ''} of full access</p>

                {/* Features */}
                <div className="space-y-2.5 mb-6 flex-1">
                  {FEATURES.map((feat) => {
                    const enabled = feat.label.includes("Voice") ? plan.isVoiceEnabled :
                      feat.label.includes("Video") ? plan.isVideoEnabled : feat.paid;
                    return (
                      <div key={feat.label} className="flex items-center gap-2.5 text-sm">
                        {enabled
                          ? <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center"><Check className="w-3 h-3 text-emerald-400" /></div>
                          : <div className="w-5 h-5 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center"><X className="w-3 h-3 text-[var(--color-text-secondary)]" /></div>
                        }
                        <span className={enabled ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}>{feat.label}</span>
                      </div>
                    );
                  })}
                </div>

                {/* CTA */}
                <motion.button
                  whileHover={!isCurrentPlan ? { scale: 1.02 } : {}}
                  whileTap={!isCurrentPlan ? { scale: 0.98 } : {}}
                  onClick={() => !isCurrentPlan && handleUpgrade(plan)}
                  disabled={isCurrentPlan}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
                    isCurrentPlan
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                      : isPopular
                        ? 'bg-gradient-to-r from-[var(--color-signal-violet)] to-purple-700 text-white hover:brightness-110 shadow-lg shadow-[var(--color-signal-violet)]/20 cursor-pointer'
                        : 'bg-[var(--color-surface-2)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-signal-violet)]/10 hover:border-[var(--color-signal-violet)]/30 hover:text-[var(--color-signal-violet)] cursor-pointer'
                  }`}
                >
                  {isCurrentPlan ? '✓ Current Plan' : 'Upgrade Now'}
                </motion.button>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Feature Comparison Table */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-[var(--color-border)]">
            <h2 className="text-xl font-bold">Feature Comparison</h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">See what you get with each tier</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-surface-2)]">
                  <th className="text-left p-4 font-semibold">Feature</th>
                  <th className="text-center p-4 font-semibold text-[var(--color-text-secondary)]">Guest</th>
                  <th className="text-center p-4 font-semibold text-[var(--color-text-secondary)]">Free</th>
                  <th className="text-center p-4 font-semibold text-[var(--color-signal-violet)]">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {[
                  { feature: "Text Chat", guest: true, free: true, paid: true },
                  { feature: "Send Friend Requests", guest: false, free: true, paid: true },
                  { feature: "Image Sharing (60s)", guest: false, free: true, paid: true },
                  { feature: "Voice Chat", guest: false, free: false, paid: true },
                  { feature: "Video Chat", guest: false, free: false, paid: true },
                  { feature: "Gender Preference Filter", guest: false, free: false, paid: true },
                  { feature: "Priority Matching", guest: false, free: false, paid: true },
                ].map((row) => (
                  <tr key={row.feature} className="hover:bg-[var(--color-surface-2)]/50 transition-colors">
                    <td className="p-4 font-medium">{row.feature}</td>
                    <td className="p-4 text-center">{row.guest ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-[var(--color-text-secondary)]/40 mx-auto" />}</td>
                    <td className="p-4 text-center">{row.free ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-[var(--color-text-secondary)]/40 mx-auto" />}</td>
                    <td className="p-4 text-center">{row.paid ? <Check className="w-4 h-4 text-[var(--color-signal-violet)] mx-auto" /> : <X className="w-4 h-4 text-[var(--color-text-secondary)]/40 mx-auto" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div></div></AuthenticatedLayout>
  );
}
