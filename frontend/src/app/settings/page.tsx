"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useChatStore } from "../../store/chatStore";
import { motion } from "framer-motion";
import {
  Shield, Eye, Palette, Smartphone, Download, Trash2,
  Check, Lock, Save,
} from "lucide-react";
import { AuthenticatedLayout } from "../../components/AuthenticatedLayout";

const SETTINGS_TABS = [
  { id: "account", label: "Account", icon: Shield },
  { id: "privacy", label: "Privacy & Security", icon: Eye },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "sessions", label: "Sessions", icon: Smartphone },
  { id: "data", label: "Data & Export", icon: Download },
  { id: "danger", label: "Danger Zone", icon: Trash2 },
];

function ThemeCircle({ id, label, theme, onSelect }: { id: string; label: string; theme: string; onSelect: (id: string) => void }) {
  return (
    <button
      onClick={() => onSelect(id)}
      className={`w-10 h-10 rounded-full border-2 transition-all ${
        theme === id
          ? "border-[var(--color-signal-violet)] scale-110 shadow-[0_0_12px_-2px_var(--color-signal-violet)]"
          : "border-[var(--color-border)]"
      } ${
        id === "dark" ? "bg-[#0B1121]"
        : id === "light" ? "bg-[#F8FAFC]"
        : id === "midnight" ? "bg-[#020617]"
        : id === "ocean" ? "bg-[#042f2e]"
        : "bg-black"
      }`}
      title={label}
      aria-label={`Select ${label} theme`}
    />
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { token } = useChatStore();
  const [activeTab, setActiveTab] = useState("account");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);

  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [theme, setTheme] = useState("dark");
  const [discoverable, setDiscoverable] = useState(true);
  const [showLastSeen, setShowLastSeen] = useState(false);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [languagePref, setLanguagePref] = useState("en");
  const [sessions, setSessions] = useState<any[]>([]);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 3000);
  };

  useEffect(() => {
    if (!token) { router.push("/"); return; }
    const load = async () => {
      try {
        const [pData, sessData] = await Promise.all([
          apiFetch("/api/v1/profile/me").catch(() => null),
          apiFetch("/api/v1/profile/sessions").catch(() => null),
        ]);
        if (pData) {
          setTheme(pData.settings?.theme || "dark");
          setDiscoverable(pData.settings?.discoverable ?? true);
          setShowLastSeen(pData.settings?.showLastSeen ?? false);
          setShowOnlineStatus(pData.settings?.showOnlineStatus ?? true);
          setLanguagePref(pData.settings?.languagePref || "en");
        }
        if (sessData) setSessions(sessData.sessions || []);
      } catch {}
      setLoading(false);
    };
    load();
  }, [token, router]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showFeedback("Password must be 6+ characters.");
      return;
    }
    try {
      await apiFetch("/api/v1/profile/password", {
        method: "PUT",
        body: JSON.stringify({ currentPassword: password, newPassword }),
      });
      showFeedback("Password changed!");
      setPassword("");
      setNewPassword("");
    } catch {
      showFeedback("Failed to change password.");
    }
  };

  const handleSettingsSave = async () => {
    try {
      await apiFetch("/api/v1/profile/settings", {
        method: "PUT",
        body: JSON.stringify({ theme, discoverable, languagePref, showLastSeen, showOnlineStatus }),
      });
      showFeedback("Settings saved!");
    } catch {
      showFeedback("Failed to save settings.");
    }
  };

  const handleThemeSelect = (id: string) => {
    setTheme(id);
    // Apply immediately via store → ThemeProvider
    useChatStore.setState({ theme: id as 'dark' | 'light' });
    setTimeout(handleSettingsSave, 100);
  };

  const handleRevokeSession = async (id: string) => {
    try {
      await apiFetch(`/api/v1/profile/sessions/${id}`, { method: "DELETE" });
      setSessions(sessions.filter((s) => s.id !== id));
      showFeedback("Session revoked.");
    } catch {
      showFeedback("Failed to revoke session.");
    }
  };

  const handleExport = async () => {
    try {
      const data = await apiFetch("/api/v1/profile/export");
      const blob = new Blob([JSON.stringify(data.export || data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "anonlink-export.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showFeedback("Failed to export.");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Permanently delete your account? This cannot be undone.")) return;
    try {
      await apiFetch("/api/v1/profile/delete", { method: "DELETE" });
      sessionStorage.removeItem("token");
      router.push("/");
    } catch {
      showFeedback("Failed to delete account.");
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:border-[var(--color-signal-violet)]/50 outline-none transition-all text-sm";
  const labelClass = "block text-sm font-medium text-[var(--color-text-primary)] mb-1.5";
  const toggleClass = ""; // unused now

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
            <div className="w-5 h-5 border-2 border-[var(--color-border)] border-t-[var(--color-signal-violet)] rounded-full animate-spin" />
            Loading settings...
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout><div className="flex-1 flex flex-col overflow-hidden">
      <header className="app-header shrink-0 z-30 bg-[var(--color-surface)]/80 backdrop-blur-xl border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between px-4 sm:px-6 pl-[4.5rem] lg:pl-4" style={{ minHeight: '64px', paddingTop: '14px', paddingBottom: '14px' }}>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Settings</h1>
          </div>
          <button
            onClick={handleSettingsSave}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-signal-violet)] text-white text-sm font-medium hover:brightness-110 transition-all"
          >
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto">

      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-20 right-4 z-50 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 shadow-lg"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-signal-violet)]">
            <Check className="w-4 h-4" /> {feedback}
          </div>
        </motion.div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-48 shrink-0">
            <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
              {SETTINGS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all shrink-0 ${
                    activeTab === tab.id
                      ? "bg-[var(--color-signal-violet)]/10 text-[var(--color-signal-violet)]"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]"
                  } ${tab.id === "danger" ? "text-[var(--color-danger)] hover:text-[var(--color-danger)]" : ""}`}
                >
                  <tab.icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="flex-1 min-w-0">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === "account" && (
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8 space-y-6">
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Account Settings</h2>
                  <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Change Password</h3>
                    <div>
                      <label htmlFor="current-password" className={labelClass}>Current Password</label>
                      <input
                        id="current-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={inputClass}
                        placeholder="Enter current password"
                      />
                    </div>
                    <div>
                      <label htmlFor="new-password" className={labelClass}>New Password</label>
                      <input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={inputClass}
                        placeholder="Min 6 characters"
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-[var(--color-signal-violet)] text-white font-bold text-sm transition-all hover:brightness-110"
                    >
                      Update Password
                    </motion.button>
                  </form>
                </div>
              )}

              {activeTab === "privacy" && (
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8 space-y-6">
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Privacy & Security</h2>
                  <div className="space-y-4 max-w-md">
                    <label className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] cursor-pointer">
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">Discoverable</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">Allow others to find you</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={discoverable}
                        onChange={(e) => { setDiscoverable(e.target.checked); }}
                        className="sr-only peer"
                      />
                      <button
                        type="button"
                        onClick={() => { setDiscoverable(!discoverable); }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          discoverable ? "bg-[var(--color-signal-violet)]" : "bg-[var(--color-border)]"
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                          discoverable ? "translate-x-6" : "translate-x-1"
                        }`} />
                      </button>
                    </label>

                    <label className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] cursor-pointer">
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">Show Last Seen</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">Let friends see when you were last active</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={showLastSeen}
                        onChange={(e) => { setShowLastSeen(e.target.checked); }}
                        className="sr-only peer"
                      />
                      <button
                        type="button"
                        onClick={() => { setShowLastSeen(!showLastSeen); }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          showLastSeen ? "bg-[var(--color-signal-violet)]" : "bg-[var(--color-border)]"
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                          showLastSeen ? "translate-x-6" : "translate-x-1"
                        }`} />
                      </button>
                    </label>

                    <label className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] cursor-pointer">
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">Show Online Status</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">Display when you are online</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={showOnlineStatus}
                        onChange={(e) => { setShowOnlineStatus(e.target.checked); }}
                        className="sr-only peer"
                      />
                      <button
                        type="button"
                        onClick={() => { setShowOnlineStatus(!showOnlineStatus); }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          showOnlineStatus ? "bg-[var(--color-signal-violet)]" : "bg-[var(--color-border)]"
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                          showOnlineStatus ? "translate-x-6" : "translate-x-1"
                        }`} />
                      </button>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === "appearance" && (
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8 space-y-6">
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Appearance</h2>
                  <p className="text-sm text-[var(--color-text-secondary)]">Choose your preferred theme</p>
                  
                  <div className="grid grid-cols-2 gap-4 max-w-md">
                    {/* Dark Mode */}
                    <button
                      onClick={() => handleThemeSelect("dark")}
                      className={`relative p-4 rounded-xl border-2 transition-all ${
                        theme === "dark" 
                          ? "border-[var(--color-signal-violet)] shadow-[0_0_16px_-4px_var(--color-signal-violet)]" 
                          : "border-[var(--color-border)] hover:border-[var(--color-text-secondary)]"
                      }`}
                    >
                      <div className="w-full h-20 rounded-lg bg-[#0B1121] border border-[#2A2A3E] mb-3 flex items-end p-2 gap-1">
                        <div className="w-3/5 h-3 rounded bg-[#005c4b]" />
                        <div className="w-2/5 h-3 rounded bg-[#1f2c33]" />
                      </div>
                      <div className="flex items-center gap-2">
                        {theme === "dark" && <Check className="w-4 h-4 text-[var(--color-signal-violet)]" />}
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">Dark</span>
                      </div>
                    </button>

                    {/* Light Mode */}
                    <button
                      onClick={() => handleThemeSelect("light")}
                      className={`relative p-4 rounded-xl border-2 transition-all ${
                        theme === "light" 
                          ? "border-[var(--color-signal-violet)] shadow-[0_0_16px_-4px_var(--color-signal-violet)]" 
                          : "border-[var(--color-border)] hover:border-[var(--color-text-secondary)]"
                      }`}
                    >
                      <div className="w-full h-20 rounded-lg bg-[#ECE5DD] border border-[#E2E2EA] mb-3 flex items-end p-2 gap-1">
                        <div className="w-3/5 h-3 rounded bg-[#D9FDD3]" />
                        <div className="w-2/5 h-3 rounded bg-[#FFFFFF]" />
                      </div>
                      <div className="flex items-center gap-2">
                        {theme === "light" && <Check className="w-4 h-4 text-[var(--color-signal-violet)]" />}
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">Light</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "sessions" && (
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8 space-y-6">
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Active Sessions</h2>
                  {sessions.length === 0 ? (
                    <p className="text-sm text-[var(--color-text-secondary)]">No active sessions.</p>
                  ) : (
                    <div className="space-y-2 max-w-md">
                      {sessions.map((s: any) => (
                        <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-2)]">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                              {s.deviceHash?.slice(0, 16) || "Unknown device"}
                            </p>
                            <p className="text-xs text-[var(--color-text-secondary)]">
                              {new Date(s.connectedAt || s.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRevokeSession(s.id)}
                            className="px-3 py-1.5 rounded-lg bg-[var(--color-surface-2)] text-[var(--color-danger)] text-xs font-medium hover:bg-[var(--color-danger)]/10 transition-colors"
                          >
                            Revoke
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "data" && (
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8 space-y-6">
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Data & Export</h2>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Download a JSON export of your account data. No ads, no trackers — your data stays yours.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleExport}
                    className="px-6 py-2.5 rounded-xl bg-[var(--color-signal-violet)] text-white font-bold text-sm transition-all hover:brightness-110 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Export Data
                  </motion.button>
                </div>
              )}

              {activeTab === "danger" && (
                <div className="bg-[var(--color-surface)] border border-[var(--color-danger)]/20 rounded-2xl p-6 sm:p-8 space-y-6">
                  <h2 className="text-lg font-bold text-[var(--color-danger)]">Danger Zone</h2>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    This action is permanent and cannot be undone. All your data will be deleted.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDelete}
                    className="px-6 py-2.5 rounded-xl bg-[var(--color-danger)] text-white font-bold text-sm transition-all hover:brightness-110 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Delete My Account
                  </motion.button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div></div></AuthenticatedLayout>
  );
}
