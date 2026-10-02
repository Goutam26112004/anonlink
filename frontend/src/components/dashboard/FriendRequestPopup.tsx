"use client";

import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, X } from "lucide-react";
import { FriendRequestData } from "@anon-chat/types";

interface FriendRequestPopupProps {
  open: boolean;
  data: FriendRequestData | null;
  onAccept: (requestId: string) => void;
  onDismiss: () => void;
}

export function FriendRequestPopup({ open, data, onAccept, onDismiss }: FriendRequestPopupProps) {
  return (
    <AnimatePresence>
      {open && data && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--color-void)]/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                Friend Request
              </h3>
              <button
                onClick={onDismiss}
                className="p-1 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-[var(--color-surface-2)]">
              <div className="w-10 h-10 rounded-full bg-[var(--color-signal-violet)]/20 flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5 text-[var(--color-signal-violet)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {data.sender?.displayName || data.sender?.email || "Stranger"}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Wants to be your friend
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onAccept(data.id)}
                className="flex-1 py-2.5 rounded-lg bg-[var(--color-signal-violet)] hover:bg-[var(--color-signal-violet-deep)] text-white font-semibold text-sm transition-all"
              >
                Accept
              </button>
              <button
                onClick={onDismiss}
                className="flex-1 py-2.5 rounded-lg bg-[var(--color-surface-2)] hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)] font-semibold text-sm transition-all border border-[var(--color-border)]"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
