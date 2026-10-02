"use client";

import { forwardRef } from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg
            text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)]
            px-4 py-2.5 text-sm min-h-[80px] resize-y
            focus:outline-none focus:ring-2 focus:ring-[var(--color-signal-violet)] focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? "border-[var(--color-danger)] focus:ring-[var(--color-danger)]" : ""}
            ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-[var(--color-danger)]">{error}</p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
