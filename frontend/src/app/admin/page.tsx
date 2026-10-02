"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '../../store/chatStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Users, AlertOctagon, Settings, Cpu, Megaphone,
  MessageSquare, Database, Check, X, RefreshCw, Send, Download,
  ArrowLeft, Search, ChevronLeft, ChevronRight, Crown, Ban,
  Volume2, VolumeX, Trash2, UserCog, Clock, Activity, TrendingUp, Eye
} from 'lucide-react';
import { apiFetch, getApiBase } from '@/lib/api';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Cpu },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'subscriptions', label: 'Subscriptions', icon: Crown },
  { id: 'moderation', label: 'Moderation', icon: AlertOctagon },
  { id: 'tickets', label: 'Tickets', icon: MessageSquare },
  { id: 'monitoring', label: 'Monitoring', icon: Cpu },
  { id: 'errors', label: 'Errors', icon: AlertOctagon },
  { id: 'cleanup', label: 'Cleanup', icon: Trash2 },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'audit', label: 'Audit Log', icon: Clock },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { token } = useChatStore();

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Overview
  const [dashStats, setDashStats] = useState<any>(null);

  // Users
  const [users, setUsers] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [openAction, setOpenAction] = useState<string | null>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Subscriptions
  const [subStats, setSubStats] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [grantUserId, setGrantUserId] = useState('');
  const [grantPlanId, setGrantPlanId] = useState('');

  // Moderation
  const [reports, setReports] = useState<any[]>([]);
  const [appeals, setAppeals] = useState<any[]>([]);

  // Settings
  const [config, setConfig] = useState<any>({ matchThreshold: 40, fallbackTimeout: 10 });
  const [featureFlags, setFeatureFlags] = useState<any>({ voiceEnabled: true, videoEnabled: true });
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastStatus, setBroadcastStatus] = useState('');
  const [backupStatus, setBackupStatus] = useState('');

  // Audit
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);

  // Feedback
  const [feedbacks, setFeedbacks] = useState<any[]>([]);

  // Tickets & Appeals
  const [tickets, setTickets] = useState<any[]>([]);
  const [adminAppeals, setAdminAppeals] = useState<any[]>([]);

  // Monitoring
  const [monitoring, setMonitoring] = useState<any>(null);

  // Errors
  const [errors, setErrors] = useState<any[]>([]);
  const [errorsTotal, setErrorsTotal] = useState(0);
  const [errorsPage, setErrorsPage] = useState(1);

  // Cleanup
  const [cleanupConfig, setCleanupConfig] = useState<any>({ inactive_days: '7', auto_delete_inactive: '1', auto_delete_guests: '1', guest_ttl_hours: '24' });
  const [cleanupStatus, setCleanupStatus] = useState('');

  useEffect(() => {
    if (!token) { router.push('/'); return; }
    const checkAdmin = async () => {
      try {
        const profile = await apiFetch('/api/v1/profile/me');
        if (['SUPER ADMIN', 'ADMIN', 'SENIOR MODERATOR', 'MODERATOR'].includes(profile.role?.toUpperCase())) {
          setIsAdmin(true);
        } else { router.push('/dashboard'); }
      } catch { router.push('/dashboard'); }
      finally { setCheckingRole(false); }
    };
    checkAdmin();
  }, [token, router]);

  useEffect(() => {
    if (!isAdmin) return;
    const loaders: Record<string, () => void> = {
      overview: fetchDashStats,
      users: () => { fetchUsers(); fetchRoles(); },
      subscriptions: () => { fetchSubStats(); fetchSubscriptions(); fetchPlans(); },
      moderation: () => { fetchReports(); fetchAppeals(); },
      tickets: fetchTickets,
      monitoring: fetchMonitoring,
      errors: fetchErrors,
      cleanup: fetchCleanupConfig,
      settings: () => { fetchConfig(); fetchFeatureFlags(); },
      audit: fetchAuditLogs,
      feedback: fetchFeedbacks,
    };
    loaders[activeTab]?.();
  }, [isAdmin, activeTab, userPage, userSearch, auditPage, errorsPage]);

  const safeFetch = async (path: string) => {
    try {
      const res = await fetch(`${getApiBase()}${path}`, { headers: { Authorization: `Bearer ${token}` } });
      return res.ok ? await res.json() : null;
    } catch { return null; }
  };

  const fetchDashStats = async () => { const d = await safeFetch('/api/v1/admin/dashboard-stats'); if (d) setDashStats(d); };
  const fetchUsers = async () => { const d = await safeFetch(`/api/v1/admin/users?search=${userSearch}&page=${userPage}`); if (d) { setUsers(d.users); setTotalUsers(d.total); } };
  const fetchRoles = async () => { const d = await safeFetch('/api/v1/admin/roles'); if (d) setRoles(d.roles); };
  const fetchSubStats = async () => { const d = await safeFetch('/api/v1/admin/subscriptions/stats'); if (d) setSubStats(d); };
  const fetchSubscriptions = async () => { const d = await safeFetch('/api/v1/admin/subscriptions'); if (d) setSubscriptions(d.subscriptions); };
  const fetchPlans = async () => { const d = await safeFetch('/api/v1/admin/plans'); if (d) setPlans(d.plans); };
  const fetchReports = async () => { const d = await safeFetch('/api/v1/admin/reports?status=PENDING'); if (d) setReports(d.reports); };
  const fetchAppeals = async () => { const d = await safeFetch('/api/v1/admin/appeals'); if (d) setAppeals(d.appeals); };
  const fetchConfig = async () => { const d = await safeFetch('/api/v1/admin/config'); if (d) setConfig(d); };
  const fetchFeatureFlags = async () => { const d = await safeFetch('/api/v1/admin/feature-flags'); if (d) setFeatureFlags(d); };
  const fetchAuditLogs = async () => { const d = await safeFetch(`/api/v1/admin/audit-logs?page=${auditPage}`); if (d) { setAuditLogs(d.logs); setAuditTotal(d.total); } };
  const fetchFeedbacks = async () => { const d = await safeFetch('/api/v1/admin/feedback'); if (d) setFeedbacks(d.feedbacks); };
  const fetchTickets = async () => { const d = await safeFetch('/api/v1/admin/tickets'); if (d) setTickets(d.tickets); const a = await safeFetch('/api/v1/admin/appeals'); if (a) setAdminAppeals(a.appeals); };
  const fetchMonitoring = async () => { const d = await safeFetch('/api/v1/admin/monitoring'); if (d) setMonitoring(d); };
  const fetchErrors = async () => { const d = await safeFetch(`/api/v1/admin/errors?page=${errorsPage}`); if (d) { setErrors(d.errors); setErrorsTotal(d.total); } };
  const fetchCleanupConfig = async () => { const d = await safeFetch('/api/v1/admin/cleanup/config'); if (d) setCleanupConfig(d); };

  // Actions
  const handleBanUser = async (userId: string, ban: boolean) => {
    await apiFetch(`/api/v1/admin/users/${userId}/ban`, { method: 'POST', body: JSON.stringify({ shadowBan: ban }) });
    fetchUsers();
    setOpenAction(null);
  };

  const handleMuteUser = async (userId: string) => {
    await apiFetch(`/api/v1/admin/users/${userId}/mute`, { method: 'POST', body: JSON.stringify({ duration: 3600 }) });
    setOpenAction(null);
  };

  const handleUnmuteUser = async (userId: string) => {
    await apiFetch(`/api/v1/admin/users/${userId}/unmute`, { method: 'POST' });
    setOpenAction(null);
  };

  const handleChangeRole = async (userId: string, roleName: string) => {
    await apiFetch(`/api/v1/admin/users/${userId}/role`, { method: 'POST', body: JSON.stringify({ roleName }) });
    fetchUsers();
    setOpenAction(null);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Permanently delete this user? This cannot be undone.')) return;
    await apiFetch(`/api/v1/admin/users/${userId}`, { method: 'DELETE' });
    fetchUsers();
    setOpenAction(null);
  };

  const toggleUserSelect = (userId: string) => {
    setSelectedUsers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const handleBulkBan = async () => {
    if (!confirm(`Ban ${selectedUsers.length} selected users?`)) return;
    for (const id of selectedUsers) {
      await apiFetch(`/api/v1/admin/users/${id}/ban`, { method: 'POST', body: JSON.stringify({ shadowBan: true }) });
    }
    setSelectedUsers([]);
    fetchUsers();
  };

  const handleBulkMute = async () => {
    if (!confirm(`Mute ${selectedUsers.length} selected users for 1 hour?`)) return;
    for (const id of selectedUsers) {
      await apiFetch(`/api/v1/admin/users/${id}/mute`, { method: 'POST', body: JSON.stringify({ duration: 3600 }) });
    }
    setSelectedUsers([]);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`PERMANENTLY DELETE ${selectedUsers.length} selected users? This cannot be undone.`)) return;
    for (const id of selectedUsers) {
      await apiFetch(`/api/v1/admin/users/${id}`, { method: 'DELETE' });
    }
    setSelectedUsers([]);
    fetchUsers();
  };

  const handleBulkUnban = async () => {
    if (!confirm(`Unban ${selectedUsers.length} selected users?`)) return;
    for (const id of selectedUsers) {
      await apiFetch(`/api/v1/admin/users/${id}/ban`, { method: 'POST', body: JSON.stringify({ shadowBan: false }) });
    }
    setSelectedUsers([]);
    fetchUsers();
  };

  const handleGrantSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantUserId || !grantPlanId) return;
    try {
      await apiFetch(`/api/v1/admin/subscriptions/${grantUserId}/grant`, { method: 'POST', body: JSON.stringify({ planId: grantPlanId }) });
      setGrantUserId(''); setGrantPlanId('');
      fetchSubscriptions(); fetchSubStats();
      alert('Subscription granted successfully!');
    } catch (err: any) {
      alert(`Error: ${err.message || 'Failed to grant subscription'}`);
    }
  };

  const handleResolveReport = async (reportId: string, status: 'APPROVED' | 'REJECTED') => {
    await apiFetch(`/api/v1/admin/reports/${reportId}/resolve`, { method: 'POST', body: JSON.stringify({ status, moderatorNotes: 'Handled via Admin dashboard' }) });
    fetchReports();
  };

  const handleResolveAppeal = async (appealId: string, status: 'APPROVED' | 'REJECTED') => {
    await apiFetch(`/api/v1/admin/appeals/${appealId}/resolve`, { method: 'POST', body: JSON.stringify({ status, decisionLog: 'Resolved via Admin dashboard' }) });
    fetchAppeals();
  };

  const handleConfigUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/api/v1/admin/config', { method: 'POST', body: JSON.stringify(config) });
  };

  const handleFeatureFlagToggle = async (flag: 'voiceEnabled' | 'videoEnabled') => {
    const updated = { ...featureFlags, [flag]: !featureFlags[flag] };
    setFeatureFlags(updated);
    await apiFetch('/api/v1/admin/feature-flags', { method: 'POST', body: JSON.stringify(updated) });
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;
    await apiFetch('/api/v1/admin/broadcast', { method: 'POST', body: JSON.stringify({ message: broadcastMsg }) });
    setBroadcastStatus('Broadcast sent!');
    setBroadcastMsg('');
    setTimeout(() => setBroadcastStatus(''), 3000);
  };

  const triggerBackup = async () => {
    setBackupStatus('Generating...');
    await apiFetch('/api/v1/admin/backups/export', { method: 'POST' });
    setBackupStatus('Backup created!');
    setTimeout(() => setBackupStatus(''), 3000);
  };

  if (checkingRole) {
    return (
      <div className="min-h-screen bg-[var(--color-void)] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[var(--color-signal-violet)] font-bold text-sm">
          <RefreshCw className="w-5 h-5 animate-spin" /> Verifying Administrator Access...
        </div>
      </div>
    );
  }

  const inputClass = 'w-full px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:border-[var(--color-signal-violet)]/50 outline-none transition-all text-xs';
  const btnPrimary = 'px-4 py-2 rounded-xl bg-[var(--color-signal-violet)] hover:brightness-110 text-white font-bold text-xs transition-all';
  const btnDanger = 'px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 font-bold text-[10px] transition-all';
  const btnSuccess = 'px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-bold text-[10px] transition-all';

  const StatCard = ({ label, value, icon: Icon }: { label: string; value: string | number; icon?: any }) => (
    <div className="glass-card rounded-2xl p-5 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
        {Icon && <Icon className="w-4 h-4 text-[var(--color-signal-violet)]" />}
        <span className="text-xs font-bold">{label}</span>
      </div>
      <p className="text-2xl font-black text-[var(--color-text-primary)]">{value}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--color-void)] text-[var(--color-text-primary)] flex flex-col">
      {/* Header */}
      <header className="app-header border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 sm:px-6" style={{ minHeight: '64px', paddingTop: '14px', paddingBottom: '14px' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className="p-2 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-black flex items-center gap-2">
              <Shield className="w-5 h-5 text-[var(--color-signal-violet)]" /> Admin Console
            </h1>
          </div>
          <button onClick={() => router.push('/dashboard')} className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-xs font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] transition-colors">
            Exit Console
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar */}
        <aside className="w-full lg:w-56 shrink-0 p-4 border-b lg:border-b-0 lg:border-r border-[var(--color-border)] bg-[var(--color-surface)]/40 backdrop-blur-md">
          <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible">
            {TABS.map((tab) => {
              const badge = tab.id === 'moderation' ? (reports.length + appeals.filter((a: any) => a.status === 'PENDING').length) : 0;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-[var(--color-signal-violet)] text-white shadow-lg shadow-[var(--color-signal-violet)]/20'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  <tab.icon className="w-4 h-4 shrink-0" />
                  {tab.label}
                  {badge > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-red-500/15 text-red-400'}`}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* ═══ OVERVIEW TAB ═══ */}
              {activeTab === 'overview' && dashStats && (
                <div className="space-y-6 max-w-5xl">
                  <h2 className="text-xl font-black flex items-center gap-2"><Activity className="w-5 h-5 text-[var(--color-signal-violet)]" /> Platform Overview</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <StatCard label="Total Users" value={dashStats.users.total} icon={Users} />
                    <StatCard label="Online Now" value={dashStats.users.online} icon={Activity} />
                    <StatCard label="Registered" value={dashStats.users.registered} icon={UserCog} />
                    <StatCard label="Guests" value={dashStats.users.guests} icon={Eye} />
                    <StatCard label="Paid Users" value={dashStats.users.paid} icon={Crown} />
                    <StatCard label="Banned" value={dashStats.users.banned} icon={Ban} />
                    <StatCard label="New Today" value={dashStats.users.newToday} icon={TrendingUp} />
                    <StatCard label="New This Week" value={dashStats.users.newWeek} icon={TrendingUp} />
                    <StatCard label="Pending Reports" value={dashStats.moderation.pendingReports} icon={AlertOctagon} />
                    <StatCard label="Active Subs" value={dashStats.subscriptions.active} icon={Crown} />
                  </div>
                </div>
              )}
              {activeTab === 'overview' && !dashStats && (
                <div className="flex items-center gap-2 text-[var(--color-text-secondary)] text-sm">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Loading stats...
                </div>
              )}

              {/* ═══ USERS TAB ═══ */}
              {activeTab === 'users' && (
                <div className="space-y-4 max-w-6xl">
                  <h2 className="text-xl font-black flex items-center gap-2"><Users className="w-5 h-5 text-[var(--color-signal-violet)]" /> User Management</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
                    <input type="text" value={userSearch} onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }} placeholder="Search by email, username, or ID..." className={`${inputClass} pl-9`} />
                  </div>

                  {/* Bulk Action Bar */}
                  {selectedUsers.length > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-signal-violet)]/10 border border-[var(--color-signal-violet)]/20">
                      <span className="text-xs font-bold text-[var(--color-signal-violet)]">{selectedUsers.length} selected</span>
                      <div className="flex gap-2 ml-auto">
                        <button onClick={handleBulkBan} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 font-bold text-[10px] transition-all">Ban All</button>
                        <button onClick={handleBulkUnban} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-bold text-[10px] transition-all">Unban All</button>
                        <button onClick={handleBulkMute} className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 font-bold text-[10px] transition-all">Mute All (1h)</button>
                        <button onClick={handleBulkDelete} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 font-bold text-[10px] transition-all">Delete All</button>
                        <button onClick={() => setSelectedUsers([])} className="px-3 py-1.5 rounded-lg bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] font-bold text-[10px] transition-all">Clear</button>
                      </div>
                    </div>
                  )}

                  <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] font-bold">
                            <th className="p-3 w-10">
                              <input type="checkbox" checked={selectedUsers.length === users.length && users.length > 0} onChange={toggleSelectAll} className="w-3.5 h-3.5 rounded accent-[var(--color-signal-violet)]" />
                            </th>
                            <th className="p-3">ID</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Username</th>
                            <th className="p-3">Role</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                          {users.map((u) => (
                            <tr key={u.id} className="hover:bg-[var(--color-surface-2)]/50 transition-colors">
                              <td className="p-3 w-10">
                                <input type="checkbox" checked={selectedUsers.includes(u.id)} onChange={() => toggleUserSelect(u.id)} className="w-3.5 h-3.5 rounded accent-[var(--color-signal-violet)]" />
                              </td>
                              <td className="p-3 font-mono text-[10px] text-[var(--color-text-secondary)]" title={u.id}>{u.id.slice(0, 8)}...</td>
                              <td className="p-3 font-medium">{u.email || '—'}</td>
                              <td className="p-3 text-[var(--color-text-secondary)]">{u.displayName || u.username || '—'}</td>
                              <td className="p-3"><span className="px-2 py-0.5 rounded-md bg-[var(--color-signal-violet)]/10 text-[var(--color-signal-violet)] text-[10px] font-bold">{u.role?.name || '—'}</span></td>
                              <td className="p-3 text-[var(--color-text-secondary)]">{u.userType || 'FREE'}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.isShadowBanned ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                  {u.isShadowBanned ? 'BANNED' : 'ACTIVE'}
                                </span>
                              </td>
                              <td className="p-3 text-right relative">
                                <button onClick={() => setOpenAction(openAction === u.id ? null : u.id)} className="px-2 py-1 rounded-lg bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] font-bold text-[10px] transition-colors">
                                  Actions ▾
                                </button>
                                {openAction === u.id && (
                                  <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl z-50 py-1 backdrop-blur-xl">
                                    <button onClick={() => handleBanUser(u.id, !u.isShadowBanned)} className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--color-surface-2)] flex items-center gap-2 transition-colors">
                                      <Ban className="w-3.5 h-3.5" /> {u.isShadowBanned ? 'Unban User' : 'Ban User'}
                                    </button>
                                    <button onClick={() => handleMuteUser(u.id)} className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--color-surface-2)] flex items-center gap-2 transition-colors">
                                      <VolumeX className="w-3.5 h-3.5" /> Mute (1h)
                                    </button>
                                    <button onClick={() => handleUnmuteUser(u.id)} className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--color-surface-2)] flex items-center gap-2 transition-colors">
                                      <Volume2 className="w-3.5 h-3.5" /> Unmute
                                    </button>
                                    <div className="border-t border-[var(--color-border)] my-1" />
                                    <div className="px-3 py-2">
                                      <label className="text-[10px] text-[var(--color-text-secondary)] font-bold block mb-1">Change Role</label>
                                      <select onChange={(e) => { if (e.target.value) handleChangeRole(u.id, e.target.value); }} defaultValue="" className="w-full text-xs bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-2 py-1 text-[var(--color-text-primary)]">
                                        <option value="" disabled>Select role...</option>
                                        {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                                      </select>
                                    </div>
                                    <div className="border-t border-[var(--color-border)] my-1" />
                                    <button onClick={() => handleDeleteUser(u.id)} className="w-full text-left px-3 py-2 text-xs hover:bg-red-500/10 text-red-400 flex items-center gap-2 transition-colors">
                                      <Trash2 className="w-3.5 h-3.5" /> Delete User
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                          {users.length === 0 && (
                            <tr><td colSpan={8} className="p-6 text-center text-[var(--color-text-secondary)] italic">No users found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)] font-medium">
                    <span>{totalUsers} total users</span>
                    <div className="flex items-center gap-2">
                      <button disabled={userPage === 1} onClick={() => setUserPage(userPage - 1)} className="p-1.5 rounded-lg bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] disabled:opacity-40 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                      <span className="px-2">Page {userPage}</span>
                      <button disabled={users.length < 20} onClick={() => setUserPage(userPage + 1)} className="p-1.5 rounded-lg bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] disabled:opacity-40 transition-colors"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ SUBSCRIPTIONS TAB ═══ */}
              {activeTab === 'subscriptions' && (
                <div className="space-y-6 max-w-5xl">
                  <h2 className="text-xl font-black flex items-center gap-2"><Crown className="w-5 h-5 text-[var(--color-signal-violet)]" /> Subscriptions</h2>

                  {subStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <StatCard label="Active" value={subStats.active} icon={Check} />
                      <StatCard label="Expired" value={subStats.expired} icon={Clock} />
                      <StatCard label="Cancelled" value={subStats.cancelled} icon={X} />
                      <StatCard label="Total" value={subStats.total} icon={Database} />
                    </div>
                  )}

                  {/* Plans Section */}
                  <div className="glass-card rounded-2xl p-6">
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Settings className="w-4 h-4 text-[var(--color-signal-violet)]" /> Plans</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {plans.map((plan) => (
                        <div key={plan.id} className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-surface-2)]/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-sm">{plan.type}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${plan.isActive !== false ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                              {plan.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--color-text-secondary)]">₹{plan.priceInr} / {plan.validityDays} days</p>
                          <p className="text-[10px] text-[var(--color-text-secondary)] mt-1">Voice: {plan.isVoiceEnabled ? '✓' : '✗'} | Video: {plan.isVideoEnabled ? '✓' : '✗'}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Grant Subscription */}
                  <div className="glass-card rounded-2xl p-6">
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Send className="w-4 h-4 text-[var(--color-signal-violet)]" /> Grant Subscription</h3>
                    <form onSubmit={handleGrantSub} className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-[var(--color-text-secondary)] mb-1">Select User</label>
                        <select value={grantUserId} onChange={(e) => setGrantUserId(e.target.value)} className={inputClass}>
                          <option value="">Choose a user...</option>
                          {users.map(u => <option key={u.id} value={u.id}>{u.email || u.displayName || 'Guest'} ({u.id.slice(0, 8)}...)</option>)}
                        </select>
                        <p className="text-[9px] text-[var(--color-text-secondary)] mt-1">Or paste a User ID directly:</p>
                        <input type="text" value={grantUserId} onChange={(e) => setGrantUserId(e.target.value)} placeholder="e.g. 2c2bd7ad-5c13-4053-8201-b128c09c84da" className={`${inputClass} mt-1`} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[var(--color-text-secondary)] mb-1">Plan</label>
                        <select value={grantPlanId} onChange={(e) => setGrantPlanId(e.target.value)} className={inputClass}>
                          <option value="">Select plan...</option>
                          {plans.map(p => <option key={p.id} value={p.id}>{p.type} — ₹{p.priceInr} / {p.validityDays} day{p.validityDays > 1 ? 's' : ''}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center gap-3">
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={!grantUserId || !grantPlanId} className={`${btnPrimary} disabled:opacity-40 disabled:cursor-not-allowed`}>Grant Subscription</motion.button>
                        {grantUserId && <span className="text-[9px] text-[var(--color-text-secondary)] font-mono">ID: {grantUserId.slice(0, 16)}...</span>}
                      </div>
                    </form>
                  </div>

                  {/* Subscriptions List */}
                  <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] font-bold">
                            <th className="p-3">User</th>
                            <th className="p-3">Plan</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Expires</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                          {subscriptions.slice(0, 20).map((sub) => (
                            <tr key={sub.id} className="hover:bg-[var(--color-surface-2)]/50 transition-colors">
                              <td className="p-3 font-medium">{sub.user?.email || sub.userId?.slice(0, 8)}</td>
                              <td className="p-3 text-[var(--color-signal-violet)] font-bold">{sub.plan?.type || '—'}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sub.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : sub.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                  {sub.status}
                                </span>
                              </td>
                              <td className="p-3 text-[var(--color-text-secondary)]">{sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString() : '—'}</td>
                            </tr>
                          ))}
                          {subscriptions.length === 0 && (
                            <tr><td colSpan={4} className="p-6 text-center text-[var(--color-text-secondary)] italic">No subscriptions found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ MODERATION TAB ═══ */}
              {activeTab === 'moderation' && (
                <div className="space-y-8 max-w-5xl">
                  <h2 className="text-xl font-black flex items-center gap-2"><AlertOctagon className="w-5 h-5 text-[var(--color-signal-violet)]" /> Moderation Queue</h2>

                  {/* Reports */}
                  <div>
                    <h3 className="text-sm font-bold mb-3 text-[var(--color-text-secondary)]">Pending Reports ({reports.length})</h3>
                    <div className="glass-card rounded-2xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] font-bold">
                              <th className="p-3">Reported User</th>
                              <th className="p-3">Reason</th>
                              <th className="p-3">Reporter</th>
                              <th className="p-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--color-border)]">
                            {reports.map((r) => (
                              <tr key={r.id} className="hover:bg-[var(--color-surface-2)]/50 transition-colors">
                                <td className="p-3">
                                  <div className="font-bold">{r.reported?.email || 'Guest'}</div>
                                  <div className="text-[10px] text-[var(--color-text-secondary)] font-mono">{r.reportedId?.slice(0, 8)}</div>
                                </td>
                                <td className="p-3 text-[var(--color-text-secondary)] max-w-xs">{r.reason}</td>
                                <td className="p-3 text-[var(--color-text-secondary)]">{r.reporter?.email || 'Guest'}</td>
                                <td className="p-3 text-right space-x-1">
                                  <button onClick={() => handleResolveReport(r.id, 'APPROVED')} className={btnSuccess} title="Approve (take action)"><Check className="w-3.5 h-3.5 inline" /> Approve</button>
                                  <button onClick={() => handleResolveReport(r.id, 'REJECTED')} className={btnDanger} title="Dismiss"><X className="w-3.5 h-3.5 inline" /> Dismiss</button>
                                </td>
                              </tr>
                            ))}
                            {reports.length === 0 && (
                              <tr><td colSpan={4} className="p-6 text-center text-[var(--color-text-secondary)] italic">No pending reports.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Appeals */}
                  <div>
                    <h3 className="text-sm font-bold mb-3 text-[var(--color-text-secondary)]">Pending Appeals ({appeals.filter(a => a.status === 'PENDING').length})</h3>
                    <div className="glass-card rounded-2xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] font-bold">
                              <th className="p-3">User</th>
                              <th className="p-3">Reason</th>
                              <th className="p-3">Status</th>
                              <th className="p-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--color-border)]">
                            {appeals.map((a) => (
                              <tr key={a.id} className="hover:bg-[var(--color-surface-2)]/50 transition-colors">
                                <td className="p-3 font-bold">{a.user?.email || 'Guest'}</td>
                                <td className="p-3 text-[var(--color-text-secondary)] max-w-xs">{a.reason}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${a.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400' : a.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {a.status}
                                  </span>
                                </td>
                                <td className="p-3 text-right space-x-1">
                                  {a.status === 'PENDING' && (
                                    <>
                                      <button onClick={() => handleResolveAppeal(a.id, 'APPROVED')} className={btnSuccess}><Check className="w-3.5 h-3.5 inline" /> Approve</button>
                                      <button onClick={() => handleResolveAppeal(a.id, 'REJECTED')} className={btnDanger}><X className="w-3.5 h-3.5 inline" /> Reject</button>
                                    </>
                                  )}
                                </td>
                              </tr>
                            ))}
                            {appeals.length === 0 && (
                              <tr><td colSpan={4} className="p-6 text-center text-[var(--color-text-secondary)] italic">No appeals found.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ SETTINGS TAB ═══ */}
              {activeTab === 'settings' && (
                <div className="space-y-6 max-w-4xl">
                  <h2 className="text-xl font-black flex items-center gap-2"><Settings className="w-5 h-5 text-[var(--color-signal-violet)]" /> Platform Settings</h2>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Config */}
                    <div className="glass-card rounded-2xl p-6">
                      <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Cpu className="w-4 h-4 text-[var(--color-signal-violet)]" /> Matchmaking Config</h3>
                      <form onSubmit={handleConfigUpdate} className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-[var(--color-text-secondary)] mb-1">Match Score Threshold</label>
                          <input type="number" value={config.matchThreshold} onChange={(e) => setConfig({ ...config, matchThreshold: parseInt(e.target.value) })} className={inputClass} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[var(--color-text-secondary)] mb-1">Fallback Timeout (sec)</label>
                          <input type="number" value={config.fallbackTimeout} onChange={(e) => setConfig({ ...config, fallbackTimeout: parseInt(e.target.value) })} className={inputClass} />
                        </div>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className={btnPrimary}>Save Config</motion.button>
                      </form>
                    </div>

                    {/* Feature Access Control */}
                    <div className="glass-card rounded-2xl p-6">
                      <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-[var(--color-signal-violet)]" /> Feature Access Control</h3>
                      <p className="text-[10px] text-[var(--color-text-secondary)] mb-4">Control whether features are free for all, premium-only, or disabled.</p>
                      <div className="space-y-3">
                        {[
                          { key: 'voiceMode', label: 'Voice Calls', icon: Volume2 },
                          { key: 'videoMode', label: 'Video Calls', icon: Eye },
                          { key: 'imageMode', label: 'Image Sharing', icon: Send },
                          { key: 'genderFilterMode', label: 'Gender Filter', icon: Users },
                        ].map((feat) => (
                          <div key={feat.key} className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-surface-2)]/50">
                            <div className="flex items-center gap-2">
                              <feat.icon className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
                              <span className="text-xs font-bold text-[var(--color-text-primary)]">{feat.label}</span>
                            </div>
                            <select
                              value={(featureFlags as any)[feat.key] || 'premium'}
                              onChange={(e) => {
                                const newFlags = { ...featureFlags, [feat.key]: e.target.value };
                                setFeatureFlags(newFlags);
                                apiFetch('/api/v1/admin/feature-flags', { method: 'POST', body: JSON.stringify({ [feat.key]: e.target.value }) });
                              }}
                              className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] outline-none"
                            >
                              <option value="free">Free for All</option>
                              <option value="premium">Premium Only</option>
                              <option value="disabled">Disabled</option>
                            </select>
                          </div>
                        ))}
                        <div className="border-t border-[var(--color-border)] pt-3 mt-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[var(--color-text-primary)]">Guest Access</span>
                            <button onClick={() => {
                              const v = !featureFlags.guestAccess;
                              setFeatureFlags({ ...featureFlags, guestAccess: v });
                              apiFetch('/api/v1/admin/feature-flags', { method: 'POST', body: JSON.stringify({ guestAccess: v }) });
                            }} className={`w-10 h-5 rounded-full transition-colors relative ${featureFlags.guestAccess !== false ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border)]'}`}>
                              <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${featureFlags.guestAccess !== false ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[var(--color-text-primary)]">Registration Required for Chat</span>
                            <button onClick={() => {
                              const v = !featureFlags.registrationRequired;
                              setFeatureFlags({ ...featureFlags, registrationRequired: v });
                              apiFetch('/api/v1/admin/feature-flags', { method: 'POST', body: JSON.stringify({ registrationRequired: v }) });
                            }} className={`w-10 h-5 rounded-full transition-colors relative ${featureFlags.registrationRequired ? 'bg-[var(--color-signal-violet)]' : 'bg-[var(--color-border)]'}`}>
                              <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${featureFlags.registrationRequired ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Broadcast */}
                    <div className="glass-card rounded-2xl p-6">
                      <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Megaphone className="w-4 h-4 text-[var(--color-signal-violet)]" /> Broadcast Message</h3>
                      <form onSubmit={handleBroadcast} className="space-y-3">
                        <input type="text" value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} placeholder="Type announcement..." className={inputClass} />
                        {broadcastStatus && <div className="text-[10px] text-emerald-400 font-bold">{broadcastStatus}</div>}
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className={`${btnPrimary} flex items-center gap-1.5`}><Send className="w-3.5 h-3.5" /> Broadcast</motion.button>
                      </form>
                    </div>

                    {/* Backup */}
                    <div className="glass-card rounded-2xl p-6">
                      <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Database className="w-4 h-4 text-[var(--color-signal-violet)]" /> Database Backup</h3>
                      <p className="text-xs text-[var(--color-text-secondary)] mb-3">Export JSON backup of users, reports, and audit logs.</p>
                      {backupStatus && <div className="text-[10px] text-emerald-400 font-bold mb-2">{backupStatus}</div>}
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={triggerBackup} className={`${btnPrimary} flex items-center gap-1.5`}><Download className="w-3.5 h-3.5" /> Trigger Backup</motion.button>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ AUDIT LOG TAB ═══ */}
              {activeTab === 'audit' && (
                <div className="space-y-4 max-w-5xl">
                  <h2 className="text-xl font-black flex items-center gap-2"><Clock className="w-5 h-5 text-[var(--color-signal-violet)]" /> Audit Log</h2>

                  <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] font-bold">
                            <th className="p-3">Action</th>
                            <th className="p-3">Description</th>
                            <th className="p-3">User</th>
                            <th className="p-3">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                          {auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-[var(--color-surface-2)]/50 transition-colors">
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded-md bg-[var(--color-signal-violet)]/10 text-[var(--color-signal-violet)] text-[10px] font-bold">
                                  {log.action}
                                </span>
                              </td>
                              <td className="p-3 text-[var(--color-text-secondary)] max-w-sm truncate">{log.description}</td>
                              <td className="p-3 text-[var(--color-text-secondary)]">{log.user?.email || log.user?.displayName || '—'}</td>
                              <td className="p-3 text-[var(--color-text-secondary)] whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                            </tr>
                          ))}
                          {auditLogs.length === 0 && (
                            <tr><td colSpan={4} className="p-6 text-center text-[var(--color-text-secondary)] italic">No audit entries.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)] font-medium">
                    <span>{auditTotal} entries</span>
                    <div className="flex items-center gap-2">
                      <button disabled={auditPage === 1} onClick={() => setAuditPage(auditPage - 1)} className="p-1.5 rounded-lg bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] disabled:opacity-40 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                      <span className="px-2">Page {auditPage}</span>
                      <button disabled={auditLogs.length < 50} onClick={() => setAuditPage(auditPage + 1)} className="p-1.5 rounded-lg bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] disabled:opacity-40 transition-colors"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ FEEDBACK TAB ═══ */}
              {activeTab === 'feedback' && (
                <div className="space-y-4 max-w-5xl">
                  <h2 className="text-xl font-black flex items-center gap-2"><MessageSquare className="w-5 h-5 text-[var(--color-signal-violet)]" /> User Feedback</h2>

                  <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] font-bold">
                            <th className="p-3">User</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Message</th>
                            <th className="p-3">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                          {feedbacks.map((f) => (
                            <tr key={f.id} className="hover:bg-[var(--color-surface-2)]/50 transition-colors">
                              <td className="p-3 font-medium">{f.user?.email || 'Guest'}</td>
                              <td className="p-3"><span className="px-2 py-0.5 rounded-md bg-[var(--color-signal-violet)]/10 text-[var(--color-signal-violet)] text-[10px] font-bold">{f.category}</span></td>
                              <td className="p-3 text-[var(--color-text-secondary)] max-w-sm truncate">{f.message}</td>
                              <td className="p-3 text-[var(--color-text-secondary)] whitespace-nowrap">{new Date(f.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                          {feedbacks.length === 0 && (
                            <tr><td colSpan={4} className="p-6 text-center text-[var(--color-text-secondary)] italic">No feedback submitted yet.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ TICKETS TAB ═══ */}
              {activeTab === 'tickets' && (
                <div className="space-y-6 max-w-6xl">
                  <h2 className="text-xl font-black flex items-center gap-2"><MessageSquare className="w-5 h-5 text-[var(--color-signal-violet)]" /> Support Tickets & Appeals</h2>
                  
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Tickets ({tickets.length})</h3>
                  <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead><tr className="bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] font-bold">
                          <th className="p-3">User</th><th className="p-3">Subject</th><th className="p-3">Category</th><th className="p-3">Priority</th><th className="p-3">Status</th><th className="p-3">Date</th><th className="p-3">Actions</th>
                        </tr></thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                          {tickets.map((t: any) => (
                            <tr key={t.id} className="hover:bg-[var(--color-surface-2)]/50">
                              <td className="p-3 font-medium">{t.user?.username || t.user?.email || '?'}</td>
                              <td className="p-3 max-w-[200px] truncate">{t.subject}</td>
                              <td className="p-3"><span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-bold">{t.category}</span></td>
                              <td className="p-3"><span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${t.priority === 'URGENT' ? 'bg-red-500/10 text-red-400' : t.priority === 'HIGH' ? 'bg-amber-500/10 text-amber-400' : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]'}`}>{t.priority}</span></td>
                              <td className="p-3"><span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${t.status === 'OPEN' ? 'bg-green-500/10 text-green-400' : t.status === 'RESOLVED' ? 'bg-[var(--color-signal-violet)]/10 text-[var(--color-signal-violet)]' : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]'}`}>{t.status}</span></td>
                              <td className="p-3 whitespace-nowrap text-[var(--color-text-secondary)]">{new Date(t.createdAt).toLocaleDateString()}</td>
                              <td className="p-3">
                                <select onChange={(e) => { safeFetch(`/api/v1/admin/tickets/${t.id}`); apiFetch(`/api/v1/admin/tickets/${t.id}`, { method: 'PUT', body: JSON.stringify({ status: e.target.value }) }).then(fetchTickets); }} defaultValue={t.status} className="text-[10px] bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded px-1 py-0.5 text-[var(--color-text-primary)]">
                                  <option value="OPEN">Open</option><option value="IN_PROGRESS">In Progress</option><option value="RESOLVED">Resolved</option><option value="CLOSED">Closed</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                          {tickets.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-[var(--color-text-secondary)] italic">No tickets.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-[var(--color-text-primary)] mt-6">Appeals ({adminAppeals.length})</h3>
                  <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead><tr className="bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] font-bold">
                          <th className="p-3">User</th><th className="p-3">Reason</th><th className="p-3">Status</th><th className="p-3">Date</th><th className="p-3">Actions</th>
                        </tr></thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                          {adminAppeals.map((a: any) => (
                            <tr key={a.id} className="hover:bg-[var(--color-surface-2)]/50">
                              <td className="p-3 font-medium">{a.user?.username || a.user?.email || '?'} {a.user?.isShadowBanned && <span className="text-red-400 text-[9px]">(Banned)</span>}</td>
                              <td className="p-3 max-w-[300px] truncate text-[var(--color-text-secondary)]">{a.reason}</td>
                              <td className="p-3"><span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${a.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' : a.status === 'APPROVED' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{a.status}</span></td>
                              <td className="p-3 whitespace-nowrap text-[var(--color-text-secondary)]">{new Date(a.createdAt).toLocaleDateString()}</td>
                              <td className="p-3 flex gap-1">
                                {a.status === 'PENDING' && <>
                                  <button onClick={() => apiFetch(`/api/v1/admin/appeals/${a.id}`, { method: 'PUT', body: JSON.stringify({ status: 'APPROVED', unbanUser: true }) }).then(fetchTickets)} className="px-2 py-1 rounded bg-green-500/10 text-green-400 text-[10px] font-bold hover:bg-green-500/20">Approve</button>
                                  <button onClick={() => apiFetch(`/api/v1/admin/appeals/${a.id}`, { method: 'PUT', body: JSON.stringify({ status: 'REJECTED' }) }).then(fetchTickets)} className="px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-bold hover:bg-red-500/20">Reject</button>
                                </>}
                              </td>
                            </tr>
                          ))}
                          {adminAppeals.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-[var(--color-text-secondary)] italic">No appeals.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ MONITORING TAB ═══ */}
              {activeTab === 'monitoring' && (
                <div className="space-y-6 max-w-5xl">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black flex items-center gap-2"><Cpu className="w-5 h-5 text-[var(--color-signal-violet)]" /> System Monitoring</h2>
                    <button onClick={fetchMonitoring} className="px-3 py-1.5 rounded-lg bg-[var(--color-surface-2)] text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]"><RefreshCw className="w-3 h-3 inline mr-1" />Refresh</button>
                  </div>
                  {monitoring ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                        <p className="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold mb-1">Memory</p>
                        <p className="text-2xl font-black text-[var(--color-text-primary)]">{monitoring.memory.usedPercent}%</p>
                        <p className="text-[10px] text-[var(--color-text-secondary)]">{monitoring.memory.usedGB}/{monitoring.memory.totalGB} GB</p>
                      </div>
                      <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                        <p className="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold mb-1">CPU</p>
                        <p className="text-2xl font-black text-[var(--color-text-primary)]">{monitoring.cpu.usagePercent}%</p>
                        <p className="text-[10px] text-[var(--color-text-secondary)]">{monitoring.cpu.cores} cores · Load: {monitoring.cpu.loadAvg[0]}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                        <p className="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold mb-1">Uptime</p>
                        <p className="text-2xl font-black text-[var(--color-text-primary)]">{monitoring.system.uptimeFormatted}</p>
                        <p className="text-[10px] text-[var(--color-text-secondary)]">{monitoring.system.platform} · {monitoring.system.arch}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                        <p className="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold mb-1">Process</p>
                        <p className="text-2xl font-black text-[var(--color-text-primary)]">{monitoring.process.rssMB}MB</p>
                        <p className="text-[10px] text-[var(--color-text-secondary)]">Heap: {monitoring.process.heapUsedMB}MB · Redis: {monitoring.redis.usedMemory}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                        <p className="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold mb-1">Users</p>
                        <p className="text-2xl font-black text-[var(--color-text-primary)]">{monitoring.database.totalUsers}</p>
                        <p className="text-[10px] text-green-400">{monitoring.database.onlineUsers} online</p>
                      </div>
                      <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                        <p className="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold mb-1">Messages</p>
                        <p className="text-2xl font-black text-[var(--color-text-primary)]">{monitoring.database.totalMessages}</p>
                        <p className="text-[10px] text-[var(--color-text-secondary)]">{monitoring.database.totalRooms} rooms</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--color-text-secondary)]">Loading...</p>
                  )}
                </div>
              )}

              {/* ═══ ERRORS TAB ═══ */}
              {activeTab === 'errors' && (
                <div className="space-y-4 max-w-6xl">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black flex items-center gap-2"><AlertOctagon className="w-5 h-5 text-red-400" /> Error Logs ({errorsTotal})</h2>
                    <button onClick={() => apiFetch('/api/v1/admin/errors/clear', { method: 'DELETE' }).then(fetchErrors)} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-xs font-bold text-red-400 hover:bg-red-500/20 border border-red-500/20">Clear All</button>
                  </div>
                  <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead><tr className="bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] font-bold">
                          <th className="p-3">Time</th><th className="p-3">Route</th><th className="p-3">Method</th><th className="p-3">Status</th><th className="p-3">Message</th><th className="p-3">User</th>
                        </tr></thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                          {errors.map((e: any) => (
                            <tr key={e.id} className="hover:bg-[var(--color-surface-2)]/50">
                              <td className="p-3 whitespace-nowrap text-[var(--color-text-secondary)]">{new Date(e.createdAt).toLocaleString()}</td>
                              <td className="p-3 font-mono text-[10px]">{e.route}</td>
                              <td className="p-3"><span className="px-1.5 py-0.5 rounded bg-[var(--color-surface-2)] text-[10px] font-bold">{e.method}</span></td>
                              <td className="p-3"><span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] font-bold">{e.statusCode}</span></td>
                              <td className="p-3 max-w-[300px] truncate text-red-300">{e.message}</td>
                              <td className="p-3 text-[var(--color-text-secondary)]">{e.userId?.slice(0, 8) || '-'}</td>
                            </tr>
                          ))}
                          {errors.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-[var(--color-text-secondary)] italic">No errors logged.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {errorsTotal > 50 && (
                    <div className="flex justify-center gap-2">
                      <button disabled={errorsPage <= 1} onClick={() => setErrorsPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-[var(--color-surface-2)] text-xs disabled:opacity-50"><ChevronLeft className="w-3 h-3 inline" /></button>
                      <span className="text-xs text-[var(--color-text-secondary)] py-1.5">Page {errorsPage}</span>
                      <button onClick={() => setErrorsPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-[var(--color-surface-2)] text-xs"><ChevronRight className="w-3 h-3 inline" /></button>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ CLEANUP TAB ═══ */}
              {activeTab === 'cleanup' && (
                <div className="space-y-6 max-w-3xl">
                  <h2 className="text-xl font-black flex items-center gap-2"><Trash2 className="w-5 h-5 text-[var(--color-signal-violet)]" /> Data Cleanup Controls</h2>

                  <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-4">
                    <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Configuration</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-[var(--color-text-secondary)] block mb-1">Inactive Days (before deletion)</label>
                        <input type="number" value={cleanupConfig.inactive_days} onChange={(e) => setCleanupConfig({...cleanupConfig, inactive_days: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)]" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[var(--color-text-secondary)] block mb-1">Guest TTL (hours)</label>
                        <input type="number" value={cleanupConfig.guest_ttl_hours} onChange={(e) => setCleanupConfig({...cleanupConfig, guest_ttl_hours: e.target.value})} className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)]" />
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={cleanupConfig.auto_delete_inactive === '1'} onChange={(e) => setCleanupConfig({...cleanupConfig, auto_delete_inactive: e.target.checked ? '1' : '0'})} className="rounded" />
                        <label className="text-xs text-[var(--color-text-secondary)]">Auto-delete inactive accounts</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={cleanupConfig.auto_delete_guests === '1'} onChange={(e) => setCleanupConfig({...cleanupConfig, auto_delete_guests: e.target.checked ? '1' : '0'})} className="rounded" />
                        <label className="text-xs text-[var(--color-text-secondary)]">Auto-delete stale guests</label>
                      </div>
                    </div>
                    <button onClick={() => apiFetch('/api/v1/admin/cleanup/config', { method: 'PUT', body: JSON.stringify(cleanupConfig) }).then(() => setCleanupStatus('Config saved!'))} className="px-4 py-2 rounded-lg bg-[var(--color-signal-violet)] text-white text-xs font-bold hover:brightness-110">Save Config</button>
                    {cleanupStatus && <p className="text-xs text-green-400">{cleanupStatus}</p>}
                  </div>

                  <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-4">
                    <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Manual Cleanup</h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">Run cleanup tasks manually. This will immediately delete matching records.</p>
                    <div className="flex gap-3">
                      <button onClick={() => apiFetch('/api/v1/admin/cleanup/run', { method: 'POST', body: JSON.stringify({ action: 'guests' }) }).then((d: any) => setCleanupStatus(`Deleted ${d?.guestsDeleted || 0} guests`))} className="px-4 py-2 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-bold hover:bg-amber-500/20 border border-amber-500/20">Clean Guests</button>
                      <button onClick={() => apiFetch('/api/v1/admin/cleanup/run', { method: 'POST', body: JSON.stringify({ action: 'inactive' }) }).then((d: any) => setCleanupStatus(`Deleted ${d?.inactiveDeleted || 0} inactive`))} className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 border border-red-500/20">Clean Inactive</button>
                      <button onClick={() => apiFetch('/api/v1/admin/cleanup/run', { method: 'POST', body: JSON.stringify({ action: 'all' }) }).then((d: any) => setCleanupStatus(`Guests: ${d?.guestsDeleted || 0}, Inactive: ${d?.inactiveDeleted || 0}`))} className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 border border-red-500/20">Clean All</button>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
