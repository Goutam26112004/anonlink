"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '../../store/chatStore';
import {
  User, Award, Settings as SettingsIcon, Shield, Bell, Key, Download, Trash2,
  Crown, LogOut, ArrowLeft, Palette, Eye, Activity,
  Users, Ban, FileText, Check, Smartphone, Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PrivacyShield } from '../../components/illustrations/PrivacyShield';
import { SkeletonPage, SkeletonCard, SkeletonText, SkeletonAvatar, SkeletonButton } from '../../components/Skeleton';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

function ThemeCircle({ id, label, theme, onSelect }: { id: string; label: string; theme: string; onSelect: (id: string) => void }) {
  return (
    <button onClick={() => onSelect(id)}
      className={`w-10 h-10 rounded-full border-2 transition-all ${theme === id ? 'border-[var(--brand)] scale-110 shadow-[var(--shadow-glow)]' : 'border-[var(--border-primary)]'} ${id === 'dark' ? 'bg-[#0B1121]' : id === 'light' ? 'bg-[#F8FAFC]' : id === 'midnight' ? 'bg-[#020617]' : id === 'ocean' ? 'bg-[#042f2e]' : 'bg-black'}`} title={label} />
  );
}

const TABS = [
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'account', label: 'Account', icon: Shield },
  { id: 'subscription', label: 'Subscription', icon: Crown },
  { id: 'friends', label: 'Friends', icon: Users },
  { id: 'privacy', label: 'Privacy & Security', icon: Eye },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'sessions', label: 'Sessions', icon: Smartphone },
  { id: 'achievements', label: 'Achievements', icon: Award },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'blocked', label: 'Blocked Users', icon: Ban },
  { id: 'data', label: 'Download Data', icon: FileText },
  { id: 'danger', label: 'Delete Account', icon: Trash2 },
];

