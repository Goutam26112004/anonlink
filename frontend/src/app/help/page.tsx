"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useChatStore } from "../../store/chatStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, AlertOctagon, HelpCircle, FileText, ArrowLeft, Send,
  CheckCircle, AlertTriangle, Flag, LogOut, ExternalLink, BookOpen,
} from "lucide-react";
import { AuthenticatedLayout } from "../../components/AuthenticatedLayout";

export default function SafetyCenter() {
  const router = useRouter();
  const { token } = useChatStore();

  const [repScore, setRepScore] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [appealReason, setAppealReason] = useState("");
  const [appeals, setAppeals] = useState<any[]>([]);
  const [appealStatus, setAppealStatus] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("tickets");

  // Tickets
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDesc, setTicketDesc] = useState("");
  const [ticketCategory, setTicketCategory] = useState("GENERAL");
  const [ticketPriority, setTicketPriority] = useState("MEDIUM");
  const [ticketStatus, setTicketStatus] = useState("");

  useEffect(() => {
    if (!token) {
      router.push("/");
      return;
    }

    const fetchHistory = async () => {
      try {
        const data = await apiFetch("/api/v1/moderation/history").catch(() => null);
        if (data) {
          setRepScore(data.reputationScore);
          setIsMuted(data.isCurrentlyMuted);
          setAppeals(data.appeals || []);
        }
        // Fetch tickets
        const ticketData = await apiFetch("/api/v1/tickets").catch(() => null);
        if (ticketData?.tickets) setTickets(ticketData.tickets);
      } catch (error) {
        console.error("Failed to load moderation logs", error);
      } finally {
        setPageLoading(false);
      }
    };

    fetchHistory();
  }, [token, router]);

  const handleAppealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealReason.trim() || appealReason.trim().length < 20) {
      setAppealStatus("Appeal must be at least 20 characters.");
      return;
    }

    setLoading(true);
    setAppealStatus("");

    try {
      await apiFetch("/api/v1/tickets/appeal", {
        method: "POST",
        body: JSON.stringify({ reason: appealReason }),
      });

      setAppealStatus("Appeal submitted successfully! Moderators will review your appeal shortly.");
      setAppealReason("");
      setAppeals([{ id: Math.random().toString(), reason: appealReason, status: "PENDING", createdAt: new Date() }, ...appeals]);
    } catch (err: any) {
      setAppealStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDesc.trim()) {
      setTicketStatus("Subject and description are required.");
      return;
    }
    setLoading(true);
    setTicketStatus("");
    try {
      const res = await apiFetch("/api/v1/tickets", {
        method: "POST",
        body: JSON.stringify({ subject: ticketSubject, description: ticketDesc, category: ticketCategory, priority: ticketPriority }),
      });
      setTicketStatus("Ticket submitted! We'll get back to you soon.");
      setTicketSubject("");
      setTicketDesc("");
      setTickets([res.ticket, ...tickets]);
    } catch (err: any) {
      setTicketStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { id: "tickets", label: "Support Tickets", icon: HelpCircle },
    { id: "appeal", label: "Appeal a Restriction", icon: AlertOctagon },
    { id: "account", label: "Account Standing", icon: Shield },
    { id: "guidelines", label: "Community Guidelines", icon: BookOpen },
    { id: "safety-tips", label: "Safety Tips", icon: Shield },
    { id: "reporting", label: "How Reporting Works", icon: Flag },
    { id: "after-report", label: "What Happens After a Report", icon: FileText },
    { id: "leave-safely", label: "How to Leave a Chat Safely", icon: LogOut },
    { id: "resources", label: "External Resources", icon: ExternalLink },
  ];

  if (pageLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
            <div className="w-5 h-5 border-2 border-[var(--color-border)] border-t-[var(--color-signal-violet)] rounded-full animate-spin" />
            Loading safety center...
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout><div className="flex-1 flex flex-col overflow-hidden text-[var(--color-text-primary)] relative">
      <header className="app-header shrink-0 z-30 px-4 sm:px-6 pl-[4.5rem] lg:pl-4 flex items-center gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-xl" style={{ minHeight: '64px' }}>
        <button
          onMouseEnter={() => router.prefetch("/dashboard")}
          onClick={() => router.push("/dashboard")}
          className="p-2 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] transition-colors"
          aria-label="Return to Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-black flex items-center gap-2">
          <Shield className="w-5 h-5 text-[var(--color-signal-violet)]" /> Safety & Help Center
        </h1>
      </header>
      <div className="flex-1 overflow-y-auto">

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <nav className="w-full lg:w-48 shrink-0">
            <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all shrink-0 whitespace-nowrap ${
                    activeSection === s.id
                      ? "bg-[var(--color-signal-violet)]/10 text-[var(--color-signal-violet)]"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  <s.icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{s.label}</span>
                </button>
              ))}
            </div>
          </nav>

          <div className="flex-1 min-w-0">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {activeSection === "guidelines" && (
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--color-signal-violet)]">
                    <BookOpen className="w-5 h-5" /> Community Guidelines
                  </h2>
                  <div className="space-y-4">
                    {[
                      { num: "1", title: "No Harassment or Hate Speech", desc: "Always treat peers with mutual respect. Slurs, threats, and bullying will lead to immediate restrictions." },
                      { num: "2", title: "No Scams or Malicious Links", desc: "Do not share invite links, credit card information, or redirect users to malicious URLs." },
                      { num: "3", title: "Report Infractions", desc: "If a stranger acts inappropriately, click the flag icon immediately to submit a report. We analyze text logs for active mutes." },
                      { num: "4", title: "Protect Your Privacy", desc: "Never share personal information like your phone number, address, full name, or social media handles." },
                    ].map((item) => (
                      <div key={item.num} className="flex gap-3 p-3.5 rounded-xl bg-[var(--color-surface-2)]">
                        <span className="w-7 h-7 rounded-lg bg-[var(--color-signal-violet)]/10 flex items-center justify-center text-[var(--color-signal-violet)] text-xs font-bold shrink-0">{item.num}</span>
                        <div>
                          <p className="text-sm font-semibold text-[var(--color-text-primary)]">{item.title}</p>
                          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === "safety-tips" && (
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--color-signal-violet)]">
                    <Shield className="w-5 h-5" /> Safety Tips
                  </h2>
                  <div className="space-y-3">
                    {[
                      "Never share personal information (phone number, address, full name, social handles).",
                      "Always disconnect or skip immediately if a user makes you feel uncomfortable.",
                      "Use E2EE text matches whenever available to guarantee end-to-end messaging security.",
                      "Trust your instincts \u2014 if something feels off, end the chat and report the user.",
                      "Keep conversations on the platform \u2014 avoid moving to other apps where you are not protected.",
                    ].map((tip, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-surface-2)]">
                        <div className="w-2 h-2 rounded-full bg-[var(--color-signal-coral)] mt-1.5 shrink-0" />
                        <p className="text-sm text-[var(--color-text-secondary)]">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === "reporting" && (
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8 space-y-4">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--color-signal-violet)]">
                    <Flag className="w-5 h-5" /> How Reporting Works
                  </h2>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[var(--color-surface-2)]">
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">1. Flag the conversation</h3>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        Tap the flag icon in the chat header to open the report form. Choose a reason (harassment, spam, underage, or other) and optionally add details.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--color-surface-2)]">
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">2. Report is sent anonymously</h3>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        Your report is submitted without revealing your identity. The other user will not know who reported them.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--color-surface-2)]">
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">3. Moderators review within 24 hours</h3>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        Our moderation team reviews chat logs and takes appropriate action. You can check your account standing here to see the outcome.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--color-surface-2)]">
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">4. You can also block</h3>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        Blocking prevents that user from matching with you again. You can block directly from the report modal or from the chat header.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "after-report" && (
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8 space-y-4">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--color-signal-violet)]">
                    <FileText className="w-5 h-5" /> What Happens After a Report
                  </h2>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[var(--color-surface-2)]">
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Review Process</h3>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        Each report is reviewed by a moderator or automated system. The review examines chat logs to verify the reported behavior.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--color-surface-2)]">
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Possible Outcomes</h3>
                      <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                        <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-[var(--color-success)] shrink-0 mt-0.5" /> <strong>Warning</strong> \u2014 A first-time or minor infraction results in a warning.</li>
                        <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-[var(--color-warning)] shrink-0 mt-0.5" /> <strong>Temporary Restriction</strong> \u2014 A mute or temporary ban for repeated or serious violations.</li>
                        <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-[var(--color-danger)] shrink-0 mt-0.5" /> <strong>Permanent Ban</strong> \u2014 A permanent account deletion for severe violations.</li>
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--color-surface-2)]">
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Right to Appeal</h3>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        If you believe a restriction was applied incorrectly, you can submit an appeal from the Account Standing section of this page. Appeals are reviewed within 48 hours.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "leave-safely" && (
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8 space-y-4">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--color-signal-violet)]">
                    <LogOut className="w-5 h-5" /> How to Leave a Chat Safely
                  </h2>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[var(--color-surface-2)]">
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">End the chat</h3>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        Tap the X button in the chat header to end the conversation immediately. The other user will see a "Chat ended" message.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--color-surface-2)]">
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Block the user</h3>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        Tap the shield-off icon to block the user. A blocked user cannot match with you again. Blocking is immediate and does not require a reason.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--color-surface-2)]">
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Report if needed</h3>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        If the user behaved inappropriately, tap the flag icon to submit a report before or after ending the chat. Reports are anonymous.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--color-surface-2)]">
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">Take a break</h3>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        After an uncomfortable experience, it is okay to take a break. You can close the app and return anytime. Your safety comes first.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "resources" && (
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8 space-y-4">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--color-signal-violet)]">
                    <ExternalLink className="w-5 h-5" /> External Support Resources
                  </h2>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                    If you need help beyond what we can provide, these organizations offer free, confidential support.
                  </p>
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-[var(--color-surface-2)]">
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Crisis Helpline</h3>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        Trained counselors available 24/7 for anyone in crisis. Free and confidential.
                      </p>
                      <p className="text-xs text-[var(--color-signal-violet)] mt-1 font-mono">988 Suicide & Crisis Lifeline (US) · AASRA 9820466726 (India)</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--color-surface-2)]">
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Online Safety Resources</h3>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        Guides on staying safe online, recognizing harassment, and protecting your privacy.
                      </p>
                      <p className="text-xs text-[var(--color-signal-violet)] mt-1 font-mono">staysafeonline.org · internetsafety101.org</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--color-surface-2)]">
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Mental Health Support</h3>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        Free mental health resources and peer support communities.
                      </p>
                      <p className="text-xs text-[var(--color-signal-violet)] mt-1 font-mono">betterhelp.com · 7cups.com · mindline.org</p>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-4 border-t border-[var(--color-border)] pt-4">
                    These are external resources not affiliated with AnonLink. We provide these links as a courtesy.
                  </p>
                </div>
              )}

              {activeSection === "account" && (
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8 text-center">
                  <h2 className="text-xl font-bold mb-4">Account Standing</h2>
                  {isMuted ? (
                    <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-danger)]/10 text-[var(--color-danger)] text-xs font-bold border border-[var(--color-danger)]/20">
                      <AlertTriangle className="w-4 h-4" /> Currently Restricted
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-success)]/10 text-[var(--color-success)] text-xs font-bold border border-[var(--color-success)]/20">
                      <CheckCircle className="w-4 h-4" /> Good Standing
                    </div>
                  )}
                </div>
              )}

              {activeSection === "tickets" && (
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-[var(--color-signal-violet)]" /> Support Tickets
                  </h2>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                    Having an issue? Submit a ticket and our team will help you. Track your tickets below.
                  </p>

                  {/* Ticket Form */}
                  <form onSubmit={handleTicketSubmit} className="space-y-4 mb-8">
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Subject *</label>
                      <input type="text" value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)} placeholder="Brief description of your issue" maxLength={200} className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] outline-none focus:border-[var(--color-signal-violet)]/50" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Category</label>
                        <select value={ticketCategory} onChange={(e) => setTicketCategory(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-sm text-[var(--color-text-primary)] outline-none">
                          <option value="GENERAL">General</option>
                          <option value="BUG">Bug Report</option>
                          <option value="ACCOUNT">Account Issue</option>
                          <option value="BILLING">Billing</option>
                          <option value="SAFETY">Safety Concern</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Priority</label>
                        <select value={ticketPriority} onChange={(e) => setTicketPriority(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-sm text-[var(--color-text-primary)] outline-none">
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="URGENT">Urgent</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Description *</label>
                      <textarea value={ticketDesc} onChange={(e) => setTicketDesc(e.target.value)} placeholder="Describe your issue in detail. Include steps to reproduce if reporting a bug." maxLength={2000} rows={5} className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] outline-none focus:border-[var(--color-signal-violet)]/50 resize-none" />
                    </div>
                    <button type="submit" disabled={loading || !ticketSubject.trim() || !ticketDesc.trim()} className="px-6 py-2.5 rounded-xl bg-[var(--color-signal-violet)] text-white text-sm font-bold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                      <Send className="w-4 h-4" /> Submit Ticket
                    </button>
                    {ticketStatus && <p className={`text-xs mt-2 ${ticketStatus.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>{ticketStatus}</p>}
                  </form>

                  {/* Ticket History */}
                  {tickets.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-3">Your Tickets</h3>
                      <div className="space-y-2">
                        {tickets.map((t: any) => (
                          <div key={t.id} className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{t.subject}</p>
                              <p className="text-xs text-[var(--color-text-secondary)]">{t.category} · {new Date(t.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                              t.status === 'OPEN' ? 'bg-green-500/10 text-green-400' :
                              t.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-400' :
                              t.status === 'RESOLVED' ? 'bg-[var(--color-signal-violet)]/10 text-[var(--color-signal-violet)]' :
                              'bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                            }`}>{t.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeSection === "appeal" && (
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <AlertOctagon className="w-5 h-5 text-[var(--color-signal-violet)]" /> Appeal a Restriction
                  </h2>

                  <form onSubmit={handleAppealSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="appeal-reason" className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">Explain your case</label>
                      <textarea
                        id="appeal-reason"
                        value={appealReason}
                        onChange={(e) => setAppealReason(e.target.value)}
                        className="w-full p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-signal-violet)]/50 text-xs h-24 transition-colors resize-none"
                        placeholder="Explain why your restriction was incorrect..."
                        required
                      />
                      {!appealReason.trim() && appealReason.length > 0 && (
                        <p className="text-xs text-[var(--color-danger)] mt-1">Please provide a reason for your appeal.</p>
                      )}
                    </div>

                    <AnimatePresence>
                      {appealStatus && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="text-xs font-bold text-[var(--color-signal-violet)] flex items-start gap-2 p-3 rounded-xl bg-[var(--color-signal-violet)]/10"
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
                      className="w-full py-2.5 rounded-xl bg-[var(--color-signal-violet)] text-white font-bold text-xs flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" /> {loading ? "Submitting..." : "Submit Appeal"}
                    </motion.button>
                  </form>

                  {appeals.length > 0 && (
                    <div className="mt-6">
                      <h2 className="text-sm font-bold mb-3">Recent Appeals</h2>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {appeals.map((app, i) => (
                          <motion.div
                            key={app.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03, duration: 0.15 }}
                            className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-between gap-2"
                          >
                            <span className="text-xs text-[var(--color-text-secondary)] truncate flex-1">{app.reason}</span>
                            <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold ${
                              app.status === "PENDING" ? "bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
                              : app.status === "APPROVED" ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                              : "bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
                            }`}>{app.status}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>
    </div></div></AuthenticatedLayout>
  );
}
