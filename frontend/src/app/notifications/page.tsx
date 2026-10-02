"use client";

import { useState, useMemo, useEffect } from "react";
import { useChatStore } from "../../store/chatStore";
import { motion } from "framer-motion";
import { Bell, CheckCheck, Trash2, Inbox } from "lucide-react";
import { AuthenticatedLayout } from "../../components/AuthenticatedLayout";

export default function NotificationsPage() {
  const { notifications } = useChatStore();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filtered = useMemo(() => {
    if (filter === "unread") return notifications.filter((n) => !n.isRead);
    return notifications;
  }, [notifications, filter]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Mark all as read when page is viewed
  useEffect(() => {
    if (notifications.some(n => !n.isRead)) {
      useChatStore.setState((s) => ({
        notifications: s.notifications.map(n => ({ ...n, isRead: true }))
      }));
    }
  }, [notifications]);

  return (
    <AuthenticatedLayout><div className="flex-1 flex flex-col overflow-hidden">
      <header className="app-header shrink-0 z-30 bg-[var(--color-surface)]/80 backdrop-blur-xl border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between px-4 sm:px-6 pl-[4.5rem] lg:pl-4" style={{ minHeight: '64px', paddingTop: '14px', paddingBottom: '14px' }}>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Notifications</h1>
          </div>
          {unreadCount > 0 && (
            <span className="text-sm text-[var(--color-signal-violet)] font-medium">
              {unreadCount} unread
            </span>
          )}
        </div>
      </header>
      <div className="flex-1 overflow-y-auto">

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === "all"
                ? "bg-[var(--color-signal-violet)]/10 text-[var(--color-signal-violet)]"
                : "bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            <Bell className="w-4 h-4" /> All
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === "unread"
                ? "bg-[var(--color-signal-violet)]/10 text-[var(--color-signal-violet)]"
                : "bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            <CheckCheck className="w-4 h-4" /> Unread
            {unreadCount > 0 && (
              <span className="min-w-[18px] h-4 px-0.5 rounded-full bg-[var(--color-danger)] text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        <motion.div layout className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center mx-auto mb-4">
                <Inbox className="w-8 h-8 text-[var(--color-text-secondary)]" />
              </div>
              <p className="text-[var(--color-text-primary)] font-medium">
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                {filter === "unread" ? "You are all caught up!" : "Notifications will appear here"}
              </p>
            </div>
          ) : (
            [...filtered].reverse().map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02, duration: 0.15 }}
                className={`p-4 rounded-xl border transition-colors ${
                  n.isRead
                    ? "bg-[var(--color-surface)] border-[var(--color-border)]"
                    : "bg-[var(--color-surface-2)] border-[var(--color-signal-violet)]/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      n.isRead
                        ? "bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]"
                        : "bg-[var(--color-signal-violet)]/10 text-[var(--color-signal-violet)]"
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        {n.title}
                      </p>
                      {!n.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-signal-violet)] shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                      {n.message}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </div></div></AuthenticatedLayout>
  );
}
