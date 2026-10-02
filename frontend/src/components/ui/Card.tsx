"use client";

import { forwardRef } from "react";

type CardVariant = "default" | "interactive" | "glass";

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  className?: string;
  onClick?: () => void;
}

const variantClasses: Record<CardVariant, string> = {
  default: "bg-[var(--color-surface)] border border-[var(--color-border)]",
  interactive:
    "bg-[var(--color-surface)] border border-[var(--color-border)] cursor-pointer hover:border-[var(--color-signal-violet)]/30 transition-colors duration-150",
  glass:
    "bg-[var(--color-surface)]/60 backdrop-blur-xl border border-[var(--color-border)]",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = "default", className = "", onClick }, ref) => {
    const Component = onClick ? "button" : "div";
    return (
      <Component
        ref={ref}
        onClick={onClick}
        className={`rounded-[20px] p-6 ${variantClasses[variant]} ${className}`}
      >
        {children}
      </Component>
    );
  },
);

Card.displayName = "Card";
