"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Lock, Eye, Loader2, ChevronDown, LogIn, UserPlus, Mail, Lock as LockIcon, User, AtSign } from "lucide-react";
import { apiFetch, getApiBase } from "@/lib/api";
import { useChatStore } from "@/store/chatStore";
import { AnimatedLogo } from "@/components/AnimatedLogo";
import Turnstile from "@/components/Turnstile";

const trustItems = [
  { icon: Shield, text: "End-to-End Encrypted" },
  { icon: Lock, text: "No Data Stored" },
  { icon: Eye, text: "Anonymous by Default" },
] as const;

const loadingSteps = [
  "Negotiating E2E Encryption...",
  "Generating 256-bit Key...",
  "Securing Tunnel...",
];

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const particles: { x: number; y: number; vx: number; vy: number; r: number }[] = [];
    const count = 30;
    const connectionDist = 100;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        r: Math.random() * 1 + 0.3,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(139, 92, 246, 0.12)";
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDist) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${(1 - dist / connectionDist) * 0.05})`;
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
}

type AuthPanel = "login" | "register" | null;

export default function AuthPage() {
  const router = useRouter();
  const { setToken, setUser } = useChatStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState("");
  const [openPanel, setOpenPanel] = useState<AuthPanel>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRemember, setLoginRemember] = useState(false);

  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regDisplayName, setRegDisplayName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regUsernameStatus, setRegUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [regUsernameMsg, setRegUsernameMsg] = useState("");
  const regCheckRef = useRef<NodeJS.Timeout | null>(null);
  const [captchaToken, setCaptchaToken] = useState("");

  useEffect(() => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("activeChat");
    // Reset per-account state so a stale session (e.g. a previous PRO
    // account in this tab) never bleeds into whoever logs in next.
    useChatStore.setState({
      token: null,
      user: null,
      subscriptionActive: false,
      subscriptionPlan: null,
      canVoice: false,
      canVideo: false,
      canGenderFilter: false,
      friends: [],
      friendRequests: [],
      notifications: [],
      privateChatRooms: [],
      privateMessages: {},
      onboardingComplete: false,
    });
  }, [setToken]);

  useEffect(() => {
    apiFetch("/api/v1/auth/session", { skipAuth: true })
      .then((data) => {
        if (data?.token && data?.user) {
          router.push("/dashboard");
        }
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    if (regCheckRef.current) clearTimeout(regCheckRef.current);
    if (regUsername.length < 3) {
      setRegUsernameStatus("idle");
      setRegUsernameMsg(regUsername.length > 0 ? "Min 3 characters" : "");
      return;
    }
    setRegUsernameStatus("checking");
    setRegUsernameMsg("");
    regCheckRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${getApiBase()}/api/v1/auth/check-username/${encodeURIComponent(regUsername)}`);
        const data = await res.json();
        if (data.available) {
          setRegUsernameStatus("available");
          setRegUsernameMsg("Username available!");
        } else {
          setRegUsernameStatus("taken");
          setRegUsernameMsg("Username is taken");
        }
      } catch {
        setRegUsernameStatus("idle");
        setRegUsernameMsg("");
      }
    }, 600);
    return () => { if (regCheckRef.current) clearTimeout(regCheckRef.current); };
  }, [regUsername]);

  const handlePhantomSession = useCallback(async () => {
    if (loading) return;
    setLoading("phantom");
    setError("");

    for (let i = 0; i < loadingSteps.length; i++) {
      setLoadingStep(i);
      await new Promise((r) => setTimeout(r, 800));
    }

    try {
      const data = await apiFetch("/api/v1/auth/guest", { method: "POST" });
      setToken(data.token);
      setUser(data.user);
      router.push("/onboarding");
    } catch (err: any) {
      setError(err.message || "Connection error.");
      setLoading(null);
    }
  }, [loading, router, setToken, setUser]);

  const handleGoogleAuth = useCallback(() => {
    setLoading("google");
    window.location.href = `${getApiBase()}/api/v1/auth/google`;
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading("login");

    try {
      const isEmail = loginEmail.includes('@');
      const data = await apiFetch("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(isEmail ? { email: loginEmail, password: loginPassword } : { username: loginEmail, password: loginPassword }),
      });
      setToken(data.token);
      setUser(data.user);
      router.push(data.user?.onboardingComplete === false ? "/onboarding" : "/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(null);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (regPassword !== regConfirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!captchaToken) {
      setError("Please complete the verification.");
      return;
    }

    setLoading("register");

    try {
      const data = await apiFetch("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: regEmail,
          password: regPassword,
          captchaToken,
          fullName: regDisplayName,
          displayName: regDisplayName,
          username: regUsername,
          ageRange: "AGE_25_34",
          gender: "PREFER_NOT_TO_SAY",
        }),
      });
      setToken(data.token);
      setUser(data.user);
      router.push(data.user?.onboardingComplete === false ? "/onboarding" : "/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(null);
    }
  };

  const togglePanel = (panel: AuthPanel) => {
    setOpenPanel(openPanel === panel ? null : panel);
    setError("");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden p-4" style={{ backgroundColor: "var(--bg-primary)" }}>
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, rgba(139, 92, 246, 0.04) 0%, transparent 70%)",
        }}
      />

      <ParticleField />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
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
            className="text-2xl font-bold mb-2 text-center"
            style={{ color: "var(--color-text-primary)" }}
          >
            Connect Anonymously.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="text-sm mb-8 leading-relaxed text-center"
            style={{ color: "var(--color-text-secondary)" }}
          >
            No sign-ups, no tracking. Just instant, private conversations.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            onClick={handlePhantomSession}
            disabled={loading !== null}
            className="relative w-full py-4 px-6 rounded-xl font-semibold text-sm tracking-wide transition-all duration-300 cursor-pointer disabled:cursor-not-allowed overflow-hidden border-none"
            style={{
              background: "linear-gradient(135deg, var(--brand), var(--color-primary-deep))",
              color: "#fff",
            }}
          >
            {loading === "phantom" ? (
              <span className="flex items-center justify-center gap-3 relative z-10">
                <Loader2 className="w-4 h-4 animate-spin" color="rgba(255,255,255,0.7)" />
                <span className="font-mono text-xs tracking-wider" style={{ color: "rgba(255,255,255,0.7)" }}>
                  {loadingSteps[loadingStep]}
                </span>
              </span>
            ) : (
              <span className="relative z-10 block text-center">Generate Phantom Session</span>
            )}
          </motion.button>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: "var(--color-border)" }} />
            </div>
            <span
              className="relative px-3 text-xs font-bold select-none"
              style={{
                color: "var(--text-muted)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              OR
            </span>
          </div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            onClick={handleGoogleAuth}
            disabled={loading !== null}
            className="w-full py-3.5 px-6 rounded-xl font-medium text-sm transition-all duration-300 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-3"
            style={{
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-surface-2)",
              color: "var(--color-text-primary)",
            }}
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>{loading === "google" ? "Redirecting..." : "Continue with Google"}</span>
          </motion.button>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: "var(--color-border)" }} />
            </div>
            <span
              className="relative px-3 text-xs font-mono select-none"
              style={{
                color: "var(--text-muted)",
                backgroundColor: "var(--color-surface)",
              }}
            >
              alternative
            </span>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => togglePanel("login")}
              className="w-full py-3.5 px-5 rounded-xl text-sm font-semibold tracking-wide flex items-center gap-2.5 cursor-pointer transition-all duration-200 hover:bg-[var(--color-surface-2)] hover:border-[var(--brand)]/30"
              style={{
                border: "1px solid var(--color-border)",
                backgroundColor: "transparent",
                color: "var(--color-text-primary)",
              }}
            >
              <LogIn className="w-4 h-4" style={{ color: "var(--brand)" }} />
              <span className="flex-1 text-left">Sign In</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${openPanel === "login" ? "rotate-180" : ""}`}
                style={{ color: "var(--text-muted)" }}
              />
            </button>

            <AnimatePresence>
              {openPanel === "login" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <form onSubmit={handleLogin} className="space-y-3 pt-1">
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-muted)" }} />
                      <input
                        type="text"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="Username or email"
                        required
                        className="auth-input"
                      />
                    </div>
                    <div className="relative">
                      <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-muted)" }} />
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Password"
                        required
                        className="auth-input"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={loginRemember}
                          onChange={(e) => setLoginRemember(e.target.checked)}
                          className="w-3.5 h-3.5 rounded"
                          style={{ accentColor: "var(--brand)" }}
                        />
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          Remember me
                        </span>
                      </label>
                      <button
                        type="button"
                        onMouseEnter={() => router.prefetch("/auth/forgot-password")}
                        onClick={() => router.push("/auth/forgot-password")}
                        className="text-xs font-medium hover:underline cursor-pointer"
                        style={{ color: "var(--brand)" }}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={loading === "login"}
                      className="auth-btn-primary"
                    >
                      {loading === "login" ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                      ) : (
                        <><LogIn className="w-4 h-4" /> Sign In</>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => togglePanel("register")}
              className="w-full py-3.5 px-5 rounded-xl text-sm font-semibold tracking-wide flex items-center gap-2.5 cursor-pointer transition-all duration-200 hover:bg-[var(--color-surface-2)] hover:border-[var(--brand)]/30"
              style={{
                border: "1px solid var(--color-border)",
                backgroundColor: "transparent",
                color: "var(--color-text-primary)",
              }}
            >
              <UserPlus className="w-4 h-4" style={{ color: "var(--brand)" }} />
              <span className="flex-1 text-left">Create Account</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${openPanel === "register" ? "rotate-180" : ""}`}
                style={{ color: "var(--text-muted)" }}
              />
            </button>

            <AnimatePresence>
              {openPanel === "register" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <form onSubmit={handleRegister} className="space-y-3 pt-1">
                    <div className="relative">
                      <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-muted)" }} />
                      <input
                        type="text"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        placeholder="Username (unique, permanent)"
                        required
                        minLength={3}
                        className="auth-input"
                        style={{
                          borderColor: regUsernameStatus === "available" ? "rgba(52,211,153,0.5)" : regUsernameStatus === "taken" ? "rgba(239,68,68,0.5)" : undefined,
                          boxShadow: regUsernameStatus === "available" ? "0 0 0 2px rgba(52,211,153,0.15)" : regUsernameStatus === "taken" ? "0 0 0 2px rgba(239,68,68,0.15)" : undefined,
                        }}
                      />
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                        {regUsernameStatus === "checking" && <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--text-muted)" }} />}
                        {regUsernameStatus === "available" && <span style={{ color: "#34D399", fontSize: "14px" }}>✓</span>}
                        {regUsernameStatus === "taken" && <span style={{ color: "#EF4444", fontSize: "14px" }}>✗</span>}
                      </div>
                    </div>
                    {regUsernameMsg && (
                      <p style={{ fontSize: "11px", marginTop: "-8px", color: regUsernameStatus === "available" ? "#34D399" : regUsernameStatus === "taken" ? "#EF4444" : "var(--text-muted)" }}>
                        {regUsernameMsg}
                      </p>
                    )}
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-muted)" }} />
                      <input
                        type="text"
                        value={regDisplayName}
                        onChange={(e) => setRegDisplayName(e.target.value)}
                        placeholder="Display Name"
                        required
                        className="auth-input"
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-muted)" }} />
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="Email"
                        required
                        className="auth-input"
                      />
                    </div>
                    <div className="relative">
                      <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-muted)" }} />
                      <input
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Password (min 6 chars)"
                        required
                        minLength={6}
                        className="auth-input"
                      />
                    </div>
                    <div className="relative">
                      <LockIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-muted)" }} />
                      <input
                        type="password"
                        value={regConfirm}
                        onChange={(e) => setRegConfirm(e.target.value)}
                        placeholder="Confirm Password"
                        required
                        minLength={6}
                        className="auth-input"
                      />
                    </div>
                    <Turnstile onVerify={(token) => setCaptchaToken(token)} onExpire={() => setCaptchaToken("")} />
                    <button
                      type="submit"
                      disabled={loading === "register" || !captchaToken || regUsernameStatus === "taken" || regUsername.length < 3}
                      className="auth-btn-primary"
                    >
                      {loading === "register" ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
                      ) : (
                        <><UserPlus className="w-4 h-4" /> Create Account</>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="mt-4 p-3 rounded-xl text-xs font-medium"
                style={{
                  backgroundColor: "var(--danger-subtle)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  color: "var(--danger)",
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            className="mt-8 pt-6 text-center"
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-xs" style={{ color: "var(--text-muted)" }}>
              {trustItems.map((item) => (
                <span key={item.text} className="flex items-center gap-1.5 select-none">
                  <item.icon className="w-3 h-3" style={{ color: "var(--color-success)" }} />
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
          className="text-center text-xs mt-6"
          style={{ color: "var(--text-muted)" }}
        >
          By connecting, you agree to our{" "}
          <a href="/terms" style={{ color: "var(--brand)" }}>Terms of Service</a>{" "}
          &{" "}
          <a href="/privacy" style={{ color: "var(--brand)" }}>Privacy Policy</a>.
        </motion.p>
      </motion.div>
    </div>
  );
}
