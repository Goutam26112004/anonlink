"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '../../store/chatStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertOctagon, HelpCircle, FileText, ArrowLeft, Send, CheckCircle, AlertTriangle } from 'lucide-react';
import { PrivacyShield } from '../../components/illustrations/PrivacyShield';
import { SkeletonPage } from '../../components/Skeleton';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export default function SafetyCenter() {
  const router = useRouter();
  const { token } = useChatStore();

  const [repScore, setRepScore] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [appeals, setAppeals] = useState<any[]>([]);
  const [appealStatus, setAppealStatus] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push('/');
      return;
    }

    const fetchHistory = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/v1/moderation/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setRepScore(data.reputationScore);
          setIsMuted(data.isCurrentlyMuted);
          setAppeals(data.appeals || []);
        }
      } catch (error) {
        console.error('Failed to load moderation logs', error);
      } finally {
        setPageLoading(false);
      }
    };

    fetchHistory();
  }, [token, router]);

  const handleAppealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealReason.trim()) return;

    setLoading(true);
    setAppealStatus('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/moderation/appeal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: appealReason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to file appeal');

      setAppealStatus('Appeal submitted successfully! Moderators will review your appeal shortly.');
      setAppealReason('');
      setAppeals([{ id: Math.random().toString(), reason: appealReason, status: 'PENDING', createdAt: new Date() }, ...appeals]);
    } catch (err: any) {
      setAppealStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] relative">
      <PrivacyShield className="absolute right-0 bottom-0 opacity-[0.03] pointer-events-none" size={300} />

      <header className="px-6 py-4 flex items-center gap-4 border-b border-[var(--border-primary)] glass-heavy">
        <button 
          onClick={() => router.push('/dashboard')}
          className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] transition-colors"
          aria-label="Return to Chat Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-black flex items-center gap-2">
          <Shield className="w-5 h-5 text-[var(--brand)]" /> Safety & Help Center
        </h1>
      </header>

      <main className="flex-1 p-6 md:p-12 max-w-5xl mx-auto w-full">
        {pageLoading ? (
          <SkeletonPage />
        ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <section className="md:col-span-2 space-y-6">
            <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--brand)]">
                <FileText className="w-5 h-5" /> Community Guidelines
              </h2>
              <div className="space-y-4">
                {[
                  { num: '1', title: 'No Harassment or Hate Speech', desc: 'Always treat peers with mutual respect. Slurs, threats, and bullying will lead to immediate restrictions.' },
                  { num: '2', title: 'No Scams or Malicious Links', desc: 'Do not share telegram/discord invite links, credit card information, or redirect users to malicious URLs.' },
                  { num: '3', title: 'Report Infractions', desc: 'If a stranger acts inappropriately, click the red flag icon immediately to submit a report. We analyze text logs for active mutes.' },
                ].map((item) => (
                  <div key={item.num} className="flex gap-3 p-3.5 rounded-xl bg-[var(--bg-tertiary)]">
                    <span className="w-7 h-7 rounded-lg bg-[var(--brand-subtle)] flex items-center justify-center text-[var(--brand)] text-xs font-bold shrink-0">{item.num}</span>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</p>
                      <p className="text-sm text-[var(--text-secondary)] mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--brand)]">
                <HelpCircle className="w-5 h-5" /> Safety Tips
              </h2>
              <div className="space-y-3">
                {[
                  'Never share personal information (phone number, address, full name, social handles).',
                  'Always disconnect/skip immediately if a user makes you feel uncomfortable.',
                  'Use E2EE text matches whenever they are available to guarantee end-to-end messaging security.',
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-tertiary)]">
                    <div className="w-2 h-2 rounded-full bg-[var(--accent)] mt-1.5 shrink-0" />
                    <p className="text-sm text-[var(--text-secondary)]">{tip}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>

          <section className="space-y-6">
            <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 text-center">
              <h2 className="text-lg font-bold mb-4">Account Standing</h2>
              <div className="relative w-24 h-24 mx-auto mb-3">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-tertiary)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--brand)" strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - Math.min(repScore, 150) / 150)}`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-black text-[var(--text-primary)]">{repScore}</span>
                </div>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mb-4">Reputation Score (min: 40)</p>

              {isMuted ? (
                <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--danger-subtle)] text-[var(--danger)] text-xs font-bold border border-[var(--danger)]/20">
                  <AlertTriangle className="w-4 h-4" /> Currently Restricted
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent-subtle)] text-[var(--accent)] text-xs font-bold border border-[var(--accent)]/20">
                  <CheckCircle className="w-4 h-4" /> Good Standing
                </div>
              )}
            </motion.div>

            <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-[var(--brand)]" /> Appeal Restriction
              </h2>
              
              <form onSubmit={handleAppealSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Explain your case</label>
                  <textarea 
                    value={appealReason}
                    onChange={(e) => setAppealReason(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)]/50 text-xs h-24 transition-colors resize-none"
                    placeholder="Explain why your ban or reputation drop was incorrect..."
                    required
                  />
                </div>

                <AnimatePresence>
                  {appealStatus && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-xs font-bold text-[var(--brand)] flex items-start gap-2 p-3 rounded-xl bg-[var(--brand-subtle)]"
                    >
                      <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      {appealStatus}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl btn-primary text-xs flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> {loading ? 'Submitting...' : 'Submit Appeal'}
                </motion.button>
              </form>
            </motion.div>

            {appeals.length > 0 && (
              <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6">
                <h2 className="text-sm font-bold mb-3">Recent Appeals</h2>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {appeals.map((app, i) => (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.15 }}
                      className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] flex items-center justify-between gap-2"
                    >
                      <span className="text-xs text-[var(--text-secondary)] truncate flex-1">{app.reason}</span>
                      <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold ${
                        app.status === 'PENDING' ? 'bg-[var(--warning-subtle)] text-[var(--warning)]' : app.status === 'APPROVED' ? 'bg-[var(--accent-subtle)] text-[var(--accent)]' : 'bg-[var(--danger-subtle)] text-[var(--danger)]'
                      }`}>{app.status}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </section>
        </motion.div>
        )}
      </main>
    </div>
  );
}
