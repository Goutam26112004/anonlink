"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getApiBase } from "@/lib/api";
import { useChatStore } from "../../store/chatStore";
import { motion } from "framer-motion";
import {
  Crown, Sparkles, Users, Save, Check, User, Camera,
} from "lucide-react";
import { AnonAvatar } from "../../components/ui/AnonAvatar";
import { AuthenticatedLayout } from "../../components/AuthenticatedLayout";

export default function ProfilePage() {
  const router = useRouter();
  const { token } = useChatStore();
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [stats, setStats] = useState<any>({});
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 3000);
  };

  useEffect(() => {
    if (!token) { router.push("/"); return; }
    const load = async () => {
      setLoading(true);
      try {
        const pData = await apiFetch("/api/v1/profile/me").catch(() => null);
        if (pData) {
          setUserProfile(pData);
          setDisplayName(pData.displayName || "");
          setBio(pData.bio || "");
          setAvatarUrl(pData.avatarUrl || null);
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, [token, router]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const token = sessionStorage.getItem('token');
      const { getApiBase } = await import('@/lib/api');
      const res = await fetch(`${getApiBase()}/api/v1/profile/avatar`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setAvatarUrl(`${data.avatarUrl}?t=${Date.now()}`);
      showFeedback("Profile picture updated!");
    } catch {
      showFeedback("Failed to upload picture.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/api/v1/profile/update", {
        method: "PUT",
        body: JSON.stringify({ displayName, bio }),
      });
      showFeedback("Profile updated!");
    } catch {
      showFeedback("Failed to update.");
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:border-[var(--color-signal-violet)]/50 outline-none transition-all text-sm";
  const labelClass = "block text-sm font-medium text-[var(--color-text-primary)] mb-1.5";

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
            <div className="w-5 h-5 border-2 border-[var(--color-border)] border-t-[var(--color-signal-violet)] rounded-full animate-spin" />
            Loading profile...
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  const initials = (displayName || userProfile?.displayName || "U")[0].toUpperCase();

  return (
    <AuthenticatedLayout><div className="flex-1 flex flex-col overflow-hidden">
      <header className="app-header shrink-0 z-30 bg-[var(--color-surface)]/80 backdrop-blur-xl border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between px-4 sm:px-6 pl-[4.5rem] lg:pl-4" style={{ minHeight: '64px', paddingTop: '14px', paddingBottom: '14px' }}>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Profile</h1>
          </div>
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

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8 mb-6 relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="relative group">
              {avatarUrl ? (
                <img src={avatarUrl.startsWith('http') ? avatarUrl : `${getApiBase()}${avatarUrl}`} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-[var(--color-border)]" crossOrigin="anonymous" />
              ) : (
                <AnonAvatar sessionId={userProfile?.userId || "anon"} size={80} />
              )}
              {userProfile?.registrationType !== 'GUEST' && (
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="w-5 h-5 text-white" />
                </button>
              )}
              <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div className="text-center sm:text-left flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
                {displayName || "User"}
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {userProfile?.email || ""}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] text-xs font-medium">
                  <Users className="w-3 h-3" /> {stats?.friendCount || 0} Friends
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8"
        >
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-6">Personal Info</h2>
          <form onSubmit={handleUpdate} className="space-y-4 max-w-md">
            <div>
              <label htmlFor="display-name" className={labelClass}>Display Name</label>
              <input
                id="display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={inputClass}
                placeholder="Your display name"
              />
            </div>
            <div>
              <label htmlFor="bio" className={labelClass}>Bio</label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className={`${inputClass} resize-none h-24`}
                placeholder="Tell others about yourself..."
              />
            </div>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--color-signal-violet)] text-white font-bold text-sm transition-all hover:brightness-110"
              >
                <Save className="w-4 h-4" /> Save Changes
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div></div></AuthenticatedLayout>
  );
}
