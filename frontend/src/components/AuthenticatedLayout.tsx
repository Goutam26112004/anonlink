"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check, AlertCircle, AtSign } from "lucide-react";
import { Sidebar } from "./ui/Sidebar";
import { useChatStore } from "../store/chatStore";
import { apiFetch, getApiBase } from "@/lib/api";
import { IncomingCallOverlay } from "./chat/CallOverlay";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const router = useRouter();
  const { setToken, token, user, setUser } = useChatStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [usernameMsg, setUsernameMsg] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const checkRef = useRef<NodeJS.Timeout | null>(null);

  // Auth guard: redirect to landing page if not logged in
  useEffect(() => {
    if (!token) {
      router.replace("/");
    }
  }, [token, router]);

  // Restore user state from API if token exists but user is null (page refresh)
  useEffect(() => {
    if (token && !user) {
      apiFetch("/api/v1/profile/me").then((data) => {
        if (data) {
          setUser({
            userId: data.userId,
            username: data.username || null,
            email: data.email,
            registrationType: data.registrationType || 'EMAIL',
            userType: data.userType || 'FREE',
            onboardingComplete: !!data.onboardingComplete,
            displayName: data.displayName,
            avatarUrl: data.avatarUrl,
          } as any);
          // Only show username popup for Google/OAuth users who don't have a username yet
          if (!data.username && data.registrationType === 'OAUTH') {
            setShowUsernameModal(true);
          }
        }
      }).catch(() => {});
    }
  }, [token, user, setUser]);

  // Check if logged-in user needs username
  // Only show username popup for OAuth users confirmed to have no username (after profile loads)
  useEffect(() => {
    if (user && !user.username && user.registrationType && user.registrationType.toLowerCase() === 'oauth') {
      // Double-check: only show if profile has been loaded (user has email = profile was fetched)
      if (user.email) {
        setShowUsernameModal(true);
      }
    }
  }, [user]);

  // Username availability check
  useEffect(() => {
    if (checkRef.current) clearTimeout(checkRef.current);
    if (newUsername.length < 3) {
      setUsernameStatus("idle");
      setUsernameMsg(newUsername.length > 0 ? "Min 3 characters" : "");
      return;
    }
    setUsernameStatus("checking");
    setUsernameMsg("");
    checkRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${getApiBase()}/api/v1/auth/check-username/${encodeURIComponent(newUsername)}`);
        const data = await res.json();
        setUsernameStatus(data.available ? "available" : "taken");
        setUsernameMsg(data.available ? "Username available!" : "Username is taken");
      } catch {
        setUsernameStatus("idle");
      }
    }, 600);
    return () => { if (checkRef.current) clearTimeout(checkRef.current); };
  }, [newUsername]);

  const handleSetUsername = async () => {
    if (newUsername.length < 3 || usernameStatus === "taken") return;
    setSavingUsername(true);
    setUsernameError("");
    try {
      const res = await fetch(`${getApiBase()}/api/v1/profile/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: newUsername }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUsernameError(data.error || "Failed to set username");
        return;
      }
      // Update user in store
      if (user) {
        setUser({ ...user, username: newUsername } as any);
      }
      setShowUsernameModal(false);
    } catch (e: any) {
      setUsernameError(e.message || "Network error");
    } finally {
      setSavingUsername(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch("/api/v1/auth/logout", { method: "POST" }).catch(() => {});
    } catch {}
    setToken(null);
    setUser(null);
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("activeChat");
    // Reset per-account state so a stale session (e.g. a previous PRO
    // account) never bleeds into the next login in the same tab.
    useChatStore.setState({
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
    router.push("/");
  };

  // Don't render anything while checking auth / redirecting
  if (!token) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-void)]">
        <div className="w-5 h-5 border-2 border-[var(--color-signal-violet)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-dvh bg-[var(--color-void)] overflow-hidden" style={{ height: '100dvh' }}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </div>
      <IncomingCallOverlay />

      {/* Username Required Modal */}
      <AnimatePresence>
        {showUsernameModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-7 w-full max-w-[380px] mx-4 shadow-2xl"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--color-signal-violet)] via-purple-500 to-[var(--color-signal-violet)] rounded-t-3xl" />
              
              <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Choose a Username</h3>
              <p className="text-xs text-[var(--color-text-secondary)] mb-5 leading-relaxed">
                Your username is unique and permanent. Others can find and add you by it.
              </p>

              <div className="space-y-4">
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)] pointer-events-none" />
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="choose_username"
                    className={`w-full pl-10 pr-10 py-3 rounded-xl border bg-[var(--color-surface-2)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)]/50 outline-none text-sm transition-all ${
                      usernameStatus === "available" ? "border-emerald-500/50 ring-2 ring-emerald-500/20" :
                      usernameStatus === "taken" ? "border-red-500/50 ring-2 ring-red-500/20" :
                      "border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-signal-violet)]/30"
                    }`}
                    autoFocus
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === "checking" && <Loader2 className="w-4 h-4 text-[var(--color-text-secondary)] animate-spin" />}
                    {usernameStatus === "available" && <Check className="w-4 h-4 text-emerald-400" />}
                    {usernameStatus === "taken" && <AlertCircle className="w-4 h-4 text-red-400" />}
                  </div>
                </div>

                {usernameMsg && (
                  <p className={`text-[11px] -mt-2 font-medium ${
                    usernameStatus === "available" ? "text-emerald-400" :
                    usernameStatus === "taken" ? "text-red-400" :
                    "text-[var(--color-text-secondary)]"
                  }`}>
                    {usernameMsg}
                  </p>
                )}

                {usernameError && (
                  <p className="text-[11px] text-red-400 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {usernameError}
                  </p>
                )}

                <button
                  onClick={handleSetUsername}
                  disabled={savingUsername || usernameStatus !== "available"}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:brightness-110 shadow-lg shadow-[var(--color-signal-violet)]/20"
                  style={{ background: "linear-gradient(135deg, var(--brand), var(--color-primary-deep))" }}
                >
                  {savingUsername && <Loader2 className="w-4 h-4 animate-spin" />}
                  {savingUsername ? "Saving..." : "Set Username"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
