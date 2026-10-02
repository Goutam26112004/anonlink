"use client";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "violet";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]",
  success: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
  warning: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
  danger: "bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
  violet: "bg-[var(--color-signal-violet)]/10 text-[var(--color-signal-violet)]",
};

export function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full
        ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
