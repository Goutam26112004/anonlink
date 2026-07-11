"use client";

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertCircle, Info } from 'lucide-react';
import { useChatStore } from '../store/chatStore';

export type Toast = {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
};

export function useToast() {
  const addNotification = useChatStore((s) => s.addNotification);

  return {
    success: (title: string, message?: string) => addNotification({ title, message: message || '' }),
    error: (title: string, message?: string) => addNotification({ title, message: message || '' }),
    info: (title: string, message?: string) => addNotification({ title, message: message || '' }),
  };
}

const icons = {
  success: Check,
  error: AlertCircle,
  info: Info,
};

const colors = {
  success: 'border-[var(--accent)]/30 text-[var(--accent)]',
  error: 'border-[var(--danger)]/30 text-[var(--danger)]',
  info: 'border-[var(--info)]/30 text-[var(--info)]',
};

export default function Toaster() {
  const notifications = useChatStore((s) => s.notifications);

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {notifications.slice(-5).map((n) => {
          const Icon = icons.success;
          const color = colors.success;
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`glass-heavy rounded-xl px-4 py-3 border ${color} shadow-[var(--shadow-glass)] pointer-events-auto`}
            >
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--text-primary)]">{n.title}</p>
                  {n.message && <p className="text-xs text-[var(--text-muted)] mt-0.5">{n.message}</p>}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