export default function ProfilePage() {
  const router = useRouter();
  const { token } = useChatStore();
  const [activeTab, setActiveTab] = useState('personal');
  const [feedback, setFeedback] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [achievements, setAchievements] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);

  const [theme, setTheme] = useState('dark');
  const [discoverable, setDiscoverable] = useState(true);
  const [loading, setLoading] = useState(true);

  const showFeedback = (msg: string) => { setFeedback(msg); setTimeout(() => setFeedback(''), 3000); };

  const loadData = async () => {
    setLoading(true);
    try {
      const [profileRes, statsRes, achRes, sessionsRes, notifRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/v1/profile/me`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/api/v1/gamification/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/api/v1/gamification/achievements`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/api/v1/profile/sessions`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/api/v1/profile/notifications`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (profileRes.ok) {
        const d = await profileRes.json();
        setUserProfile(d);
        setDisplayName(d.displayName || '');
        setBio(d.bio || '');
        setTheme(d.settings?.theme || 'dark');
        setDiscoverable(d.settings?.discoverable ?? true);
      }
      if (statsRes.ok) { const d = await statsRes.json(); setStats(d.stats || d); }
      if (achRes.ok) { const d = await achRes.json(); setAchievements(d.achievements || []); setBadges(d.badges || []); }
      if (sessionsRes.ok) { const d = await sessionsRes.json(); setSessions(d.sessions || []); }
      if (notifRes.ok) { const d = await notifRes.json(); setNotificationsList(d.notifications || []); }
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { if (!token) { router.push('/'); } else { loadData(); } }, [token, router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/profile/update`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ displayName, bio }),
      });
      if (res.ok) { showFeedback('Profile updated!'); loadData(); } else showFeedback((await res.json()).error || 'Failed.');
    } catch { showFeedback('Failed to update.'); }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { showFeedback('Password must be 6+ characters.'); return; }
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/profile/password`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: password, newPassword }),
      });
      const data = await res.json();
      if (res.ok) { showFeedback('Password changed!'); setPassword(''); setNewPassword(''); } else showFeedback(data.error || 'Failed.');
    } catch { showFeedback('Failed.'); }
  };

  const handleSettingsSave = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/profile/settings`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ theme, discoverable, languagePref: 'en', showLastSeen: true, showOnlineStatus: true }),
      });
      if (res.ok) showFeedback('Settings saved!');
    } catch {}
  };

  const handleExport = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/profile/export`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data.export || data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'anonlink-export.json'; a.click();
        URL.revokeObjectURL(url);
      }
    } catch { showFeedback('Failed to export.'); }
  };

  const handleDelete = async () => {
    if (!confirm('Permanently delete your account? This cannot be undone.')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/profile/delete`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { localStorage.removeItem('token'); router.push('/'); }
    } catch { showFeedback('Failed to delete.'); }
  };

  const handleRevokeSession = async (id: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/profile/sessions/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { setSessions(sessions.filter(s => s.id !== id)); showFeedback('Session revoked.'); }
    } catch { showFeedback('Failed.'); }
  };

  const handleThemeSelect = (id: string) => { setTheme(id); setTimeout(handleSettingsSave, 100); };

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--brand)]/50 outline-none transition-all text-sm';
  const labelClass = 'block text-sm font-medium text-[var(--text-primary)] mb-1.5';

  const user = userProfile;
  const initials = (displayName || user?.displayName || 'U')[0].toUpperCase();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <header className="glass-heavy border-b border-[var(--border-primary)] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-extrabold text-[var(--text-primary)]">Profile</h1>
        </div>
        <button onClick={() => router.push('/dashboard')} className="px-4 py-2 rounded-xl border border-[var(--border-secondary)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors">
          Dashboard
        </button>
      </header>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-4 right-4 z-50 glass-heavy rounded-xl px-4 py-3 border border-[var(--accent)]/30 shadow-[var(--shadow-glass)]"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--accent)]">
              <Check className="w-4 h-4" /> {feedback}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <SkeletonPage />
      ) : (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6 sm:p-8 mb-6 relative overflow-hidden"
        >
          <PrivacyShield className="absolute right-0 top-0 opacity-[0.03] pointer-events-none" size={200} />
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--brand)] to-purple-500 flex items-center justify-center text-white text-3xl font-bold shadow-[var(--shadow-glow)] shrink-0">
              {initials}
            </div>
            <div className="text-center sm:text-left flex-1 min-w-0">
              <h2 className="text-2xl font-extrabold text-[var(--text-primary)]">{displayName || 'User'}</h2>
              <p className="text-sm text-[var(--text-muted)]">{user?.email || ''}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--brand-subtle)] border border-[var(--brand)]/20 text-[var(--brand)] text-xs font-bold">
                  <Crown className="w-3 h-3" /> Level {stats?.level || user?.level || 1}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-xs font-medium">
                  <Sparkles className="w-3 h-3" /> {stats?.reputationScore || user?.reputationScore || 100} Rep
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-xs font-medium">
                  <Users className="w-3 h-3" /> 0 Friends
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-56 shrink-0">
            <div className="glass-card rounded-2xl p-3 overflow-hidden" style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }}>
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-[var(--brand-subtle)] text-[var(--brand)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                  } ${tab.id === 'danger' ? 'text-[var(--danger)] hover:text-[var(--danger)]' : ''}`}
                >
                  <tab.icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              {activeTab === 'personal' && (
                <div className="glass-card rounded-2xl p-6 sm:p-8">
                  <h2 className="text-lg font-bold text-[var(--text-primary)] mb-6">Personal Info</h2>
                  <form onSubmit={handleUpdate} className="space-y-4 max-w-md">
                    <div>
                      <label className={labelClass}>Display Name</label>
                      <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputClass} placeholder="Your display name" />
                    </div>
                    <div>
                      <label className={labelClass}>Bio</label>
                      <textarea value={bio} onChange={(e) => setBio(e.target.value)} className={`${inputClass} resize-none h-24`} placeholder="Tell others about yourself..." />
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="px-6 py-2.5 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-bold text-sm transition-all shadow-[var(--shadow-glow)]">Save Changes</motion.button>
                  </form>
                </div>
              )}

              {activeTab === 'account' && (
                <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">Account Settings</h2>
                  <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">Change Password</h3>
                    <div>
                      <label className={labelClass}>Current Password</label>
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="Enter current password" />
                    </div>
                    <div>
                      <label className={labelClass}>New Password</label>
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} placeholder="Min 6 characters" />
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="px-6 py-2.5 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-bold text-sm transition-all">Update Password</motion.button>
                  </form>
                  <hr className="border-[var(--border-primary)]" />
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">Account Details</h3>
                    <div className="space-y-2 text-sm max-w-md">
                      <div className="flex justify-between p-3 rounded-xl bg-[var(--bg-tertiary)]"><span className="text-[var(--text-muted)]">Email</span><span className="text-[var(--text-primary)]">{user?.email || 'N/A'}</span></div>
                      <div className="flex justify-between p-3 rounded-xl bg-[var(--bg-tertiary)]"><span className="text-[var(--text-muted)]">Member Since</span><span className="text-[var(--text-primary)]">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span></div>
                      <div className="flex justify-between p-3 rounded-xl bg-[var(--bg-tertiary)]"><span className="text-[var(--text-muted)]">Type</span><span className="text-[var(--text-primary)] capitalize">{user?.registrationType?.toLowerCase() || 'N/A'}</span></div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'subscription' && (
                <div className="glass-card rounded-2xl p-6 sm:p-8">
                  <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Subscription</h2>
                  <div className="max-w-md">
                    <div className="p-5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] mb-4">
                      <p className="text-sm text-[var(--text-muted)]">Current Plan</p>
                      <p className="text-xl font-extrabold text-[var(--text-primary)] mt-1">Free</p>
                      <p className="text-xs text-[var(--text-muted)] mt-2">Text chat is always free. Upgrade for voice and video.</p>
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => router.push('/subscription')} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold text-sm transition-all shadow-lg">View Plans</motion.button>
                  </div>
                </div>
              )}

              {activeTab === 'friends' && (
                <div className="glass-card rounded-2xl p-6 sm:p-8">
                  <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Friends</h2>
                  <p className="text-sm text-[var(--text-secondary)]">Your friends list is managed from the dashboard.</p>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div className="glass-card rounded-2xl p-6 sm:p-8">
                  <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Privacy & Security</h2>
                  <div className="space-y-4 max-w-md">
                    <label className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                      <div><p className="text-sm font-medium text-[var(--text-primary)]">Discoverable</p><p className="text-xs text-[var(--text-muted)]">Allow others to find you</p></div>
                      <input type="checkbox" checked={discoverable} onChange={(e) => { setDiscoverable(e.target.checked); setTimeout(handleSettingsSave, 100); }} className="w-4 h-4 rounded accent-[var(--brand)]" />
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="glass-card rounded-2xl p-6 sm:p-8">
                  <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Appearance</h2>
                  <div>
                    <label className={labelClass}>Theme</label>
                    <div className="flex gap-3 mb-4">
                      <ThemeCircle id="dark" label="Dark" theme={theme} onSelect={handleThemeSelect} />
                      <ThemeCircle id="light" label="Light" theme={theme} onSelect={handleThemeSelect} />
                      <ThemeCircle id="midnight" label="Midnight" theme={theme} onSelect={handleThemeSelect} />
                      <ThemeCircle id="ocean" label="Ocean" theme={theme} onSelect={handleThemeSelect} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="glass-card rounded-2xl p-6 sm:p-8">
                  <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Notifications</h2>
                  {notificationsList.length === 0 ? (
                    <p className="text-sm text-[var(--text-muted)]">No notifications.</p>
                  ) : (
                    <div className="space-y-2 max-w-md">
                      {notificationsList.slice(0, 20).map((n: any) => (
                        <div key={n.id} className="p-3 rounded-xl bg-[var(--bg-tertiary)]">
                          <p className="text-sm font-medium text-[var(--text-primary)]">{n.title}</p>
                          <p className="text-xs text-[var(--text-muted)]">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'sessions' && (
                <div className="glass-card rounded-2xl p-6 sm:p-8">
                  <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Active Sessions</h2>
                  {sessions.length === 0 ? (
                    <p className="text-sm text-[var(--text-muted)]">No active sessions.</p>
                  ) : (
                    <div className="space-y-2 max-w-md">
                      {sessions.map((s: any) => (
                        <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-tertiary)]">
                          <div>
                            <p className="text-sm font-medium text-[var(--text-primary)]">{s.deviceHash?.slice(0, 16) || 'Unknown device'}</p>
                            <p className="text-xs text-[var(--text-muted)]">{new Date(s.connectedAt || s.createdAt).toLocaleString()}</p>
                          </div>
                          <button onClick={() => handleRevokeSession(s.id)} className="px-3 py-1.5 rounded-lg bg-[var(--danger-subtle)] text-[var(--danger)] text-xs font-medium hover:bg-[var(--danger)]/20">Revoke</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'achievements' && (
                <div className="glass-card rounded-2xl p-6 sm:p-8">
                  <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Achievements & Badges</h2>
                  <div className="flex flex-wrap gap-3 mb-6">
                    {badges.map((b: any) => (
                      <div key={b.id} className="glass-card rounded-xl px-4 py-3 text-center">
                        <div className="text-2xl mb-1">{b.iconUrl || '🏆'}</div>
                        <p className="text-xs font-bold text-[var(--text-primary)]">{b.name}</p>
                      </div>
                    ))}
                    {badges.length === 0 && <p className="text-sm text-[var(--text-muted)]">No badges yet.</p>}
                  </div>
                  <div className="space-y-2 max-w-md">
                    <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Achievements</h3>
                    {achievements.map((a: any) => (
                      <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-tertiary)]">
                        <Award className="w-5 h-5 text-[var(--brand)] shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">{a.title || a.name}</p>
                          <p className="text-xs text-[var(--text-muted)]">{a.description}</p>
                        </div>
                      </div>
                    ))}
                    {achievements.length === 0 && <p className="text-sm text-[var(--text-muted)]">No achievements yet.</p>}
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="glass-card rounded-2xl p-6 sm:p-8">
                  <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Activity</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-md">
                    {[
                      { label: 'Total Chats', value: stats?.totalChats || 0 },
                      { label: 'Voice Chats', value: stats?.voiceChats || 0 },
                      { label: 'Video Chats', value: stats?.videoChats || 0 },
                      { label: 'Level', value: stats?.level || 1 },
                    ].map((s, i) => (
                      <motion.div
                        key={s.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05, duration: 0.2 }}
                        className="text-center p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)]"
                      >
                        <p className="text-2xl font-extrabold text-[var(--text-primary)]">{s.value}</p>
                        <p className="text-xs text-[var(--text-muted)]">{s.label}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'blocked' && (
                <div className="glass-card rounded-2xl p-6 sm:p-8">
                  <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Blocked Users</h2>
                  <p className="text-sm text-[var(--text-muted)]">No blocked users.</p>
                </div>
              )}

              {activeTab === 'data' && (
                <div className="glass-card rounded-2xl p-6 sm:p-8">
                  <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Download Your Data</h2>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">Get a JSON export of your account data.</p>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleExport} className="px-6 py-2.5 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-bold text-sm transition-all flex items-center gap-2">
                    <Download className="w-4 h-4" /> Export Data
                  </motion.button>
                </div>
              )}

              {activeTab === 'danger' && (
                <div className="glass-card rounded-2xl p-6 sm:p-8 border border-[var(--danger)]/20">
                  <h2 className="text-lg font-bold text-[var(--danger)] mb-4">Delete Account</h2>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">This action is permanent and cannot be undone. All your data will be deleted.</p>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={handleDelete} className="px-6 py-2.5 rounded-xl bg-[var(--danger)] hover:bg-rose-600 text-white font-bold text-sm transition-all flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> Delete My Account
                  </motion.button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>)}
    </div>
  );
}
