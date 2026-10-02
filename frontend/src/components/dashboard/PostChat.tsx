"use client";

import { Button } from "../ui/Button";
import { LogOut, Home, RefreshCw, ArrowLeft } from "lucide-react";

interface PostChatProps {
  onFindAnother: () => void;
  onBack: () => void;
}

export function PostChat({ onFindAnother, onBack }: PostChatProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-sm lg:max-w-md">
        <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center mx-auto mb-4">
          <LogOut className="w-7 h-7 lg:w-8 lg:h-8 text-[var(--color-text-secondary)]" />
        </div>
        <h3 className="text-lg lg:text-xl font-semibold text-[var(--color-text-primary)] mb-2">
          Chat ended
        </h3>
        <p className="text-sm lg:text-base text-[var(--color-text-secondary)] mb-6">
          Ready to meet someone new?
        </p>

        <div className="flex flex-col gap-3 lg:max-w-xs lg:mx-auto">
          <Button
            variant="primary"
            size="lg"
            onClick={onFindAnother}
            className="rounded-full w-full"
          >
            <RefreshCw className="w-4 h-4" />
            Find another
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={onBack}
            className="rounded-full w-full"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Origin
          </Button>
        </div>
      </div>
    </div>
  );
}
