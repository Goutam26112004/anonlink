"use client";

import { useEffect, useState } from "react";
import { WavelengthSync } from "../ui/WavelengthSync";
import { Button } from "../ui/Button";
import { Users, Clock, Search } from "lucide-react";

const microcopy = [
  "Finding someone with shared interests...",
  "Good connections take a moment.",
  "Scanning the network for the right match...",
  "Almost there — just a few more seconds.",
  "Quality over speed. Hang tight!",
];

const timeoutTips = [
  "It's taking longer than usual. You can wait or try again later.",
];

interface MatchingScreenProps {
  activeCount: number;
  elapsedSec: number;
  onCancel: () => void;
}

export function MatchingScreen({ activeCount, elapsedSec, onCancel }: MatchingScreenProps) {
  const [copyIndex, setCopyIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCopyIndex((prev) => (prev + 1) % microcopy.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const isTimeout = elapsedSec > 60;
  const noOneOnline = activeCount === 0;

  if (noOneOnline) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center mb-6">
          <Search className="w-10 h-10 lg:w-12 lg:h-12 text-[var(--color-text-secondary)]" />
        </div>
        <h3 className="text-lg lg:text-xl font-semibold text-[var(--color-text-primary)] mb-2">
          No one&apos;s available right now
        </h3>
        <p className="text-sm lg:text-base text-[var(--color-text-secondary)] text-center max-w-xs lg:max-w-sm mb-8">
          There are no users online at the moment. Try again later.
        </p>
        <Button variant="ghost" size="md" onClick={onCancel}>
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <WavelengthSync state="searching" className="h-28 lg:h-36 w-full max-w-xs lg:max-w-sm mb-6" />

      <p className="text-sm lg:text-base font-mono text-[var(--color-signal-violet)] mb-2">
        Searching for {formatTime(elapsedSec)}
      </p>

      <p className="text-sm lg:text-base text-[var(--color-text-secondary)] text-center max-w-xs lg:max-w-sm mb-3 min-h-[2.5em]">
        {isTimeout ? timeoutTips[0] : microcopy[copyIndex]}
      </p>

      <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]/70 mb-8">
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" /> {activeCount} online
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> {formatTime(elapsedSec)}
        </span>
      </div>

      {isTimeout && (
        <Button variant="secondary" size="md" onClick={onCancel} className="mb-3">
          Cancel search
        </Button>
      )}

      {!isTimeout && (
        <button
          onClick={onCancel}
          className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
