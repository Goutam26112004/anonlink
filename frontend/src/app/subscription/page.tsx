"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useChatStore } from "../../store/chatStore";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Clock, Check, X, ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import { NetworkGraph } from "../../components/illustrations/NetworkGraph";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

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

const PLAN_META: Record<string, { label: string; badge: string; gradient: string }> = {
  DAILY:   { label: "Daily",   badge: "Try it out",  gradient: "from-slate-500 to-slate-600" },
  WEEKLY:  { label: "Weekly",  badge: "Most Popular", gradient: "from-[var(--brand)] to-[var(--lavender)]" },
  MONTHLY: { label: "Monthly", badge: "Best Value",  gradient: "from-[var(--lavender)] to-[var(--accent)]" },
};

const ALL_FEATURES = [
  { label: "Text Chat", ok: true },
  { label: "Image Sharing (60s)", ok: true },
  { label: "Report & Block", ok: true },
  { label: "Voice Chat", ok: true },
  { label: "Video Chat", ok: true },
  { label: "Gender Filter", ok: true },
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
      const [plansRes, myRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/v1/subscriptions/plans`),
        fetch(`${BACKEND_URL}/api/v1/subscriptions/my`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (plansRes.ok) setPlans((await plansRes.json()).plans);
      if (myRes.ok) {
        const data = await myRes.json();
        setActive(data.active);
        setHistory(data.history);
        setRemainingSeconds(data.remainingSeconds);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
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
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center">
      <div className="flex items-center gap-3 text-[var(--brand)]"><RefreshCw className="w-5 h-5 animate-spin" /> Loading subscription...</div>
    </div>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] relative">
      <NetworkGraph className="absolute inset-0 opacity-[0.03] pointer-events-none" />

      <AnimatePresence>
        {showComingSoon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-heavy rounded-3xl p-8 max-w-sm w-full text-center shadow-[var(--shadow-xl)] border border-[var(--border-secondary)]"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--brand)] to-[var(--lavender)] flex items-center justify-center mx-auto mb-4 shadow-[var(--shadow-glow)]">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Coming Soon!</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Payment for the <strong>{selectedPlanName}</strong> plan is being set up.
                Contact the admin for manual activation.
              </p>
              <div className="p-3 rounded-xl text-xs mb-6 bg-[var(--warning-subtle)] text-[var(--warning)] border border-[var(--warning)]/20 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Payment gateway integration coming in a future update.</span>
              </div>
              <button onClick={() => setShowComingSoon(false)}
                className="w-full py-3 rounded-xl btn-primary text-base">
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <h1 className="heading-display text-3xl mb-2">Subscription Plans</h1>
          <p className="text-[var(--text-secondary)]">Unlock voice chat, video chat, and gender preference matching.</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {active ? (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-card rounded-2xl p-6 mb-10 border border-[var(--brand)]/30 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--brand-subtle)] to-[var(--lavender-subtle)] opacity-60" />
              <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand)] to-[var(--lavender)] flex items-center justify-center shadow-[var(--shadow-glow)]">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold">{PLAN_META[active.plan.type]?.label} Plan � Active</p>
                    <p className="text-sm text-[var(--text-secondary)]">{active.grantedByAdmin ? "Granted by Admin" : `Purchased: ${new Date(active.purchasedAt).toLocaleDateString()}`}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[var(--brand)]">{formatCountdown(active.expiresAt)}</p>
                  <p className="text-xs text-[var(--text-secondary)]">Expires: {new Date(active.expiresAt).toLocaleString()}</p>
                </div>
              </div>
              {remainingSeconds !== null && remainingSeconds < 86400 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className={`mt-4 text-sm font-semibold ${remainingSeconds < 3600 ? "text-[var(--danger)]" : "text-[var(--warning)]"} relative z-10`}
                >
                  ?? Subscription expiring soon! Renew to keep your features.
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="free"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-card rounded-2xl p-6 mb-10"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[var(--text-muted)]" />
                </div>
                <div>
                  <p className="font-bold">Free Plan</p>
                  <p className="text-sm text-[var(--text-secondary)]">Text chat and image sharing only. Upgrade for voice &amp; video.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          {plans.map((plan) => {
            const meta = PLAN_META[plan.type] || { label: plan.type, badge: "", gradient: "from-slate-500 to-slate-600" };
            const isCurrentPlan = active?.plan?.type === plan.type;
            return (
              <motion.div
                key={plan.id}
                variants={cardVariants}
                className={`glass-card rounded-2xl p-6 flex flex-col relative overflow-hidden ${
                  isCurrentPlan ? "border-[var(--brand)]/40" : ""
                }`}
              >
                {meta.badge && (
                  <span className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${meta.gradient} text-white shadow-lg z-10`}>
                    {meta.badge}
                  </span>
                )}
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${meta.gradient} flex items-center justify-center mb-4`}>
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-1">{meta.label}</h3>
                <p className="text-3xl font-extrabold mb-1">?{plan.priceInr}</p>
                <p className="text-sm text-[var(--text-secondary)] mb-6">{plan.validityDays} day{plan.validityDays > 1 ? "s" : ""} access</p>
                <div className="space-y-2 mb-6 flex-1">
                  {ALL_FEATURES.map((feat) => {
                    const enabled = feat.label === "Voice Chat" ? plan.isVoiceEnabled :
                      feat.label === "Video Chat" ? plan.isVideoEnabled : feat.ok;
                    return (
                      <div key={feat.label} className={`flex items-center gap-2 text-sm ${enabled ? "" : "text-[var(--text-muted)]"}`}>
                        {enabled
                          ? <Check className="w-4 h-4 text-[var(--accent)] shrink-0" />
                          : <X className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                        }
                        {feat.label}
                      </div>
                    );
                  })}
                </div>
                <motion.button
                  whileHover={!isCurrentPlan ? { scale: 1.02 } : {}}
                  whileTap={!isCurrentPlan ? { scale: 0.98 } : {}}
                  onClick={() => handleUpgrade(plan)}
                  disabled={isCurrentPlan}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                    isCurrentPlan
                      ? "bg-[var(--brand-subtle)] text-[var(--brand)] cursor-default"
                      : `bg-gradient-to-r ${meta.gradient} text-white hover:brightness-110 cursor-pointer`
                  }`}
                >
                  {isCurrentPlan ? "? Current Plan" : "Upgrade"}
                </motion.button>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="glass-card rounded-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-[var(--border-primary)]">
            <h2 className="text-xl font-bold">Feature Comparison</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--bg-tertiary)]">
                  <th className="text-left p-4 font-semibold">Feature</th>
                  <th className="text-center p-4 font-semibold">Guest</th>
                  <th className="text-center p-4 font-semibold">Free</th>
                  <th className="text-center p-4 font-semibold text-[var(--brand)]">Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-primary)]">
                {[
                  { feature: "Anonymous Text Chat", guest: true, free: true, paid: true },
                  { feature: "Temporary Image Sharing", guest: true, free: true, paid: true },
                  { feature: "Report & Block Users", guest: true, free: true, paid: true },
                  { feature: "Friend Requests", guest: false, free: true, paid: true },
                  { feature: "Voice Chat", guest: false, free: false, paid: true },
                  { feature: "Video Chat", guest: false, free: false, paid: true },
                  { feature: "Gender Preference Filter", guest: false, free: false, paid: true },
                  { feature: "Advanced Matching", guest: false, free: false, paid: true },
                ].map((row) => (
                  <tr key={row.feature} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                    <td className="p-4 font-medium">{row.feature}</td>
                    {[row.guest, row.free, row.paid].map((v, i) => (
                      <td key={i} className="p-4 text-center">
                        {v ? <Check className="w-4 h-4 text-[var(--accent)] mx-auto" /> : <X className="w-4 h-4 text-[var(--text-muted)] mx-auto" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="glass-card rounded-2xl mt-8 overflow-hidden"
          >
            <div className="p-6 border-b border-[var(--border-primary)]">
              <h2 className="text-xl font-bold">Subscription History</h2>
            </div>
            <div className="divide-y divide-[var(--border-primary)]">
              {history.map((h, i) => (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                  className="p-4 flex items-center justify-between hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <div>
                    <p className="font-semibold">{PLAN_META[h.plan.type]?.label || h.plan.type} Plan</p>
                    <p className="text-xs text-[var(--text-secondary)]">{new Date(h.purchasedAt).toLocaleDateString()} ? {new Date(h.expiresAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    h.status === "ACTIVE" ? "bg-[var(--accent-subtle)] text-[var(--accent)]" :
                    h.status === "EXPIRED" ? "bg-[var(--text-muted)]/10 text-[var(--text-muted)]" :
                    "bg-[var(--danger-subtle)] text-[var(--danger)]"
                  }`}>{h.status}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
