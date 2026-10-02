"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Lock, Loader2, CheckCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { AnimatedLogo } from "@/components/AnimatedLogo";

function ForgotPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token");

  const [step, setStep] = useState<"email" | "token" | "done">(tokenParam ? "token" : "email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState(tokenParam || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch("/api/v1/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      if (data.token) {
        setToken(data.token);
        setStep("token");
      } else {
        setMessage("If that email is registered, a reset link has been sent.");
        setStep("done");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/api/v1/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setStep("done");
      setMessage("Password updated successfully! Redirecting to sign in...");
      setTimeout(() => router.push("/auth"), 2500);
    } catch (err: any) {
      setError(err.message || "Reset failed. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "var(--bg-primary)" }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, rgba(139, 92, 246, 0.03) 0%, transparent 70%)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div
          className="rounded-2xl p-8 sm:p-10"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          <button
            onClick={() => router.push("/auth")}
            className="flex items-center gap-1.5 text-xs mb-6 cursor-pointer transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => { router.prefetch("/auth"); e.currentTarget.style.color = "var(--color-text-primary)"; }}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </button>

          <div className="flex justify-center mb-5">
            <AnimatedLogo size={36} showText={false} />
          </div>

          {step === "email" && (
            <>
              <h1 className="text-xl font-bold mb-2 text-center" style={{ color: "var(--color-text-primary)" }}>
                Reset Password
              </h1>
              <p className="text-sm mb-6 text-center" style={{ color: "var(--color-text-secondary)" }}>
                Enter your email and we&apos;ll send you a reset link.
              </p>
              <form onSubmit={handleSendEmail} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    required
                    className="auth-input pl-10"
                  />
                </div>
                {error && (
                  <div
                    className="p-3 rounded-xl text-xs"
                    style={{
                      backgroundColor: "var(--danger-subtle)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      color: "var(--danger)",
                    }}
                  >
                    {error}
                  </div>
                )}
                <button type="submit" disabled={loading} className="auth-btn-primary">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : "Send Reset Link"}
                </button>
              </form>
            </>
          )}

          {step === "token" && (
            <>
              <h1 className="text-xl font-bold mb-2 text-center" style={{ color: "var(--color-text-primary)" }}>
                Set New Password
              </h1>
              <p className="text-sm mb-6 text-center" style={{ color: "var(--color-text-secondary)" }}>
                Enter your new password below.
              </p>
              <form onSubmit={handleReset} className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New password (min 6 chars)"
                    required
                    minLength={6}
                    className="auth-input pl-10"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                    className="auth-input pl-10"
                  />
                </div>
                {error && (
                  <div
                    className="p-3 rounded-xl text-xs"
                    style={{
                      backgroundColor: "var(--danger-subtle)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      color: "var(--danger)",
                    }}
                  >
                    {error}
                  </div>
                )}
                <button type="submit" disabled={loading} className="auth-btn-primary">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Resetting...</> : "Reset Password"}
                </button>
              </form>
            </>
          )}

          {step === "done" && (
            <div className="text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: "var(--success-subtle)" }}
              >
                <CheckCircle className="w-7 h-7" style={{ color: "var(--success)" }} />
              </div>
              <h1 className="text-xl font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>
                All set!
              </h1>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{message}</p>
              {!message.includes("Redirecting") && (
                <button
                  onMouseEnter={() => router.prefetch("/auth")}
                  onClick={() => router.push("/auth")}
                  className="mt-6 text-sm font-medium hover:underline cursor-pointer"
                  style={{ color: "var(--brand)" }}
                >
                  Back to Sign In
                </button>
              )}
            </div>
          )}
        </div>

        <p
          className="text-center text-xs mt-6 flex items-center justify-center gap-1.5"
          style={{ color: "var(--text-muted)" }}
        >
          AnonLink — Anonymous, Safe, Private
        </p>
      </motion.div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-primary)" }}>
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--brand)" }} />
        </div>
      }
    >
      <ForgotPasswordInner />
    </Suspense>
  );
}
