"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '../../store/chatStore';
import { 
  User, Award, Settings, BarChart2, ArrowLeft, Save, 
  Smile, Shield, Globe, HelpCircle, Palette, Eye
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

const THEMES = [
  { id: 'dark', name: 'Dark (Default)', class: 'bg-[#0B0F19]' },
  { id: 'light', name: 'Light Slate', class: 'bg-[#F8FAFC]' },
  { id: 'midnight', name: 'Midnight Blue', class: 'bg-[#020617]' },
  { id: 'ocean', name: 'Ocean Green', class: 'bg-[#042f2e]' },
  { id: 'forest', name: 'Forest Moss', class: 'bg-[#064e3b]' },
  { id: 'amoled', name: 'AMOLED Black', class: 'bg-black' },
  { id: 'high-contrast', name: 'High Contrast (WCAG)', class: 'bg-black border-2 border-white' }
];

export default function ProfileDashboard() {
  const router = useRouter();
  const { token, theme, toggleTheme } = useChatStore();

  const [activeTab, setActiveTab] = useState<'stats' | 'achievements' | 'settings'>('stats');
  
  // Stats & Progress States
  const [stats, setStats] = useState<any>({
    level: 1,
    experiencePoints: 0,
    totalChats: 0,
    voiceChats: 0,
    videoChats: 0,
    reputationScore: 100,
    createdAt: new Date().toISOString()
  });

  const [achievements, setAchievements] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);

  // Settings States
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [discoverable, setDiscoverable] = useState(true);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('dark');
  const [userProfile, setUserProfile] = useState<any>(null);

  // Load Google SDK for linking
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const loadProfileData = async () => {
    try {
      const profileRes = await fetch(`${BACKEND_URL}/api/v1/profile/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (profileRes.ok) {
        const data = await profileRes.json();
        setUserProfile(data);
        setSelectedTheme(data.settings?.theme || 'dark');
        setDiscoverable(data.settings?.discoverable ?? true);
      }

      const statsRes = await fetch(`${BACKEND_URL}/api/v1/gamification/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }

      const achRes = await fetch(`${BACKEND_URL}/api/v1/gamification/achievements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (achRes.ok) {
        const data = await achRes.json();
        setAchievements(data.achievements || []);
      }

      const badgeRes = await fetch(`${BACKEND_URL}/api/v1/gamification/badges`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (badgeRes.ok) {
        const data = await badgeRes.json();
        setBadges(data.badges || []);
      }
    } catch (e) {
      console.error('Failed loading profile/stats data', e);
    }
  };

  useEffect(() => {
    if (!token) {
      router.push('/');
      return;
    }
    loadProfileData();
  }, [token, router]);

  const handleGoogleLink = () => {
    if (!(window as any).google) {
      alert('Google Identity SDK is loading. Please wait a moment and try again.');
      return;
    }

    (window as any).google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'mock-google-client-id',
      callback: async (response: any) => {
        try {
          const res = await fetch(`${BACKEND_URL}/api/v1/auth/google/link`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ idToken: response.credential })
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Failed to link account');
          }
          alert('Google account linked successfully!');
          loadProfileData();
        } catch (err: any) {
          alert(err.message || 'Error linking account');
        }
      }
    });

    (window as any).google.accounts.id.prompt();
  };

  const handleGoogleUnlink = async () => {
    if (!confirm('Are you sure you want to unlink your Google account?')) {
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/auth/google/unlink`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to unlink account');
      }
      alert('Google account unlinked successfully!');
      loadProfileData();
    } catch (err: any) {
      alert(err.message || 'Error unlinking account');
    }
  };

  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/profile/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          theme: selectedTheme,
          discoverable,
          languagePref: 'en'
        })
      });
      if (res.ok) {
        alert('Profile settings saved successfully.');
      }
    } catch (e) {}
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#0B0F19] text-white' : 'bg-[#F8FAFC] text-slate-900'
    } ${fontSize === 'large' ? 'text-lg' : fontSize === 'xlarge' ? 'text-xl' : 'text-sm'}`}>
      
      {/* Top Header */}
      <header className={`px-6 py-4 flex items-center gap-4 border-b ${
        theme === 'dark' ? 'border-white/5 bg-[#1E293B]/40' : 'border-slate-200 bg-white'
      }`}>
        <button 
          onClick={() => router.push('/dashboard')}
          className="p-2 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 text-slate-400"
          aria-label="Return to Dashboard Lobby"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-black flex items-center gap-2">
          <User className="w-5 h-5 text-indigo-500" /> Gamer Profile & Settings
        </h1>
      </header>

      {/* Main Grid Content */}
      <div className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-12 flex flex-col md:flex-row gap-8 overflow-hidden">
        {/* Left column options */}
        <aside className="w-full md:w-56 flex flex-col gap-1.5 shrink-0">
          <button
            onClick={() => setActiveTab('stats')}
            className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold flex items-center gap-2.5 transition-all ${
              activeTab === 'stats' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-500/10 text-slate-400'
            }`}
          >
            <BarChart2 className="w-4 h-4" /> My Dashboard Stats
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold flex items-center gap-2.5 transition-all ${
              activeTab === 'achievements' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-500/10 text-slate-400'
            }`}
          >
            <Award className="w-4 h-4" /> Achievements & Badges
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold flex items-center gap-2.5 transition-all ${
              activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-500/10 text-slate-400'
            }`}
          >
            <Settings className="w-4 h-4" /> Account Settings
          </button>
        </aside>

        {/* Right column content */}
        <main className="flex-1 overflow-y-auto">
          
          {/* TAB 1: DASHBOARD STATS */}
          {activeTab === 'stats' && (
            <div className="space-y-6 max-w-2xl">
              {/* Level & XP Gauge */}
              <div className={`p-6 rounded-3xl border ${
                theme === 'dark' ? 'bg-[#1E293B]/40 border-white/5' : 'bg-white border-slate-200'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-indigo-500">Level {stats.level} Explorer</span>
                  <span className="text-xs font-bold text-slate-400">{stats.experiencePoints} / {stats.level * 100} XP</span>
                </div>
                {/* XP Gauge Bar */}
                <div className="w-full h-3 rounded-full bg-slate-500/15 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${(stats.experiencePoints / (stats.level * 100)) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Stats Counters Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className={`p-5 rounded-2xl border text-center ${theme === 'dark' ? 'bg-[#1E293B]/40 border-white/5' : 'bg-white border-slate-200'}`}>
                  <div className="text-2xl font-black text-indigo-400">{stats.totalChats}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">Total Chats</div>
                </div>
                <div className={`p-5 rounded-2xl border text-center ${theme === 'dark' ? 'bg-[#1E293B]/40 border-white/5' : 'bg-white border-slate-200'}`}>
                  <div className="text-2xl font-black text-indigo-400">{stats.voiceChats}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">Voice Matches</div>
                </div>
                <div className={`p-5 rounded-2xl border text-center ${theme === 'dark' ? 'bg-[#1E293B]/40 border-white/5' : 'bg-white border-slate-200'}`}>
                  <div className="text-2xl font-black text-indigo-400">{stats.videoChats}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">Video Matches</div>
                </div>
                <div className={`p-5 rounded-2xl border text-center ${theme === 'dark' ? 'bg-[#1E293B]/40 border-white/5' : 'bg-white border-slate-200'}`}>
                  <div className="text-2xl font-black text-indigo-400">{stats.reputationScore}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">Reputation</div>
                </div>
                <div className={`col-span-2 p-5 rounded-2xl border text-center ${theme === 'dark' ? 'bg-[#1E293B]/40 border-white/5' : 'bg-white border-slate-200'}`}>
                  <div className="text-xs font-bold text-indigo-400 mt-1.5">
                    Member Since: {new Date(stats.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACHIEVEMENTS & BADGES */}
          {activeTab === 'achievements' && (
            <div className="space-y-6 max-w-2xl">
              {/* Badges Display Row */}
              <div>
                <h2 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">Earned Profile Badges</h2>
                <div className="flex flex-wrap gap-2">
                  {badges.map((b) => (
                    <span 
                      key={b.id} 
                      className="px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5"
                    >
                      🛡️ {b.name}
                    </span>
                  ))}
                  {badges.length === 0 && (
                    <span className="text-xs text-slate-500 italic">No badges unlocked yet. Keep chatting to earn recognition!</span>
                  )}
                </div>
              </div>

              {/* Achievements Grid List */}
              <div>
                <h2 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">Achievements Progression</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map((ach) => (
                    <div 
                      key={ach.id}
                      className={`p-4 rounded-2xl border flex items-center gap-4 ${
                        theme === 'dark' ? 'bg-[#1E293B]/40 border-white/5' : 'bg-white border-slate-200'
                      }`}
                    >
                      <Award className="w-8 h-8 text-indigo-500 shrink-0" />
                      <div>
                        <div className="text-xs font-bold">{ach.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{ach.description}</div>
                      </div>
                    </div>
                  ))}
                  {achievements.length === 0 && (
                    <span className="text-xs text-slate-500 italic">No achievements unlocked yet.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACCOUNT CONFIG SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl">
              <form onSubmit={handleSettingsSave} className="space-y-6">
                
                {/* Visual Themes selection */}
                <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-[#1E293B]/40 border-white/5' : 'bg-white border-slate-200'}`}>
                  <h2 className="text-sm font-bold mb-4 flex items-center gap-2 text-indigo-500">
                    <Palette className="w-4 h-4" /> Personalization Themes
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                    {THEMES.map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => setSelectedTheme(t.id)}
                        className={`p-3 rounded-xl border text-[10px] font-bold text-left transition-all ${t.class} ${
                          selectedTheme === t.id ? 'ring-2 ring-indigo-500' : 'opacity-80'
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accessibility */}
                <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-[#1E293B]/40 border-white/5' : 'bg-white border-slate-200'}`}>
                  <h2 className="text-sm font-bold mb-4 flex items-center gap-2 text-indigo-500">
                    <Eye className="w-4 h-4" /> Visual Accessibility
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Font Scaling Size</label>
                      <select 
                        value={fontSize} 
                        onChange={(e: any) => setFontSize(e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl border outline-none text-xs ${
                          theme === 'dark' ? 'bg-slate-950 border-white/5' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <option value="normal">Normal (14px)</option>
                        <option value="large">Large (16px)</option>
                        <option value="xlarge">Extra Large (18px)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Interface Effects</label>
                      <button
                        type="button"
                        onClick={() => setReducedMotion(!reducedMotion)}
                        className={`w-full py-2 rounded-xl text-xs font-bold border transition-all ${
                          reducedMotion ? 'bg-indigo-600 border-indigo-500 text-white' : 'text-slate-400'
                        }`}
                      >
                        {reducedMotion ? 'Reduced Motion (Active)' : 'Enable Reduced Motion'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Profile Fields */}
                <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-[#1E293B]/40 border-white/5' : 'bg-white border-slate-200'}`}>
                  <h2 className="text-sm font-bold mb-4 flex items-center gap-2 text-indigo-500">
                    <Smile className="w-4 h-4" /> Profile Info
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Gamer Display Tag</label>
                      <input 
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. AnonPro"
                        className={`w-full px-3 py-2 rounded-xl border outline-none text-xs ${
                          theme === 'dark' ? 'bg-slate-950 border-white/5 focus:border-indigo-500' : 'bg-slate-50 border-slate-200'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Bio Details</label>
                      <textarea 
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Brief explorer intro..."
                        className={`w-full p-3 rounded-xl border outline-none text-xs h-20 ${
                          theme === 'dark' ? 'bg-slate-950 border-white/5 focus:border-indigo-500' : 'bg-slate-50 border-slate-200'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Linked Accounts */}
                <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-[#1E293B]/40 border-white/5' : 'bg-white border-slate-200'}`}>
                  <h2 className="text-sm font-bold mb-4 flex items-center gap-2 text-indigo-500">
                    <Globe className="w-4 h-4" /> Linked Accounts
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-500/5 border border-slate-500/10">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-indigo-600/10 text-indigo-500">
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                              fill="currentColor"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="currentColor"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs font-bold">Google Authentication</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-semibold">
                            {userProfile?.linkedProviders?.includes('google')
                              ? `Linked as: ${userProfile?.email || 'Active'}`
                              : 'Not linked'}
                          </div>
                        </div>
                      </div>
                      
                      {userProfile?.linkedProviders?.includes('google') ? (
                        <button
                          type="button"
                          onClick={handleGoogleUnlink}
                          className="px-4 py-2 rounded-xl border border-rose-500/20 hover:bg-rose-500/10 text-rose-500 text-xs font-bold active:scale-95 transition-all cursor-pointer"
                        >
                          Unlink
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleGoogleLink}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold active:scale-95 transition-all cursor-pointer"
                        >
                          Link Account
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Save button */}
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg shadow-indigo-600/20"
                >
                  <Save className="w-4 h-4" /> Save Account Profile Settings
                </button>

              </form>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
