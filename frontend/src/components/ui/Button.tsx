"use client";

import { forwardRef, memo } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "glass";
type ButtonSize = "sm" | "md" | "lg" | "xl";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-signal-violet)] text-white font-semibold hover:bg-[var(--color-signal-violet-deep)] active:bg-[var(--color-signal-violet-deep)] active:scale-[0.97] hover:shadow-lg hover:shadow-[var(--brand)]/20",
  secondary:
    "bg-[var(--color-surface-2)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-border)] active:scale-[0.97]",
  ghost:
    "bg-transparent text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] active:scale-[0.97]",
  destructive:
    "bg-[var(--color-danger)]/10 text-[var(--color-danger)] font-semibold hover:bg-[var(--color-danger)]/20 active:scale-[0.97]",
  glass:
    "backdrop-blur-xl bg-[var(--color-signal-violet)] text-white font-semibold border border-[var(--color-signal-violet)] hover:brightness-110 hover:scale-[1.02] active:scale-[0.97] shadow-lg shadow-[var(--color-signal-violet)]/25 hover:shadow-xl hover:shadow-[var(--color-signal-violet)]/30",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2 text-sm rounded-xl",
  lg: "px-6 py-3 text-base rounded-xl",
  xl: "px-10 py-4 text-base rounded-full",
};

export const Button = memo(forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-2 font-medium transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-signal-violet)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-void)]
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${variant === "glass" ? "glass-btn-glow" : ""}`}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
));

Button.displayName = "Button";
