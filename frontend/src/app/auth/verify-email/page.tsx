"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { AnimatedLogo } from "@/components/AnimatedLogo";

function VerifyEmailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    apiFetch("/api/v1/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
      skipAuth: true,
    })
      .then(() => {
        setStatus("success");
        setMessage("Email verified successfully! Redirecting to dashboard...");
        setTimeout(() => router.push("/dashboard"), 2500);
      })
      .catch((err: any) => {
        setStatus("error");
        setMessage(err.message || "Verification failed. The link may have expired.");
      });
  }, [token, router]);

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
          className="rounded-2xl p-8 sm:p-10 text-center"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          <div className="flex justify-center mb-5">
            <AnimatedLogo size={36} showText={false} />
          </div>

          {status === "loading" && (
            <>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: "var(--brand-subtle)" }}
              >
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: "var(--brand)" }} />
              </div>
              <h1 className="text-xl font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>
                Verifying your email...
              </h1>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Please wait a moment.</p>
            </>
          )}

          {status === "success" && (
            <>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: "var(--success-subtle)" }}
              >
                <CheckCircle className="w-7 h-7" style={{ color: "var(--success)" }} />
              </div>
              <h1 className="text-xl font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>
                Email Verified!
              </h1>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{message}</p>
            </>
          )}

          {status === "error" && (
            <>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: "var(--danger-subtle)" }}
              >
                <XCircle className="w-7 h-7" style={{ color: "var(--danger)" }} />
              </div>
              <h1 className="text-xl font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>
                Verification failed
              </h1>
              <p className="text-sm mb-6" style={{ color: "var(--color-text-secondary)" }}>{message}</p>
              <button
                onMouseEnter={() => router.prefetch("/auth")}
                onClick={() => router.push("/auth")}
                className="text-sm font-medium hover:underline cursor-pointer"
                style={{ color: "var(--brand)" }}
              >
                Back to Sign In
              </button>
            </>
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

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-primary)" }}>
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--brand)" }} />
        </div>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
