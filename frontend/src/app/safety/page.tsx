"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '../../store/chatStore';
import { Shield, AlertOctagon, HelpCircle, FileText, ArrowLeft, Send } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export default function SafetyCenter() {
  const router = useRouter();
  const { token, theme } = useChatStore();

  const [repScore, setRepScore] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [appeals, setAppeals] = useState<any[]>([]);
  const [appealStatus, setAppealStatus] = useState('');
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
      // Reload appeals
      setAppeals([{ id: Math.random().toString(), reason: appealReason, status: 'PENDING', createdAt: new Date() }, ...appeals]);
    } catch (err: any) {
      setAppealStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#0B0F19] text-white' : 'bg-[#F8FAFC] text-slate-900'
    }`}>
      {/* Top Header */}
      <header className={`px-6 py-4 flex items-center gap-4 border-b ${
        theme === 'dark' ? 'border-white/5 bg-[#1E293B]/40' : 'border-slate-200 bg-white'
      }`}>
        <button 
          onClick={() => router.push('/dashboard')}
          className="p-2 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 text-slate-400"
          aria-label="Return to Chat Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-black flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-500" /> Safety & Help Center
        </h1>
      </header>

      {/* Main Grid Content */}
      <main className="flex-1 p-6 md:p-12 max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Guidelines & Safety Tips */}
        <section className="md:col-span-2 space-y-6">
          <div className={`p-6 rounded-3xl border ${
            theme === 'dark' ? 'bg-[#1E293B]/40 border-white/5' : 'bg-white border-slate-200'
          }`}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-500">
              <FileText className="w-5 h-5" /> Community Guidelines
            </h2>
            <ul className="space-y-3.5 text-sm text-slate-400">
              <li className="flex gap-2">
                <span className="text-indigo-400 font-bold">1.</span>
                <span><strong>No Harassment or Hate Speech:</strong> Always treat peers with mutual respect. Slurs, threats, and bullying will lead to immediate restrictions.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-indigo-400 font-bold">2.</span>
                <span><strong>No Scams or Malicious Links:</strong> Do not share telegram/discord invite links, credit card information, or redirect users to malicious URLs.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-indigo-400 font-bold">3.</span>
                <span><strong>Report Infractions:</strong> If a stranger acts inappropriately, click the red flag icon immediately to submit a report. We analyze text logs for active mutes.</span>
              </li>
            </ul>
          </div>

          <div className={`p-6 rounded-3xl border ${
            theme === 'dark' ? 'bg-[#1E293B]/40 border-white/5' : 'bg-white border-slate-200'
          }`}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-500">
              <HelpCircle className="w-5 h-5" /> Safety Tips
            </h2>
            <ul className="space-y-3.5 text-sm text-slate-400">
              <li>• Never share personal information (phone number, address, full name, social handles).</li>
              <li>• Always disconnect/skip immediately if a user makes you feel uncomfortable.</li>
              <li>• Use E2EE text matches whenever they are available to guarantee end-to-end messaging security.</li>
            </ul>
          </div>
        </section>

        {/* Right Column: Account status & Appeals */}
        <section className="space-y-6">
          {/* Status Display Card */}
          <div className={`p-6 rounded-3xl border text-center ${
            theme === 'dark' ? 'bg-[#1E293B]/40 border-white/5' : 'bg-white border-slate-200'
          }`}>
            <h2 className="text-lg font-bold mb-2">Account Moderation Status</h2>
            <div className="text-3xl font-black text-indigo-400 mb-1">{repScore} / 150</div>
            <p className="text-xs text-slate-400 mb-4">Reputation Rating (Minimum: 40)</p>

            {isMuted ? (
              <div className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-500 text-xs font-bold border border-rose-500/20">
                You are currently restricted from chat.
              </div>
            ) : (
              <div className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
                Good Standing. All features unlocked.
              </div>
            )}
          </div>

          {/* Appeals Form */}
          <div className={`p-6 rounded-3xl border ${
            theme === 'dark' ? 'bg-[#1E293B]/40 border-white/5' : 'bg-white border-slate-200'
          }`}>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-indigo-500" /> Appeal Restriction
            </h2>
            
            <form onSubmit={handleAppealSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Explain your case</label>
                <textarea 
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  className={`w-full p-3 rounded-xl border outline-none text-xs h-24 ${
                    theme === 'dark' ? 'bg-slate-950/40 border-white/5 focus:border-indigo-500' : 'bg-white border-slate-200 focus:border-indigo-500'
                  }`}
                  placeholder="Explain why your ban or reputation drop was incorrect..."
                  required
                />
              </div>

              {appealStatus && (
                <div className="text-xs font-bold text-indigo-400">{appealStatus}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" /> {loading ? 'Submitting...' : 'Submit Appeal'}
              </button>
            </form>
          </div>

          {/* Past Appeals List */}
          {appeals.length > 0 && (
            <div className={`p-6 rounded-3xl border ${
              theme === 'dark' ? 'bg-[#1E293B]/40 border-white/5' : 'bg-white border-slate-200'
            }`}>
              <h2 className="text-sm font-bold mb-3">Recent Appeals History</h2>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {appeals.map((app) => (
                  <div key={app.id} className="p-2.5 rounded-xl bg-slate-500/5 border border-slate-500/10 flex justify-between items-center text-xs">
                    <span className="truncate max-w-[150px] text-slate-400">{app.reason}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      app.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' : app.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                    }`}>{app.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
