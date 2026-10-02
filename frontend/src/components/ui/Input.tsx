"use client";

import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg
              text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)]
              px-4 py-2.5 text-sm
              focus:outline-none focus:ring-2 focus:ring-[var(--color-signal-violet)] focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
              ${icon ? "pl-10" : ""}
              ${error ? "border-[var(--color-danger)] focus:ring-[var(--color-danger)]" : ""}
              ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-xs text-[var(--color-danger)]">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
