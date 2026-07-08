"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '../../store/chatStore';
import { 
  Shield, Users, AlertOctagon, Settings, Cpu, Megaphone, 
  MessageSquare, Database, Check, X, RefreshCw, Send, Download
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export default function AdminDashboard() {
  const router = useRouter();
  const { token, theme } = useChatStore();

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'reports' | 'appeals' | 'feedback'>('stats');

  // Stats & Config States
  const [sysStats, setSysStats] = useState<any>(null);
  const [config, setConfig] = useState<any>({ matchThreshold: 40, fallbackTimeout: 10 });
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastStatus, setBroadcastStatus] = useState('');
  const [backupStatus, setBackupStatus] = useState('');

  // Users States
  const [users, setUsers] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');

  // Reports States
  const [reports, setReports] = useState<any[]>([]);

  // Appeals States
  const [appeals, setAppeals] = useState<any[]>([]);

  // Feedback States
  const [feedbacks, setFeedbacks] = useState<any[]>([]);

  // Verify Role
  useEffect(() => {
    if (!token) {
      router.push('/');
      return;
    }

    const checkAdmin = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/profile/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const profile = await res.json();
          const role = profile.role?.toUpperCase();
          if (['SUPER ADMIN', 'ADMIN', 'SENIOR MODERATOR', 'MODERATOR'].includes(role)) {
            setIsAdmin(true);
            setCheckingRole(false);
          } else {
            router.push('/dashboard');
          }
        } else {
          router.push('/dashboard');
        }
      } catch (e) {
        router.push('/dashboard');
      }
    };

    checkAdmin();
  }, [token, router]);

  // Load Data based on Tab
  useEffect(() => {
    if (!isAdmin) return;

    if (activeTab === 'stats') {
      fetchStats();
      fetchConfig();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'reports') {
      fetchReports();
    } else if (activeTab === 'appeals') {
      fetchAppeals();
    } else if (activeTab === 'feedback') {
      fetchFeedbacks();
    }
  }, [isAdmin, activeTab, userPage, userSearch]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/admin/system/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setSysStats(await res.json());
    } catch (e) {}
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/admin/config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setConfig(await res.json());
    } catch (e) {}
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/admin/users?search=${userSearch}&page=${userPage}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotalUsers(data.total);
      }
    } catch (e) {}
  };

  const fetchReports = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/admin/reports?status=PENDING`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports);
      }
    } catch (e) {}
  };

  const fetchAppeals = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/admin/appeals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAppeals(data.appeals);
      }
    } catch (e) {}
  };

  const fetchFeedbacks = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/admin/feedback`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data.feedbacks);
      }
    } catch (e) {}
  };

  // Actions
  const handleConfigUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/admin/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(config)
      });
      if (res.ok) alert('Config saved successfully.');
    } catch (e) {}
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/admin/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: broadcastMsg })
      });
      if (res.ok) {
        setBroadcastStatus('Broadcast sent site-wide!');
        setBroadcastMsg('');
      }
    } catch (e) {}
  };

  const triggerBackup = async () => {
    setBackupStatus('Generating backup file...');
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/admin/backups/export`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setBackupStatus(`Success: ${data.filename}`);
      } else {
        setBackupStatus('Backup failed.');
      }
    } catch (e) {
      setBackupStatus('Backup failed.');
    }
  };

  const handleBanUser = async (userId: string, shadowBan: boolean) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ shadowBan })
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (e) {}
  };

  const handleResolveReport = async (reportId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/admin/reports/${reportId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, moderatorNotes: 'Handled via Admin dashboard' })
      });
      if (res.ok) {
        fetchReports();
      }
    } catch (e) {}
  };

  const handleResolveAppeal = async (appealId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/admin/appeals/${appealId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, decisionLog: 'Resolved via Admin dashboard' })
      });
      if (res.ok) {
        fetchAppeals();
      }
    } catch (e) {}
  };

  if (checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] text-white">
        <div className="text-sm font-bold flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" /> Verifying Administrator Access...
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#0B0F19] text-white' : 'bg-[#F8FAFC] text-slate-900'
    }`}>
      {/* Top Header */}
      <header className={`px-6 py-4 flex justify-between items-center border-b ${
        theme === 'dark' ? 'border-white/5 bg-[#1E293B]/40' : 'border-slate-200 bg-white'
      }`}>
        <h1 className="text-lg font-black flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-500" /> Admin & Moderator Console
        </h1>
        <button 
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-xs font-bold"
        >
          Exit Console
        </button>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar Nav */}
        <aside className={`w-full md:w-60 p-4 border-r flex flex-col gap-1.5 ${
          theme === 'dark' ? 'border-white/5 bg-[#1E293B]/20' : 'border-slate-200 bg-slate-50'
        }`}>
          <button
            onClick={() => setActiveTab('stats')}
            className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold flex items-center gap-2.5 transition-all ${
              activeTab === 'stats' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-500/10 text-slate-400'
            }`}
          >
            <Cpu className="w-4 h-4" /> Overview & Monitor
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold flex items-center gap-2.5 transition-all ${
              activeTab === 'users' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-500/10 text-slate-400'
            }`}
          >
            <Users className="w-4 h-4" /> User Directory
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold flex items-center gap-2.5 transition-all relative ${
              activeTab === 'reports' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-500/10 text-slate-400'
            }`}
          >
            <AlertOctagon className="w-4 h-4" /> Reports Queue
            {reports.length > 0 && (
              <span className="absolute right-3 px-1.5 py-0.5 rounded-full text-[9px] bg-rose-600 text-white">
                {reports.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('appeals')}
            className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold flex items-center gap-2.5 transition-all relative ${
              activeTab === 'appeals' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-500/10 text-slate-400'
            }`}
          >
            <RefreshCw className="w-4 h-4" /> Appeals Queue
            {appeals.filter(a => a.status === 'PENDING').length > 0 && (
              <span className="absolute right-3 px-1.5 py-0.5 rounded-full text-[9px] bg-amber-600 text-white">
                {appeals.filter(a => a.status === 'PENDING').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold flex items-center gap-2.5 transition-all ${
              activeTab === 'feedback' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-500/10 text-slate-400'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Bug & Feedback
          </button>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'stats' && (
            <div className="space-y-6 max-w-4xl">
              {/* Server Stats Cards */}
              {sysStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-[#1E293B]/40 border-white/5' : 'bg-white border-slate-200'}`}>
                    <div className="text-xs text-slate-400 font-bold mb-1">Queue: Text</div>
                    <div className="text-2xl font-black text-indigo-400">{sysStats.queues?.text || 0}</div>
                  </div>
                  <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-[#1E293B]/40 border-white/5' : 'bg-white border-slate-200'}`}>
                    <div className="text-xs text-slate-400 font-bold mb-1">Queue: Voice</div>
                    <div className="text-2xl font-black text-indigo-400">{sysStats.queues?.voice || 0}</div>
                  </div>
                  <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-[#1E293B]/40 border-white/5' : 'bg-white border-slate-200'}`}>
                    <div className="text-xs text-slate-400 font-bold mb-1">Queue: Video</div>
                    <div className="text-2xl font-black text-indigo-400">{sysStats.queues?.video || 0}</div>
                  </div>
                  <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-[#1E293B]/40 border-white/5' : 'bg-white border-slate-200'}`}>
                    <div className="text-xs text-slate-400 font-bold mb-1">OS System</div>
                    <div className="text-sm font-bold text-indigo-400">{sysStats.os?.platform} ({sysStats.os?.cpuCount} Cores)</div>
                  </div>
                </div>
              )}

              {/* Grid: Broadcasts and Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Configurations */}
                <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-[#1E293B]/40 border-white/5' : 'bg-white border-slate-200'}`}>
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-indigo-500" /> Platform Configurations</h2>
                  <form onSubmit={handleConfigUpdate} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Match Base Score Threshold</label>
                      <input 
                        type="number"
                        value={config.matchThreshold}
                        onChange={(e) => setConfig({ ...config, matchThreshold: parseInt(e.target.value) })}
                        className={`w-full px-3 py-2 rounded-xl border outline-none text-xs ${
                          theme === 'dark' ? 'bg-slate-950/40 border-white/5 focus:border-indigo-500' : 'bg-white border-slate-200'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Queue Fallback Cooldown (Sec)</label>
                      <input 
                        type="number"
                        value={config.fallbackTimeout}
                        onChange={(e) => setConfig({ ...config, fallbackTimeout: parseInt(e.target.value) })}
                        className={`w-full px-3 py-2 rounded-xl border outline-none text-xs ${
                          theme === 'dark' ? 'bg-slate-950/40 border-white/5 focus:border-indigo-500' : 'bg-white border-slate-200'
                        }`}
                      />
                    </div>
                    <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all cursor-pointer">
                      Save Configurations
                    </button>
                  </form>
                </div>

                {/* Broadcasts & Backups */}
                <div className="space-y-6">
                  {/* Broadcast alerts */}
                  <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-[#1E293B]/40 border-white/5' : 'bg-white border-slate-200'}`}>
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Megaphone className="w-5 h-5 text-indigo-500" /> Site-wide Announcement</h2>
                    <form onSubmit={handleBroadcast} className="space-y-3">
                      <input 
                        type="text"
                        value={broadcastMsg}
                        onChange={(e) => setBroadcastMsg(e.target.value)}
                        placeholder="Type site message..."
                        className={`w-full px-3 py-2 rounded-xl border outline-none text-xs ${
                          theme === 'dark' ? 'bg-slate-950/40 border-white/5 focus:border-indigo-500' : 'bg-white border-slate-200'
                        }`}
                      />
                      {broadcastStatus && <div className="text-[10px] text-emerald-500 font-bold">{broadcastStatus}</div>}
                      <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer">
                        <Send className="w-3.5 h-3.5" /> Broadcast Message
                      </button>
                    </form>
                  </div>

                  {/* Backups */}
                  <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-[#1E293B]/40 border-white/5' : 'bg-white border-slate-200'}`}>
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Database className="w-5 h-5 text-indigo-500" /> Platform JSON Backups</h2>
                    <p className="text-xs text-slate-400 mb-3">Generates JSON outputs of User profile tables, reports logs, and audit logs.</p>
                    {backupStatus && <div className="text-[10px] text-indigo-400 font-bold mb-2">{backupStatus}</div>}
                    <button 
                      onClick={triggerBackup}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Trigger Database Backup
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER DIRECTORY */}
          {activeTab === 'users' && (
            <div className="space-y-4 max-w-5xl">
              <div className="flex gap-4">
                <input 
                  type="text"
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUserPage(1);
                  }}
                  placeholder="Search users by email or ID..."
                  className={`flex-1 px-4 py-2 rounded-xl border outline-none text-xs ${
                    theme === 'dark' ? 'bg-slate-950/40 border-white/5 focus:border-indigo-500' : 'bg-white border-slate-200'
                  }`}
                />
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-500/10">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-500/5 text-slate-400 font-bold border-b border-slate-500/10">
                      <th className="p-3">User ID</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Reputation</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-slate-500/5 hover:bg-slate-500/5 transition-colors">
                        <td className="p-3 font-mono text-[10px] truncate max-w-[100px]">{u.id}</td>
                        <td className="p-3 font-medium">{u.email || 'Guest Stranger'}</td>
                        <td className="p-3 font-bold text-indigo-400">{u.role?.name}</td>
                        <td className="p-3 font-bold">{u.reputationScore}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.isShadowBanned ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
                          }`}>
                            {u.isShadowBanned ? 'SHADOW BANNED' : 'ACTIVE'}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => handleBanUser(u.id, !u.isShadowBanned)}
                            className={`px-2 py-1 rounded font-bold text-[10px] ${
                              u.isShadowBanned ? 'bg-emerald-600/15 text-emerald-400' : 'bg-rose-600/15 text-rose-400'
                            }`}
                          >
                            {u.isShadowBanned ? 'Unban' : 'Shadow Ban'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
                <span>Total records: {totalUsers}</span>
                <div className="flex gap-2">
                  <button 
                    disabled={userPage === 1}
                    onClick={() => setUserPage(userPage - 1)}
                    className="px-2 py-1 rounded bg-slate-500/10 hover:bg-slate-500/20 disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span className="px-2 py-1">Page {userPage}</span>
                  <button 
                    disabled={users.length < 20}
                    onClick={() => setUserPage(userPage + 1)}
                    className="px-2 py-1 rounded bg-slate-500/10 hover:bg-slate-500/20 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REPORTS QUEUE */}
          {activeTab === 'reports' && (
            <div className="space-y-4 max-w-4xl">
              <div className="overflow-x-auto rounded-2xl border border-slate-500/10">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-500/5 text-slate-400 font-bold border-b border-slate-500/10">
                      <th className="p-3">Reported User</th>
                      <th className="p-3">Reason</th>
                      <th className="p-3">Reporter</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => (
                      <tr key={r.id} className="border-b border-slate-500/5 hover:bg-slate-500/5">
                        <td className="p-3">
                          <div className="font-bold">{r.reported?.email || 'Guest Stranger'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{r.reportedId}</div>
                        </td>
                        <td className="p-3 font-medium text-slate-300">{r.reason}</td>
                        <td className="p-3 text-slate-400">{r.reporter?.email || 'Guest Stranger'}</td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => handleResolveReport(r.id, 'APPROVED')}
                            className="p-1 rounded bg-emerald-600/15 text-emerald-400 hover:bg-emerald-600/20"
                            title="Approve report"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleResolveReport(r.id, 'REJECTED')}
                            className="p-1 rounded bg-rose-600/15 text-rose-400 hover:bg-rose-600/20"
                            title="Dismiss report"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {reports.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-500 italic">No pending reports logs found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: APPEALS QUEUE */}
          {activeTab === 'appeals' && (
            <div className="space-y-4 max-w-4xl">
              <div className="overflow-x-auto rounded-2xl border border-slate-500/10">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-500/5 text-slate-400 font-bold border-b border-slate-500/10">
                      <th className="p-3">User</th>
                      <th className="p-3">Reason / Case details</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appeals.map((a) => (
                      <tr key={a.id} className="border-b border-slate-500/5 hover:bg-slate-500/5">
                        <td className="p-3 font-bold">{a.user?.email || 'Guest Stranger'}</td>
                        <td className="p-3 font-medium text-slate-300">{a.reason}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            a.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' : a.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                          }`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          {a.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleResolveAppeal(a.id, 'APPROVED')}
                                className="p-1 rounded bg-emerald-600/15 text-emerald-400 hover:bg-emerald-600/20"
                                title="Approve Appeal"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleResolveAppeal(a.id, 'REJECTED')}
                                className="p-1 rounded bg-rose-600/15 text-rose-400 hover:bg-rose-600/20"
                                title="Reject Appeal"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                    {appeals.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-500 italic">No user appeals logs found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: FEEDBACKS */}
          {activeTab === 'feedback' && (
            <div className="space-y-4 max-w-4xl">
              <div className="overflow-x-auto rounded-2xl border border-slate-500/10">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-500/5 text-slate-400 font-bold border-b border-slate-500/10">
                      <th className="p-3">User</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Message</th>
                      <th className="p-3">Submitted At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedbacks.map((f) => (
                      <tr key={f.id} className="border-b border-slate-500/5 hover:bg-slate-500/5">
                        <td className="p-3 font-bold">{f.user?.email || 'Guest Stranger'}</td>
                        <td className="p-3 font-bold text-indigo-400">{f.category}</td>
                        <td className="p-3 text-slate-300 font-medium">{f.message}</td>
                        <td className="p-3 text-slate-500">{new Date(f.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {feedbacks.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-500 italic">No user feedbacks found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
