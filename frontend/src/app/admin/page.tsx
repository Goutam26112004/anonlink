"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '../../store/chatStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Users, AlertOctagon, Settings, Cpu, Megaphone, 
  MessageSquare, Database, Check, X, RefreshCw, Send, Download,
  ArrowLeft, Search, ChevronLeft, ChevronRight
} from 'lucide-react';
import { NetworkGraph } from '../../components/illustrations/NetworkGraph';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

const TABS = [
  { id: 'stats', label: 'Overview', icon: Cpu },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'reports', label: 'Reports', icon: AlertOctagon },
  { id: 'appeals', label: 'Appeals', icon: RefreshCw },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { token } = useChatStore();

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('stats');

  const [sysStats, setSysStats] = useState<any>(null);
  const [config, setConfig] = useState<any>({ matchThreshold: 40, fallbackTimeout: 10 });
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastStatus, setBroadcastStatus] = useState('');
  const [backupStatus, setBackupStatus] = useState('');

  const [users, setUsers] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');

  const [reports, setReports] = useState<any[]>([]);
  const [appeals, setAppeals] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);

  useEffect(() => {
    if (!token) { router.push('/'); return; }
    const checkAdmin = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/profile/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const profile = await res.json();
          if (['SUPER ADMIN', 'ADMIN', 'SENIOR MODERATOR', 'MODERATOR'].includes(profile.role?.toUpperCase())) {
            setIsAdmin(true);
          } else { router.push('/dashboard'); }
        } else { router.push('/dashboard'); }
      } catch { router.push('/dashboard'); }
      finally { setCheckingRole(false); }
    };
    checkAdmin();
  }, [token, router]);

  useEffect(() => {
    if (!isAdmin) return;
    const loaders: Record<string, () => void> = {
      stats: () => { fetchStats(); fetchConfig(); },
      users: fetchUsers,
      reports: fetchReports,
      appeals: fetchAppeals,
      feedback: fetchFeedbacks,
    };
    loaders[activeTab]?.();
  }, [isAdmin, activeTab, userPage, userSearch]);

  const apiFetch = async (url: string) => {
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      return res.ok ? await res.json() : null;
    } catch { return null; }
  };

  const fetchStats = async () => { const d = await apiFetch(`${BACKEND_URL}/api/v1/admin/system/stats`); if (d) setSysStats(d); };
  const fetchConfig = async () => { const d = await apiFetch(`${BACKEND_URL}/api/v1/admin/config`); if (d) setConfig(d); };
  const fetchUsers = async () => { const d = await apiFetch(`${BACKEND_URL}/api/v1/admin/users?search=${userSearch}&page=${userPage}`); if (d) { setUsers(d.users); setTotalUsers(d.total); } };
  const fetchReports = async () => { const d = await apiFetch(`${BACKEND_URL}/api/v1/admin/reports?status=PENDING`); if (d) setReports(d.reports); };
  const fetchAppeals = async () => { const d = await apiFetch(`${BACKEND_URL}/api/v1/admin/appeals`); if (d) setAppeals(d.appeals); };
  const fetchFeedbacks = async () => { const d = await apiFetch(`${BACKEND_URL}/api/v1/admin/feedback`); if (d) setFeedbacks(d.feedbacks); };

  const handleConfigUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${BACKEND_URL}/api/v1/admin/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(config),
    });
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;
    const res = await fetch(`${BACKEND_URL}/api/v1/admin/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: broadcastMsg }),
    });
    if (res.ok) { setBroadcastStatus('Broadcast sent!'); setBroadcastMsg(''); }
  };

  const triggerBackup = async () => {
    setBackupStatus('Generating...');
    const res = await fetch(`${BACKEND_URL}/api/v1/admin/backups/export`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }
    });
    setBackupStatus(res.ok ? `Backup created` : 'Backup failed');
  };

  const handleBanUser = async (userId: string, shadowBan: boolean) => {
    await fetch(`${BACKEND_URL}/api/v1/admin/users/${userId}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ shadowBan }),
    });
    fetchUsers();
  };

  const handleResolveReport = async (reportId: string, status: 'APPROVED' | 'REJECTED') => {
    await fetch(`${BACKEND_URL}/api/v1/admin/reports/${reportId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, moderatorNotes: 'Handled via Admin dashboard' }),
    });
    fetchReports();
  };

  const handleResolveAppeal = async (appealId: string, status: 'APPROVED' | 'REJECTED') => {
    await fetch(`${BACKEND_URL}/api/v1/admin/appeals/${appealId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, decisionLog: 'Resolved via Admin dashboard' }),
    });
    fetchAppeals();
  };

  if (checkingRole) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[var(--brand)] font-bold text-sm">
          <RefreshCw className="w-5 h-5 animate-spin" /> Verifying Administrator Access...
        </div>
      </div>
    );
  }

  const inputClass = 'w-full px-3 py-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--brand)]/50 outline-none transition-all text-xs';

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col">
      <NetworkGraph className="absolute inset-0 opacity-[0.02] pointer-events-none" />

      <header className="glass-heavy border-b border-[var(--border-primary)] px-6 py-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-black flex items-center gap-2">
            <Shield className="w-5 h-5 text-[var(--brand)]" /> Admin Console
          </h1>
        </div>
        <button onClick={() => router.push('/dashboard')} className="px-4 py-2 rounded-xl border border-[var(--border-secondary)] text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors">
          Exit Console
        </button>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative z-10">
        <aside className="w-full lg:w-56 shrink-0 p-4 border-b lg:border-b-0 lg:border-r border-[var(--border-primary)]">
          <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible">
            {TABS.map((tab) => {
              const count = tab.id === 'reports' ? reports.length : tab.id === 'appeals' ? appeals.filter((a: any) => a.status === 'PENDING').length : 0;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-[var(--brand)] text-white shadow-[var(--shadow-glow)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <tab.icon className="w-4 h-4 shrink-0" />
                  {tab.label}
                  {count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                      activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-[var(--danger-subtle)] text-[var(--danger)]'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'stats' && (
                <div className="space-y-6 max-w-4xl">
                  {sysStats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { label: 'Queue: Text', value: sysStats.queues?.text || 0 },
                        { label: 'Queue: Voice', value: sysStats.queues?.voice || 0 },
                        { label: 'Queue: Video', value: sysStats.queues?.video || 0 },
                        { label: 'OS System', value: `${sysStats.os?.platform || ''} (${sysStats.os?.cpuCount || 0} Cores)`, small: true },
                      ].map((stat) => (
                        <div key={stat.label} className="glass-card rounded-2xl p-5">
                          <p className="text-xs text-[var(--text-muted)] font-bold mb-1">{stat.label}</p>
                          {stat.small
                            ? <p className="text-sm font-bold text-[var(--brand)]">{stat.value}</p>
                            : <p className="text-2xl font-black text-[var(--brand)]">{stat.value}</p>
                          }
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="glass-card rounded-2xl p-6">
                      <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-[var(--brand)]" /> Configuration</h2>
                      <form onSubmit={handleConfigUpdate} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Match Base Score Threshold</label>
                          <input type="number" value={config.matchThreshold} onChange={(e) => setConfig({ ...config, matchThreshold: parseInt(e.target.value) })} className={inputClass} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Queue Fallback Cooldown (Sec)</label>
                          <input type="number" value={config.fallbackTimeout} onChange={(e) => setConfig({ ...config, fallbackTimeout: parseInt(e.target.value) })} className={inputClass} />
                        </div>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="px-4 py-2 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-bold text-xs transition-all">Save Config</motion.button>
                      </form>
                    </div>

                    <div className="space-y-6">
                      <div className="glass-card rounded-2xl p-6">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Megaphone className="w-5 h-5 text-[var(--brand)]" /> Announcement</h2>
                        <form onSubmit={handleBroadcast} className="space-y-3">
                          <input type="text" value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} placeholder="Type site message..." className={inputClass} />
                          {broadcastStatus && <div className="text-[10px] text-[var(--accent)] font-bold">{broadcastStatus}</div>}
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="px-4 py-2 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-bold text-xs flex items-center gap-1.5"><Send className="w-3.5 h-3.5" /> Broadcast</motion.button>
                        </form>
                      </div>

                      <div className="glass-card rounded-2xl p-6">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Database className="w-5 h-5 text-[var(--brand)]" /> Backups</h2>
                        <p className="text-xs text-[var(--text-muted)] mb-3">Generate JSON exports of user profiles, reports, and audit logs.</p>
                        {backupStatus && <div className="text-[10px] text-[var(--brand)] font-bold mb-2">{backupStatus}</div>}
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={triggerBackup} className="px-4 py-2 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-bold text-xs flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> Trigger Backup</motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div className="space-y-4 max-w-5xl">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input type="text" value={userSearch} onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }} placeholder="Search users by email or ID..." className={`${inputClass} pl-9`} />
                  </div>

                  <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-[var(--bg-tertiary)] text-[var(--text-muted)] font-bold">
                            <th className="p-3">User ID</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Role</th>
                            <th className="p-3">Rep</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-primary)]">
                          {users.map((u) => (
                            <tr key={u.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                              <td className="p-3 font-mono text-[10px] truncate max-w-[100px] text-[var(--text-secondary)]">{u.id}</td>
                              <td className="p-3 font-medium">{u.email || 'Guest'}</td>
                              <td className="p-3 font-bold text-[var(--brand)]">{u.role?.name}</td>
                              <td className="p-3 font-bold">{u.reputationScore}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  u.isShadowBanned ? 'bg-[var(--danger-subtle)] text-[var(--danger)]' : 'bg-[var(--accent-subtle)] text-[var(--accent)]'
                                }`}>
                                  {u.isShadowBanned ? 'BANNED' : 'ACTIVE'}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <button onClick={() => handleBanUser(u.id, !u.isShadowBanned)}
                                  className={`px-2 py-1 rounded font-bold text-[10px] ${
                                    u.isShadowBanned ? 'bg-[var(--accent-subtle)] text-[var(--accent)]' : 'bg-[var(--danger-subtle)] text-[var(--danger)]'
                                  }`}>
                                  {u.isShadowBanned ? 'Unban' : 'Ban'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-medium">
                    <span>{totalUsers} records</span>
                    <div className="flex items-center gap-2">
                      <button disabled={userPage === 1} onClick={() => setUserPage(userPage - 1)} className="p-1.5 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] disabled:opacity-40 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                      <span className="px-2">Page {userPage}</span>
                      <button disabled={users.length < 20} onClick={() => setUserPage(userPage + 1)} className="p-1.5 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] disabled:opacity-40 transition-colors"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'reports' && (
                <div className="space-y-4 max-w-4xl">
                  <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-[var(--bg-tertiary)] text-[var(--text-muted)] font-bold">
                            <th className="p-3">Reported User</th>
                            <th className="p-3">Reason</th>
                            <th className="p-3">Reporter</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-primary)]">
                          {reports.map((r) => (
                            <tr key={r.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                              <td className="p-3">
                                <div className="font-bold">{r.reported?.email || 'Guest'}</div>
                                <div className="text-[10px] text-[var(--text-muted)] font-mono">{r.reportedId}</div>
                              </td>
                              <td className="p-3 text-[var(--text-secondary)]">{r.reason}</td>
                              <td className="p-3 text-[var(--text-muted)]">{r.reporter?.email || 'Guest'}</td>
                              <td className="p-3 text-right space-x-1">
                                <button onClick={() => handleResolveReport(r.id, 'APPROVED')} className="p-1.5 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors" title="Approve"><Check className="w-4 h-4" /></button>
                                <button onClick={() => handleResolveReport(r.id, 'REJECTED')} className="p-1.5 rounded-lg bg-[var(--danger-subtle)] text-[var(--danger)] hover:bg-[var(--danger)]/20 transition-colors" title="Dismiss"><X className="w-4 h-4" /></button>
                              </td>
                            </tr>
                          ))}
                          {reports.length === 0 && (
                            <tr><td colSpan={4} className="p-6 text-center text-[var(--text-muted)] italic">No pending reports.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'appeals' && (
                <div className="space-y-4 max-w-4xl">
                  <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-[var(--bg-tertiary)] text-[var(--text-muted)] font-bold">
                            <th className="p-3">User</th>
                            <th className="p-3">Reason</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-primary)]">
                          {appeals.map((a) => (
                            <tr key={a.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                              <td className="p-3 font-bold">{a.user?.email || 'Guest'}</td>
                              <td className="p-3 text-[var(--text-secondary)]">{a.reason}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  a.status === 'PENDING' ? 'bg-[var(--warning-subtle)] text-[var(--warning)]' : a.status === 'APPROVED' ? 'bg-[var(--accent-subtle)] text-[var(--accent)]' : 'bg-[var(--danger-subtle)] text-[var(--danger)]'
                                }`}>{a.status}</span>
                              </td>
                              <td className="p-3 text-right space-x-1">
                                {a.status === 'PENDING' && (
                                  <>
                                    <button onClick={() => handleResolveAppeal(a.id, 'APPROVED')} className="p-1.5 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors" title="Approve"><Check className="w-4 h-4" /></button>
                                    <button onClick={() => handleResolveAppeal(a.id, 'REJECTED')} className="p-1.5 rounded-lg bg-[var(--danger-subtle)] text-[var(--danger)] hover:bg-[var(--danger)]/20 transition-colors" title="Reject"><X className="w-4 h-4" /></button>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))}
                          {appeals.length === 0 && (
                            <tr><td colSpan={4} className="p-6 text-center text-[var(--text-muted)] italic">No appeals found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'feedback' && (
                <div className="space-y-4 max-w-4xl">
                  <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-[var(--bg-tertiary)] text-[var(--text-muted)] font-bold">
                            <th className="p-3">User</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Message</th>
                            <th className="p-3">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-primary)]">
                          {feedbacks.map((f) => (
                            <tr key={f.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                              <td className="p-3 font-bold">{f.user?.email || 'Guest'}</td>
                              <td className="p-3 font-bold text-[var(--brand)]">{f.category}</td>
                              <td className="p-3 text-[var(--text-secondary)] max-w-xs truncate">{f.message}</td>
                              <td className="p-3 text-[var(--text-muted)]">{new Date(f.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                          {feedbacks.length === 0 && (
                            <tr><td colSpan={4} className="p-6 text-center text-[var(--text-muted)] italic">No feedback found.</td></tr>
                          )}
                        </tbody>
                      </table>
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
