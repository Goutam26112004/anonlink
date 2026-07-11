"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { UserCheck, Sparkles, Shield, Lock, Eye } from "lucide-react";
import { useChatStore } from "../../store/chatStore";
import { AnimatedLogo } from "../../components/AnimatedLogo";
import { HeroScene } from "../../components/illustrations/HeroScene";
import { PrivacyShield } from "../../components/illustrations/PrivacyShield";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

const trustItems = [
  { icon: Lock, text: "End-to-end encrypted" },
  { icon: Eye, text: "No personal data stored" },
  { icon: Shield, text: "Report & block tools" },
];

export default function AuthPage() {
  const router = useRouter();
  const { setToken, setUser } = useChatStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleGuestLogin = async () => {
    setLoading("guest");
    setError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/auth/guest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Guest login failed");
      setToken(data.token);
      setUser(data.user);
      router.push("/onboarding");
    } catch (err: any) {
      setError(err.message || "Connection error.");
      setLoading(null);
    }
  };

  const handleGoogleAuth = () => {
    setLoading("google");
    window.location.href = `${BACKEND_URL}/api/v1/auth/google`;
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center overflow-hidden relative">
      <HeroScene />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md mx-auto p-6"
      >
        <div className="glass-heavy rounded-3xl p-8 sm:p-10 shadow-[var(--shadow-xl)] border border-[var(--border-secondary)] text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex justify-center mb-6"
          >
            <AnimatedLogo size={48} showText={false} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="heading-display text-2xl mb-2"
          >
            Welcome to AnonLink
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="text-sm text-[var(--text-secondary)] mb-8 leading-relaxed"
          >
            Real conversations start here. No signup forms, no personal details — just genuine human connection.
          </motion.p>

          <div className="space-y-3">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              onClick={handleGoogleAuth}
              disabled={loading !== null}
              className="w-full py-3 rounded-xl border border-[var(--border-secondary)] text-[var(--text-primary)] font-semibold text-sm transition-all flex items-center justify-center gap-3 cursor-pointer hover:bg-[var(--bg-tertiary)] disabled:opacity-50 active:scale-[0.98]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {loading === "google" ? "Redirecting..." : "Continue with Google"}
            </motion.button>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border-primary)]" />
              </div>
              <span className="relative px-3 text-xs font-bold bg-[var(--bg-card)] backdrop-blur-xl text-[var(--text-muted)]">
                OR
              </span>
            </div>

            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              onClick={handleGuestLogin}
              disabled={loading !== null}
              className="w-full py-3 rounded-xl border border-[var(--border-secondary)] text-[var(--text-primary)] font-semibold text-sm transition-all flex items-center justify-center gap-3 cursor-pointer hover:bg-[var(--bg-tertiary)] disabled:opacity-50 active:scale-[0.98]"
            >
              <UserCheck className="w-5 h-5 text-[var(--text-secondary)]" />
              {loading === "guest" ? "Starting..." : "Continue as Guest"}
            </motion.button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-xl bg-[var(--danger-subtle)] border border-[var(--danger)]/20 text-[var(--danger)] text-xs font-medium"
            >
              {error}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            className="mt-8 pt-6 border-t border-[var(--border-primary)]"
          >
            <div className="flex items-center justify-center gap-6 text-xs text-[var(--text-muted)]">
              {trustItems.map((item) => (
                <span key={item.text} className="flex items-center gap-1.5">
                  <item.icon className="w-3.5 h-3.5" />
                  {item.text}
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.4 }}
          className="text-center text-xs text-[var(--text-muted)] mt-6"
        >
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </motion.p>
      </motion.div>
    </div>
  );
}
