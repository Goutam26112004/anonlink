"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--color-void)] flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-danger)]/10 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-[var(--color-danger)]" />
        </div>
        <h1 className="text-2xl font-display font-bold text-[var(--color-text-primary)] mb-3">
          Something went wrong
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-8">
          An unexpected error occurred. Please try again or return to the
          dashboard.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="px-6 py-3 rounded-xl bg-[var(--color-signal-violet)] text-white font-bold text-sm hover:brightness-110 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-signal-violet)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-void)]"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] font-bold text-sm hover:bg-[var(--color-surface-2)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-signal-violet)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-void)]"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
