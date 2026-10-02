"use client";

import { Crown } from "lucide-react";
import { useRouter } from "next/navigation";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface PremiumModalProps {
  open: boolean;
  onClose: () => void;
  featureName: string;
}

export function PremiumModal({ open, onClose, featureName }: PremiumModalProps) {
  const router = useRouter();

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="text-center py-2">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400/20 to-rose-400/20 flex items-center justify-center mx-auto mb-4">
          <Crown className="w-7 h-7 text-amber-400" />
        </div>
        <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
          Upgrade to Premium
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] mt-2 mb-6 leading-relaxed">
          Unlock <span className="text-[var(--color-text-primary)] font-semibold">{featureName}</span> and more premium features.
        </p>
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onMouseEnter={() => router.prefetch("/subscription")}
          onClick={() => {
            onClose();
            router.push("/subscription");
          }}
        >
          <Crown className="w-4 h-4" />
          View Plans
        </Button>
        <button
          onClick={onClose}
          className="mt-3 w-full text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors py-2"
        >
          Maybe later
        </button>
      </div>
    </Modal>
  );
}
