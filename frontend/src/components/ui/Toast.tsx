"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, AlertTriangle, Info } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <Check className="w-5 h-5" />,
  error: <X className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
};

const borderColors: Record<ToastType, string> = {
  success: "border-[var(--color-success)]/30",
  error: "border-[var(--color-danger)]/30",
  warning: "border-[var(--color-warning)]/30",
  info: "border-[var(--color-signal-violet)]/30",
};

const textColors: Record<ToastType, string> = {
  success: "text-[var(--color-success)]",
  error: "text-[var(--color-danger)]",
  warning: "text-[var(--color-warning)]",
  info: "text-[var(--color-signal-violet)]",
};

let toastListeners: ((t: ToastItem) => void)[] = [];

export function toast(type: ToastType, title: string, message?: string) {
  const id = Math.random().toString(36).slice(2);
  const item: ToastItem = { id, type, title, message };
  toastListeners.forEach((fn) => fn(item));
}

export function useToast() {
  return { success: (t: string, m?: string) => toast("success", t, m),
           error: (t: string, m?: string) => toast("error", t, m),
           warning: (t: string, m?: string) => toast("warning", t, m),
           info: (t: string, m?: string) => toast("info", t, m) };
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  const add = useCallback((t: ToastItem) => {
    setItems((prev) => [...prev, t]);
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== t.id));
    }, 5000);
  }, []);

  useEffect(() => {
    toastListeners.push(add);
    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== add);
    };
  }, [add]);

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={`bg-[var(--color-surface)] border ${borderColors[item.type]} rounded-xl px-4 py-3 pointer-events-auto`}
          >
            <div className="flex items-start gap-3">
              <span className={`shrink-0 mt-0.5 ${textColors[item.type]}`}>
                {icons[item.type]}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {item.title}
                </p>
                {item.message && (
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    {item.message}
                  </p>
                )}
              </div>
              <button
                onClick={() =>
                  setItems((prev) => prev.filter((i) => i.id !== item.id))
                }
                className="shrink-0 p-0.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-signal-violet)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-void)]"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
