"use client";

import { useState, useEffect } from "react";
import { useChatStore } from "../../store/chatStore";
import { useRouter } from "next/navigation";
import {
  MessageCircle, Mic, Video, Users, Bell, Settings,
  Crown, Activity, UserCheck, Search, ArrowRight,
  Zap, MessageSquare, Sparkles, Clock, Shield,
} from "lucide-react";
import { motion } from "framer-motion";
import { StatCard } from "../../components/ui/StatCard";
import { Badge } from "../../components/ui/Badge";
import { apiFetch } from "@/lib/api";
import { PremiumModal } from "../../components/ui/PremiumModal";
import { AuthenticatedLayout } from "../../components/AuthenticatedLayout";

export default function Dashboard() {
  const router = useRouter();
  const store = useChatStore();
  const {
    token, user,
    friends, notifications,
    activeCount, estimatedWaitSec,
    canVoice, canVideo, subscriptionActive, setChatMode, setFeatureAccess,
  } = store;

  const [premiumFeature, setPremiumFeature] = useState<string | null>(null);
  const [platformStats, setPlatformStats] = useState({ onlineUsers: 0, searching: 0, activeChats: 0, messagesToday: 0 });

  useEffect(() => {
    if (!token) router.push("/");
  }, [token, router]);

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const data = await apiFetch("/api/v1/subscriptions/features");
        if (data) {
          setFeatureAccess(data.canVoice, data.canVideo, data.canGenderFilter);
          store.setSubscriptionStatus(!!data.subscriptionActive, null);
        }
      } catch {}
    };
    if (token) fetchFeatures();
  }, [token, setFeatureAccess]);

  // Fetch real platform activity stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiFetch("/api/v1/stats/activity");
        if (data) setPlatformStats(data);
      } catch {}
    };
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleStartChat = () => {
    router.push("/chat");
  };

  return (
    <AuthenticatedLayout>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {/* Hero Section */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-signal-violet)]/5 via-transparent to-transparent pointer-events-none" />
            <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 lg:pt-8 pb-4 sm:pb-6 relative">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center sm:text-left"
              >
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                      <h1 className="text-xl sm:text-3xl font-display font-bold text-[var(--color-text-primary)]">
                        Welcome back{user?.displayName ? `, ${user.displayName}` : ""}
                      </h1>
                      {subscriptionActive && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/15 to-rose-500/15 border border-amber-500/25 text-amber-400 text-[10px] font-bold">
                          <Crown className="w-3 h-3" /> PRO
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      Your hub for anonymous connections
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    <button onClick={() => router.push("/notifications")} className="relative p-2.5 rounded-xl hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition-all border border-transparent hover:border-[var(--color-border)]">
                      <Bell className="w-5 h-5" />
                      {notifications.filter((n) => !n.isRead).length > 0 && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[var(--color-danger)] border-2 border-[var(--color-void)]" />
                      )}
                    </button>
                    <button onClick={() => router.push("/settings")} className="p-2.5 rounded-xl hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition-all border border-transparent hover:border-[var(--color-border)]">
                      <Settings className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Live Stats Ticker */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-4 flex items-center justify-center sm:justify-start gap-3 flex-wrap"
              >
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)]">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
                  <span className="text-xs font-medium text-[var(--color-text-secondary)]"><strong className="text-[var(--color-text-primary)]">{platformStats.onlineUsers}</strong> online</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)]">
                  <MessageCircle className="w-3.5 h-3.5 text-[var(--color-signal-violet)]" />
                  <span className="text-xs font-medium text-[var(--color-text-secondary)]"><strong className="text-[var(--color-text-primary)]">{platformStats.activeChats}</strong> chats</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)]">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-medium text-[var(--color-text-secondary)]"><strong className="text-[var(--color-text-primary)]">{friends.length}</strong> friends</span>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 sm:pb-8 space-y-6">
            {/* Connect CTA */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <button
                onClick={() => router.push("/chat")}
                className="group relative w-full bg-gradient-to-r from-[var(--color-signal-violet)]/10 via-purple-500/5 to-[var(--color-signal-violet)]/10 border border-[var(--color-signal-violet)]/20 rounded-2xl p-6 sm:p-8 text-center transition-all duration-300 hover:border-[var(--color-signal-violet)]/40 hover:shadow-xl hover:shadow-[var(--color-signal-violet)]/10 hover:-translate-y-0.5 cursor-pointer overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-signal-violet)]/5 via-transparent to-[var(--color-signal-violet)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-signal-violet)] to-purple-600 flex items-center justify-center shadow-xl shadow-[var(--color-signal-violet)]/25 group-hover:scale-110 group-hover:rotate-[-3deg] transition-transform duration-300">
                    <MessageCircle className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-display font-bold text-[var(--color-text-primary)] mb-1">
                      Connect the Universe
                    </h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      Start a conversation with someone new — text, voice, or video
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-signal-violet)]/10 text-[var(--color-signal-violet)] text-sm font-medium group-hover:bg-[var(--color-signal-violet)] group-hover:text-white transition-all duration-300">
                    <Zap className="w-4 h-4" />
                    <span>Start Chatting</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            </motion.div>

            {/* Quick Actions + Profile Row */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-4"
            >
              {/* Quick Actions */}
              <div className="lg:col-span-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[var(--color-signal-violet)]" /> Quick Actions
                  </h3>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { icon: Zap, label: "Quick Chat", onClick: () => handleStartChat("text") },
                    { icon: Users, label: "Friends", onClick: () => router.push("/friends") },
                    { icon: Bell, label: "Alerts", onClick: () => router.push("/notifications") },
                    { icon: Settings, label: "Settings", onClick: () => router.push("/settings") },
                    { icon: Crown, label: "Premium", onClick: () => router.push("/subscription") },
                    { icon: Shield, label: "Safety", onClick: () => router.push("/help") },
                  ].map((action) => (
                    <button
                      key={action.label}
                      onClick={action.onClick}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[var(--color-surface-2)]/50 hover:bg-[var(--color-surface-2)] border border-transparent hover:border-[var(--color-border)] transition-all active:scale-95 group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[var(--color-signal-violet)]/8 flex items-center justify-center group-hover:bg-[var(--color-signal-violet)]/15 transition-colors">
                        <action.icon className="w-4 h-4 text-[var(--color-signal-violet)]" />
                      </div>
                      <span className="text-[10px] font-medium text-[var(--color-text-secondary)]">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Profile Card */}
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--color-signal-violet)] to-purple-600 flex items-center justify-center text-white text-base font-bold shrink-0 shadow-lg shadow-[var(--color-signal-violet)]/20">
                    {(user?.displayName || "U")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-[var(--color-text-primary)] truncate">{user?.displayName || "User"}</h4>
                    <p className="text-[10px] text-[var(--color-text-secondary)]">@{(user as any)?.username || user?.userId?.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between p-2 rounded-lg bg-[var(--color-surface-2)]/50 text-xs">
                    <span className="text-[var(--color-text-secondary)]">Friends</span>
                    <span className="font-bold text-[var(--color-text-primary)]">{friends.length}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-[var(--color-surface-2)]/50 text-xs">
                    <span className="text-[var(--color-text-secondary)]">Status</span>
                    <span className="font-bold text-[var(--color-success)] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" /> Online</span>
                  </div>
                </div>
                <button
                  onClick={() => router.push("/profile")}
                  className="w-full mt-3 py-2 rounded-xl border border-[var(--color-border)] text-[10px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] transition-all"
                >
                  Edit Profile
                </button>
              </div>
            </motion.div>

            {/* Activity Section */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-[var(--color-signal-violet)]" />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Platform Activity</h3>
                <span className="ml-auto flex items-center gap-1.5 text-[10px] text-[var(--color-success)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
                  Live
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Users Online", value: platformStats.onlineUsers, icon: Users },
                  { label: "Searching", value: platformStats.searching, icon: Search },
                  { label: "Active Chats", value: platformStats.activeChats, icon: MessageCircle },
                  { label: "Messages Today", value: platformStats.messagesToday, icon: MessageSquare },
                ].map((stat) => (
                  <div key={stat.label} className="p-3 rounded-xl bg-[var(--color-surface-2)]/50 border border-[var(--color-border)]/50">
                    <div className="flex items-center gap-1.5 mb-1">
                      <stat.icon className="w-3 h-3 text-[var(--color-signal-violet)]" />
                      <span className="text-[10px] text-[var(--color-text-secondary)]">{stat.label}</span>
                    </div>
                    <p className="text-lg font-bold font-mono text-[var(--color-text-primary)]">{stat.value.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Upgrade CTA (only for free users) */}
            {!subscriptionActive && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="relative overflow-hidden rounded-2xl p-6 border border-[var(--color-signal-violet)]/20"
                style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(139,92,246,0.02) 100%)" }}
              >
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-[var(--color-signal-violet)]/5 -translate-y-1/2 translate-x-1/4 blur-2xl" />
                <div className="relative flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-1 flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-400" /> Upgrade to Premium
                    </h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">Unlock voice, video, and gender filters</p>
                  </div>
                  <button
                    onClick={() => router.push("/subscription")}
                    className="px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg shadow-[var(--color-signal-violet)]/20 hover:brightness-110 transition-all"
                    style={{ background: "linear-gradient(135deg, var(--brand), var(--color-primary-deep))" }}
                  >
                    View Plans
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      <PremiumModal
        open={premiumFeature !== null}
        onClose={() => setPremiumFeature(null)}
        featureName={premiumFeature || ""}
      />
    </AuthenticatedLayout>
  );
}
