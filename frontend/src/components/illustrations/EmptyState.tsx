"use client";

import { motion } from "framer-motion";
import { NetworkGraph } from "./NetworkGraph";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`flex flex-col items-center justify-center text-center p-12 ${className}`}
    >
      <div className="relative mb-6">
        {icon || (
          <div className="w-32 h-24">
            <NetworkGraph nodeCount={12} width={128} height={96} />
          </div>
        )}
      </div>
      <h3 className="heading-section text-xl mb-2">{title}</h3>
      {description && (
        <p className="text-[var(--text-secondary)] text-sm max-w-xs mb-6">{description}</p>
      )}
      {action && (
        <button onClick={action.onClick} className="btn-primary text-sm">
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
