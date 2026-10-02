"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flag, ShieldOff, CheckCircle, Info } from "lucide-react";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";

const reasons = [
  { value: "harassment", label: "Harassment" },
  { value: "spam", label: "Spam / Scam" },
  { value: "underage", label: "Underage User" },
  { value: "other", label: "Other" },
];

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details: string, alsoBlock: boolean) => void;
  onBlock: () => void;
}

export function ReportModal({ open, onClose, onSubmit, onBlock }: ReportModalProps) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setReason("");
      setDetails("");
      setSubmitted(false);
      setAlsoBlock(false);
    }
  }, [open]);

  const handleSubmit = () => {
    if (!reason) return;
    onSubmit(reason, details, alsoBlock);
    setSubmitted(true);
  };

  const handleClose = () => {
    if (submitted) {
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 3000);
    }
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={submitted ? undefined : handleClose}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[20px] p-6"
            >
              {!submitted ? (
                <>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-danger)]/10 flex items-center justify-center">
                      <Flag className="w-5 h-5 text-[var(--color-danger)]" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                        Report User
                      </h3>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        Your report is anonymous.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] mb-4 flex items-start gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-[var(--color-signal-violet)]" />
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Your report is reviewed anonymously within 24 hours. If action is taken, the user may receive a warning or restriction. Your identity is never revealed.
                    </p>
                  </div>

                  <div className="space-y-2 mb-5">
                    {reasons.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => setReason(r.value)}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          reason === r.value
                            ? "bg-[var(--color-signal-violet)]/10 text-[var(--color-signal-violet)] border border-[var(--color-signal-violet)]/30"
                            : "bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border border-transparent hover:border-[var(--color-border)]"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>

                  <Textarea
                    placeholder="Add any details (optional)..."
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    className="mb-5"
                  />

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="primary"
                      size="md"
                      disabled={!reason}
                      onClick={handleSubmit}
                      className="w-full"
                    >
                      Submit Report
                    </Button>
                    <button
                      onClick={() => {
                        onClose();
                        onBlock();
                      }}
                      className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] transition-colors py-2"
                    >
                      Block user directly
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-7 h-7 text-[var(--color-success)]" />
                  </div>
                  <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
                    Report submitted
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-5">
                    We&apos;ll review it within 24 hours. Thank you for keeping
                    the network safe.
                  </p>
                  <div className="flex items-center justify-center gap-2 mb-5">
                    <input
                      type="checkbox"
                      id="alsoBlock"
                      checked={alsoBlock}
                      onChange={(e) => setAlsoBlock(e.target.checked)}
                      className="w-4 h-4 rounded accent-[var(--color-signal-violet)]"
                    />
                    <label htmlFor="alsoBlock" className="text-sm text-[var(--color-text-secondary)]">
                      Also block this user
                    </label>
                  </div>
                  <Button variant="primary" size="md" onClick={handleClose} className="w-full">
                    Done
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toastVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[110] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 shadow-lg flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4 text-[var(--color-success)] shrink-0" />
            <span className="text-sm text-[var(--color-text-primary)] font-medium">
              Report submitted successfully
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
