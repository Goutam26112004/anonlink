"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '../../store/chatStore';
import {
  User, Award, Settings, BarChart2, ArrowLeft, Save,
  Smile, Shield, Globe, Palette,
  Bell, Key, Trash2, Download, LogOut, Crown, Check
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

const THEMES = [
  { id: 'dark', name: 'Dark', class: 'bg-[#0B0F19]' },
  { id: 'light', name: 'Light', class: 'bg-[#F8FAFC]' },
  { id: 'midnight', name: 'Midnight', class: 'bg-[#020617]' },
  { id: 'ocean', name: 'Ocean', class: 'bg-[#042f2e]' },
  { id: 'amoled', name: 'AMOLED', class: 'bg-black' }
];

export default function ProfileDashboard() {
  const router = useRouter();
  const { token, theme } = useChatStore();

  const [activeTab, setActiveTab] = useState<'stats' | 'achievements' | 'settings' | 'account' | 'notifications'>('stats');
  const [stats, setStats] = useState<any>({ level: 1, experiencePoints: 0, totalChats: 0, voiceChats: 0, videoChats: 0, reputationScore: 100, createdAt: new Date().toISOString() });
  const [achievements, setAchievements] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [discoverable, setDiscoverable] = useState(true);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('dark');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true; script.defer = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const loadProfileData = async () => {
    try {
      const [profileRes, statsRes, achRes, badgeRes, sessionsRes, notifRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/v1/profile/me`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/api/v1/gamification/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/api/v1/gamification/achievements`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/api/v1/gamification/badges`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/api/v1/profile/sessions`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BACKEND_URL}/api/v1/profile/notifications`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (profileRes.ok) { const d = await profileRes.json(); setUserProfile(d); setSelectedTheme(d.settings?.theme || 'dark'); setDiscoverable(d.settings?.discoverable ?? true); setDisplayName(d.displayName || ''); setBio(d.bio || ''); }
      if (statsRes.ok) setStats((await statsRes.json()).stats);
      if (achRes.ok) setAchievements((await achRes.json()).achievements || []);
      if (badgeRes.ok) setBadges((await badgeRes.json()).badges || []);
      if (sessionsRes.ok) setSessions((await sessionsRes.json()).sessions || []);
      if (notifRes.ok) setNotificationsList((await notifRes.json()).notifications || []);
    } catch (e) { console.error('Failed loading profile data', e); }
  };

  useEffect(() => { if (!token) { router.push('/'); return; } loadProfileData(); }, [token, router]);

  const showFeedback = (msg: string) => { setFeedback(msg); setTimeout(() => setFeedback(''), 3000); };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/profile/update`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ displayName, bio })
      });
      if (res.ok) { showFeedback('Profile updated!'); loadProfileData(); }
      else showFeedback((await res.json()).error || 'Update failed.');
    } catch { showFeedback('Failed to update profile.'); }
  };

  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/profile/settings`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ theme: selectedTheme, discoverable, languagePref: 'en', showLastSeen: true, showOnlineStatus: true })
      });
      if (res.ok) showFeedback('Settings saved!');
    } catch {}
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { showFeedback('Passwords do not match.'); return; }
    if (newPassword.length < 6) { showFeedback('Password must be 6+ characters.'); return; }
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/profile/password`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) { showFeedback('Password changed!'); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }
      else showFeedback(data.error || 'Failed.');
    } catch { showFeedback('Failed to change password.'); }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/profile/sessions/${sessionId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { setSessions(sessions.filter(s => s.id !== sessionId)); showFeedback('Session revoked.'); }
    } catch { showFeedback('Failed to revoke session.'); }
  };

  const handleExportData = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/profile/export`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data.export, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'anonlink-export.json'; a.click();
        URL.revokeObjectURL(url);
      }
    } catch { showFeedback('Failed to export.'); }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Permanently delete your account? This cannot be undone.')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/profile/delete`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { localStorage.removeItem('token'); router.push('/'); }
      else showFeedback('Failed to delete.');
    } catch { showFeedback('Failed to delete.'); }
  };

  const handleGoogleLink = () => {
    if (!(window as any).google) { showFeedback('Google SDK loading...'); return; }
    (window as any).google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'mock-google-client-id',
      callback: async (response: any) => {
        try {
          const res = await fetch(`${BACKEND_URL}/api/v1/auth/google/link`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ idToken: response.credential })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to link');
          showFeedback('Google linked!');
          loadProfileData();
        } catch (err: any) { showFeedback(err.message); }
      }
    });
    (window as any).google.accounts.id.prompt();
  };

  const handleGoogleUnlink = async () => {
    if (!confirm('Unlink Google account?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/auth/google/unlink`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to unlink');
      showFeedback('Google unlinked.');
      loadProfileData();
    } catch (err: any) { showFeedback(err.message); }
  };

  const handleNotificationRead = async (notificationId?: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/v1/profile/notifications/read`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notificationId })
      });
      loadProfileData();
    } catch {}
  };

  const isDark = theme === 'dark';
  const bg = isDark ? 'bg-[#0B0F19]' : 'bg-[#F8FAFC]';
  const text = isDark ? 'text-white' : 'text-slate-900';
  const card = isDark ? 'bg-[#1E293B]/40 border-white/5' : 'bg-white border-slate-200';
  const input = isDark ? 'bg-slate-950 border-white/5 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500';
  const sub = isDark ? 'text-slate-400' : 'text-slate-500';

  const tabs = [
    { id: 'stats', label: 'Stats', icon: BarChart2 },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'account', label: 'Account', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ] as const;

  return (
    <div className={`min-h-screen flex flex-col ${bg} ${text} transition-colors duration-300 ${fontSize === 'large' ? 'text-lg' : fontSize === 'xlarge' ? 'text-xl' : 'text-sm'}`}>
      <header className={`px-4 sm:px-6 py-3 flex items-center gap-3 border-b shrink-0 ${isDark ? 'border-white/5 bg-[#1E293B]/40' : 'border-slate-200 bg-white'}`}>
        <button onClick={() => router.push('/dashboard')} className="p-1.5 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-base font-bold flex items-center gap-2"><User className="w-4 h-4 text-indigo-500" /> Profile & Settings</h1>
      </header>

      {feedback && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-lg animate-pulse">
          {feedback}
        </div>
      )}

      <div className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 md:p-8 flex flex-col md:flex-row gap-6 overflow-hidden">
        <aside className="w-full md:w-48 flex md:flex-col gap-1 shrink-0 overflow-x-auto md:overflow-x-visible">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`shrink-0 px-3 py-2.5 rounded-xl text-left text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTab === t.id ? 'bg-indigo-600 text-white' : 'hover:bg-slate-500/10 text-slate-400'
              }`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </aside>

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'stats' && (
            <div className="space-y-4 max-w-2xl">
              <div className={`p-5 rounded-2xl border ${card}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-indigo-500">Level {stats.level}</span>
                  <span className="text-[10px] font-bold text-slate-400">{stats.experiencePoints} / {stats.level * 100} XP</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-500/15 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, (stats.experiencePoints / (stats.level * 100)) * 100)}%` }}></div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: 'Total Chats', value: stats.totalChats },
                  { label: 'Voice Matches', value: stats.voiceChats },
                  { label: 'Video Matches', value: stats.videoChats },
                  { label: 'Reputation', value: stats.reputationScore },
                ].map((s) => (
                  <div key={s.label} className={`p-4 rounded-2xl border text-center ${card}`}>
                    <div className="text-xl font-black text-indigo-400">{s.value}</div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{s.label}</div>
                  </div>
                ))}
                <div className={`col-span-2 p-4 rounded-2xl border text-center ${card}`}>
                  <div className="text-[10px] font-bold text-indigo-400">
                    Member Since: {new Date(stats.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-5 max-w-2xl">
              <div>
                <h2 className="text-xs font-bold text-slate-400 mb-2 uppercase">Profile Badges</h2>
                <div className="flex flex-wrap gap-2">
                  {badges.map((b) => (
                    <span key={b.id} className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> {b.name}
                    </span>
                  ))}
                  {badges.length === 0 && <span className="text-xs text-slate-500 italic">No badges yet.</span>}
                </div>
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-400 mb-2 uppercase">Achievements</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {achievements.map((ach) => (
                    <div key={ach.id} className={`p-4 rounded-2xl border flex items-center gap-3 ${card}`}>
                      <Award className="w-6 h-6 text-indigo-500 shrink-0" />
                      <div>
                        <div className="text-xs font-bold">{ach.title}</div>
                        <div className="text-[10px] text-slate-400">{ach.description}</div>
                      </div>
                    </div>
                  ))}
                  {achievements.length === 0 && <span className="text-xs text-slate-500 italic">No achievements yet.</span>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-2xl space-y-5">
              <form onSubmit={handleProfileUpdate} className={`p-5 rounded-2xl border ${card}`}>
                <h2 className="text-xs font-bold mb-3 flex items-center gap-2 text-indigo-500"><Smile className="w-3.5 h-3.5" /> Profile Info</h2>
                <div className="space-y-3">
                  <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Display Name"
                    className={`w-full px-3 py-2 rounded-xl border outline-none text-xs ${input}`} />
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)}
                    placeholder="Bio"
                    className={`w-full p-3 rounded-xl border outline-none text-xs h-16 resize-none ${input}`} />
                  <button type="submit" className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5">
                    <Save className="w-3.5 h-3.5" /> Save Profile
                  </button>
                </div>
              </form>

              <form onSubmit={handleSettingsSave} className={`p-5 rounded-2xl border ${card}`}>
                <h2 className="text-xs font-bold mb-3 flex items-center gap-2 text-indigo-500"><Palette className="w-3.5 h-3.5" /> Theme & Accessibility</h2>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-3">
                  {THEMES.map((t) => (
                    <button type="button" key={t.id} onClick={() => setSelectedTheme(t.id)}
                      className={`p-2 rounded-xl border text-[9px] font-bold text-left transition-all ${t.class} ${selectedTheme === t.id ? 'ring-2 ring-indigo-500 text-white' : 'opacity-80 text-white'}`}>
                      {t.name}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <select value={fontSize} onChange={(e: any) => setFontSize(e.target.value)}
                    className={`px-3 py-2 rounded-xl border outline-none text-xs ${input}`}>
                    <option value="normal">Normal</option>
                    <option value="large">Large</option>
                    <option value="xlarge">Extra Large</option>
                  </select>
                  <button type="button" onClick={() => setReducedMotion(!reducedMotion)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${reducedMotion ? 'bg-indigo-600 border-indigo-500 text-white' : 'text-slate-400'}`}>
                    {reducedMotion ? 'Reduced Motion' : 'Full Motion'}
                  </button>
                </div>
                <label className="flex items-center gap-2 mb-3">
                  <input type="checkbox" checked={discoverable} onChange={(e) => setDiscoverable(e.target.checked)} className="rounded border-slate-500" />
                  <span className="text-xs text-slate-400">Allow others to find me</span>
                </label>
                <button type="submit" className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5">
                  <Save className="w-3.5 h-3.5" /> Save Settings
                </button>
              </form>

              <div className={`p-5 rounded-2xl border ${card}`}>
                <h2 className="text-xs font-bold mb-3 flex items-center gap-2 text-indigo-500"><Globe className="w-3.5 h-3.5" /> Linked Accounts</h2>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-500/5 border border-slate-500/10">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-indigo-600/10 text-indigo-500">
                      <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    </div>
                    <div>
                      <div className="text-xs font-bold">Google</div>
                      <div className="text-[9px] text-slate-400">{userProfile?.linkedProviders?.includes('google') ? 'Linked' : 'Not linked'}</div>
                    </div>
                  </div>
                  {userProfile?.linkedProviders?.includes('google') ? (
                    <button onClick={handleGoogleUnlink} className="px-3 py-1.5 rounded-xl border border-rose-500/20 hover:bg-rose-500/10 text-rose-500 text-[10px] font-bold cursor-pointer">Unlink</button>
                  ) : (
                    <button onClick={handleGoogleLink} className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold cursor-pointer">Link</button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="max-w-2xl space-y-5">
              <form onSubmit={handlePasswordChange} className={`p-5 rounded-2xl border ${card}`}>
                <h2 className="text-xs font-bold mb-3 flex items-center gap-2 text-indigo-500"><Key className="w-3.5 h-3.5" /> Change Password</h2>
                <div className="space-y-2.5">
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current Password"
                    className={`w-full px-3 py-2 rounded-xl border outline-none text-xs ${input}`} />
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New Password"
                    className={`w-full px-3 py-2 rounded-xl border outline-none text-xs ${input}`} />
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm New Password"
                    className={`w-full px-3 py-2 rounded-xl border outline-none text-xs ${input}`} />
                  <button type="submit" className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all cursor-pointer">Change Password</button>
                </div>
              </form>

              <div className={`p-5 rounded-2xl border ${card}`}>
                <h2 className="text-xs font-bold mb-3 flex items-center gap-2 text-indigo-500"><LogOut className="w-3.5 h-3.5" /> Active Sessions</h2>
                <div className="space-y-2">
                  {sessions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-500/5 border border-slate-500/10">
                      <div>
                        <div className="text-xs font-bold">{s.deviceHash ? s.deviceHash.substring(0, 12) + '...' : 'Unknown device'}</div>
                        <div className="text-[9px] text-slate-400">Created: {new Date(s.createdAt).toLocaleDateString()}</div>
                      </div>
                      <button onClick={() => handleRevokeSession(s.id)} className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 text-[10px] font-bold hover:bg-rose-500/20 cursor-pointer">Revoke</button>
                    </div>
                  ))}
                  {sessions.length === 0 && <span className="text-xs text-slate-500 italic">No sessions.</span>}
                </div>
              </div>

              <div className={`p-5 rounded-2xl border ${card}`}>
                <h2 className="text-xs font-bold mb-3 flex items-center gap-2 text-indigo-500"><Shield className="w-3.5 h-3.5" /> Data & Privacy</h2>
                <div className="space-y-2.5">
                  <button onClick={handleExportData} className="w-full py-2 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2">
                    <Download className="w-3.5 h-3.5" /> Export My Data
                  </button>
                  <button onClick={handleDeleteAccount} className="w-full py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2">
                    <Trash2 className="w-3.5 h-3.5" /> Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="max-w-2xl space-y-3">
              {notificationsList.length > 0 && (
                <div className="flex justify-end">
                  <button onClick={() => handleNotificationRead()} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer">Mark all read</button>
                </div>
              )}
              {notificationsList.map((n) => (
                <div key={n.id} className={`p-3 rounded-2xl border flex items-start gap-2.5 ${n.isRead ? 'opacity-60' : ''} ${card}`}>
                  <Bell className={`w-3.5 h-3.5 mt-0.5 ${n.isRead ? 'text-slate-500' : 'text-indigo-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold">{n.title || 'Notification'}</div>
                    <div className="text-[10px] text-slate-400">{n.message}</div>
                    <div className="text-[8px] text-slate-500 mt-0.5">{new Date(n.createdAt).toLocaleDateString()}</div>
                  </div>
                  {!n.isRead && <button onClick={() => handleNotificationRead(n.id)} className="text-[9px] text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer shrink-0">Read</button>}
                </div>
              ))}
              {notificationsList.length === 0 && (
                <div className="text-center py-8">
                  <Bell className="w-8 h-8 text-slate-500/30 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 italic">No notifications yet.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
