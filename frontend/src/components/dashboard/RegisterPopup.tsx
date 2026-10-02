"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Check, AlertCircle, User, Lock, Sparkles } from "lucide-react";
import { useChatStore } from "../../store/chatStore";
import { useSocketActions } from "../../components/SocketProvider";

interface RegisterPopupProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RegisterPopup({ open, onClose, onSuccess }: RegisterPopupProps) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [usernameMessage, setUsernameMessage] = useState("");
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const setUser = useChatStore((s) => s.setUser);
  const setToken = useChatStore((s) => s.setToken);
  const socket = useChatStore((s) => s.socket);
  const { upgradeSocket } = useSocketActions();

  // Username availability check with debounce
  useEffect(() => {
    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    
    if (username.length < 3) {
      setUsernameStatus("idle");
      setUsernameMessage(username.length > 0 ? "Min 3 characters" : "");
      return;
    }

    setUsernameStatus("checking");
    setUsernameMessage("");

    checkTimeoutRef.current = setTimeout(async () => {
      try {
        const { getApiBase } = await import("../../lib/api");
        const res = await fetch(`${getApiBase()}/api/v1/auth/check-username/${encodeURIComponent(username)}`);
        const data = await res.json();
        if (data.available) {
          setUsernameStatus("available");
          setUsernameMessage("Username available!");
        } else {
          setUsernameStatus("taken");
          setUsernameMessage(data.reason || "Username is taken");
        }
      } catch {
        setUsernameStatus("idle");
        setUsernameMessage("");
      }
    }, 600);

    return () => { if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current); };
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (username.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (usernameStatus === "taken") {
      setError("Please choose a different username.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { getApiBase } = await import("../../lib/api");
      const token = sessionStorage.getItem("token");
      const res = await fetch(`${getApiBase()}/api/v1/auth/convert-guest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username, password, displayName: displayName || username }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed.");
        return;
      }

      setUser(data.user);
      upgradeSocket(data.token);
      sessionStorage.setItem('token', data.token);
      if (socket) {
        await new Promise<void>((resolve) => {
          const timer = setTimeout(() => { resolve(); }, 4000);
          socket.emit('auth:upgrade', { token: data.token }, (ack: any) => {
            clearTimeout(timer);
            resolve();
          });
        });
      }
      onSuccess();
      setToken(data.token);
    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const usernameInputBorder =
    usernameStatus === "available" ? "border-emerald-500/50 ring-2 ring-emerald-500/20" :
    usernameStatus === "taken" ? "border-red-500/50 ring-2 ring-red-500/20" :
    "border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-signal-violet)]/30 focus:border-[var(--color-signal-violet)]/50";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-7 w-full max-w-[380px] mx-4 shadow-2xl relative overflow-hidden"
          >
            {/* Decorative gradient */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--color-signal-violet)] via-purple-500 to-[var(--color-signal-violet)]" />

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--color-signal-violet)] to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--color-text-primary)]">Create Account</h3>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">Unlock all features</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--color-text-secondary)] mb-5 leading-relaxed">
              Set a username and password to access friends, notifications, profile, and more. Your current session will continue.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username field with availability check */}
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1.5 uppercase tracking-wider">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)] pointer-events-none" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="choose_username"
                    className={`w-full pl-10 pr-10 py-3 rounded-xl border bg-[var(--color-surface-2)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)]/50 outline-none text-sm transition-all ${usernameInputBorder}`}
                    autoFocus
                    autoComplete="off"
                  />
                  {/* Status indicator */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === "checking" && <Loader2 className="w-4 h-4 text-[var(--color-text-secondary)] animate-spin" />}
                    {usernameStatus === "available" && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 10 }}>
                        <Check className="w-4 h-4 text-emerald-400" />
                      </motion.div>
                    )}
                    {usernameStatus === "taken" && (
                      <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", damping: 10 }}>
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      </motion.div>
                    )}
                  </div>
                </div>
                {/* Status message */}
                <AnimatePresence mode="wait">
                  {usernameMessage && (
                    <motion.p
                      key={usernameMessage}
                      initial={{ opacity: 0, y: -5, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -5, height: 0 }}
                      className={`text-[11px] mt-1.5 font-medium ${
                        usernameStatus === "available" ? "text-emerald-400" :
                        usernameStatus === "taken" ? "text-red-400" :
                        "text-[var(--color-text-secondary)]"
                      }`}
                    >
                      {usernameStatus === "available" && "✓ "}
                      {usernameStatus === "taken" && "✗ "}
                      {usernameMessage}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1.5 uppercase tracking-wider">
                  Display Name
                </label>
                <div className="relative">
                  <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)] pointer-events-none" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="How others see you"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)]/50 outline-none text-sm focus:ring-2 focus:ring-[var(--color-signal-violet)]/30 focus:border-[var(--color-signal-violet)]/50 transition-all"
                  />
                </div>
                <p className="text-[10px] text-[var(--color-text-secondary)] mt-1">You can change this later</p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)] pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)]/50 outline-none text-sm focus:ring-2 focus:ring-[var(--color-signal-violet)]/30 focus:border-[var(--color-signal-violet)]/50 transition-all"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1.5 uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)] pointer-events-none" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-[var(--color-surface-2)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)]/50 outline-none text-sm transition-all ${
                      confirmPassword && confirmPassword !== password
                        ? "border-red-500/50 ring-2 ring-red-500/20"
                        : confirmPassword && confirmPassword === password
                          ? "border-emerald-500/50 ring-2 ring-emerald-500/20"
                          : "border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-signal-violet)]/30 focus:border-[var(--color-signal-violet)]/50"
                    }`}
                  />
                  {confirmPassword && confirmPassword === password && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                  )}
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                  >
                    <p className="text-xs text-red-400 font-medium flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || usernameStatus === "taken" || username.length < 3}
                className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:brightness-110 shadow-lg shadow-[var(--color-signal-violet)]/20"
                style={{ background: "linear-gradient(135deg, var(--brand), var(--color-primary-deep))" }}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Creating account..." : "Create Account & Continue"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
