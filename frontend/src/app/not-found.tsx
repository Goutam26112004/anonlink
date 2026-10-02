import Link from "next/link";
import { WavelengthSync } from "../components/ui/WavelengthSync";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--color-void)] flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <WavelengthSync state="idle" className="h-24 w-full max-w-[200px] mx-auto mb-8" />
        <h1 className="text-2xl font-display font-bold text-[var(--color-text-primary)] mb-3">
          This corner of the network is empty
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-xl bg-[var(--color-signal-violet)] text-white font-bold text-sm hover:brightness-110 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-signal-violet)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-void)]"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] font-bold text-sm hover:bg-[var(--color-surface-2)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-signal-violet)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-void)]"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
