"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useChatStore } from "../../store/chatStore";
import { Crown, Clock, Zap, Mic, Video, Check, X, ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";

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

const PLAN_META: Record<string, { label: string; badge: string; color: string }> = {
  DAILY:   { label: "Daily",   badge: "Try it out",  color: "from-slate-500 to-slate-600" },
  WEEKLY:  { label: "Weekly",  badge: "Most Popular", color: "from-indigo-600 to-purple-600" },
  MONTHLY: { label: "Monthly", badge: "Best Value",  color: "from-purple-600 to-pink-600" },
};

export default function SubscriptionPage() {
  const router = useRouter();
  const { token, theme } = useChatStore();
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

  // Live countdown
  useEffect(() => {
    if (!remainingSeconds) return;
    const timer = setInterval(() => setRemainingSeconds(s => s !== null && s > 0 ? s - 1 : 0), 1000);
    return () => clearInterval(timer);
  }, [remainingSeconds]);

  const handleUpgrade = (plan: Plan) => {
    setSelectedPlanName(PLAN_META[plan.type]?.label || plan.type);
    setShowComingSoon(true);
  };

  const isDark = theme === "dark";
  const bg = isDark ? "bg-[#0B0F19]" : "bg-[#F8FAFC]";
  const text = isDark ? "text-white" : "text-slate-900";
  const sub = isDark ? "text-slate-400" : "text-slate-500";
  const card = isDark ? "bg-[#1E293B]/70 border-white/5" : "bg-white border-slate-200";

  if (loading) return (
    <div className={`min-h-screen ${bg} ${text} flex items-center justify-center`}>
      <div className="flex items-center gap-3 text-indigo-400"><RefreshCw className="w-5 h-5 animate-spin" /> Loading subscription...</div>
    </div>
  );

  return (
    <div className={`min-h-screen ${bg} ${text}`}>
      {/* Coming Soon Modal */}
      {showComingSoon && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`${card} border rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl`}>
            <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Coming Soon!</h3>
            <p className={`text-sm mb-4 ${sub}`}>
              Payment for the <strong>{selectedPlanName}</strong> plan is being set up.
              Contact the admin for manual activation.
            </p>
            <div className={`p-3 rounded-xl text-xs mb-6 ${isDark ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
              <AlertCircle className="w-4 h-4 inline mr-1" />
              Payment gateway integration coming in a future update.
            </div>
            <button onClick={() => setShowComingSoon(false)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold hover:brightness-110 transition-all">
              Got it
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-12">
        <button onClick={() => router.push("/dashboard")} className={`flex items-center gap-2 text-sm ${sub} hover:text-indigo-400 transition-colors mb-8`}>
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="mb-10">
          <h1 className="text-3xl font-extrabold mb-2">Subscription Plans</h1>
          <p className={sub}>Unlock voice chat, video chat, and gender preference matching.</p>
        </div>

        {/* Active Subscription Status Card */}
        {active ? (
          <div className={`border rounded-2xl p-6 mb-10 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 ${isDark ? "border-indigo-500/20" : "border-indigo-200"}`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="font-bold">{PLAN_META[active.plan.type]?.label} Plan — Active</p>
                  <p className={`text-sm ${sub}`}>{active.grantedByAdmin ? "Granted by Admin" : `Purchased: ${new Date(active.purchasedAt).toLocaleDateString()}`}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-indigo-400">{formatCountdown(active.expiresAt)}</p>
                <p className={`text-xs ${sub}`}>Expires: {new Date(active.expiresAt).toLocaleString()}</p>
              </div>
            </div>
            {remainingSeconds !== null && remainingSeconds < 86400 && (
              <div className={`mt-4 text-sm font-semibold ${remainingSeconds < 3600 ? "text-rose-400" : "text-amber-400"}`}>
                ⚠️ Subscription expiring soon! Renew to keep your features.
              </div>
            )}
          </div>
        ) : (
          <div className={`border rounded-2xl p-6 mb-10 ${card}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="font-bold">Free Plan</p>
                <p className={`text-sm ${sub}`}>Text chat and image sharing only. Upgrade for voice &amp; video.</p>
              </div>
            </div>
          </div>
        )}

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => {
            const meta = PLAN_META[plan.type] || { label: plan.type, badge: "", color: "from-slate-500 to-slate-600" };
            const isCurrentPlan = active?.plan?.type === plan.type;
            return (
              <div key={plan.id} className={`relative border rounded-2xl p-6 flex flex-col ${card} ${isCurrentPlan ? (isDark ? "border-indigo-500/50" : "border-indigo-400") : ""}`}>
                {meta.badge && (
                  <span className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${meta.color} text-white`}>
                    {meta.badge}
                  </span>
                )}
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${meta.color} flex items-center justify-center mb-4`}>
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-1">{meta.label}</h3>
                <p className={`text-3xl font-extrabold mb-1`}>₹{plan.priceInr}</p>
                <p className={`text-sm mb-6 ${sub}`}>{plan.validityDays} day{plan.validityDays > 1 ? "s" : ""} access</p>
                <div className="space-y-2 mb-6 flex-1">
                  {[
                    { label: "Text Chat", ok: true },
                    { label: "Image Sharing (60s)", ok: true },
                    { label: "Report & Block", ok: true },
                    { label: "Voice Chat", ok: plan.isVoiceEnabled },
                    { label: "Video Chat", ok: plan.isVideoEnabled },
                    { label: "Gender Filter", ok: true },
                  ].map((feat) => (
                    <div key={feat.label} className={`flex items-center gap-2 text-sm ${feat.ok ? "" : sub}`}>
                      {feat.ok ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <X className="w-4 h-4 text-slate-600 shrink-0" />}
                      {feat.label}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={isCurrentPlan}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                    isCurrentPlan
                      ? "bg-indigo-600/20 text-indigo-400 cursor-default"
                      : `bg-gradient-to-r ${meta.color} text-white hover:brightness-110 cursor-pointer active:scale-95`
                  }`}
                >
                  {isCurrentPlan ? "✓ Current Plan" : "Upgrade"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison */}
        <div className={`border rounded-2xl overflow-hidden ${card}`}>
          <div className="p-6 border-b border-white/5">
            <h2 className="text-xl font-bold">Feature Comparison</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={isDark ? "bg-white/5" : "bg-slate-50"}>
                  <th className="text-left p-4 font-semibold">Feature</th>
                  <th className="text-center p-4 font-semibold">Guest</th>
                  <th className="text-center p-4 font-semibold">Free</th>
                  <th className="text-center p-4 font-semibold text-indigo-400">Paid</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? "divide-white/5" : "divide-slate-100"}`}>
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
                  <tr key={row.feature} className={isDark ? "hover:bg-white/5" : "hover:bg-slate-50"}>
                    <td className="p-4 font-medium">{row.feature}</td>
                    {[row.guest, row.free, row.paid].map((v, i) => (
                      <td key={i} className="p-4 text-center">
                        {v ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subscription History */}
        {history.length > 0 && (
          <div className={`border rounded-2xl mt-8 overflow-hidden ${card}`}>
            <div className="p-6 border-b border-white/5">
              <h2 className="text-xl font-bold">Subscription History</h2>
            </div>
            <div className="divide-y divide-white/5">
              {history.map((h) => (
                <div key={h.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{PLAN_META[h.plan.type]?.label || h.plan.type} Plan</p>
                    <p className={`text-xs ${sub}`}>{new Date(h.purchasedAt).toLocaleDateString()} → {h.expiredAt ? new Date(h.expiredAt).toLocaleDateString() : "Active"}</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    h.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-400" :
                    h.status === "EXPIRED" ? "bg-slate-500/20 text-slate-400" :
                    "bg-rose-500/20 text-rose-400"
                  }`}>{h.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
