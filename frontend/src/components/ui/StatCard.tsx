"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  trend?: "up" | "down";
  trendValue?: string;
  className?: string;
}

export function StatCard({
  icon,
  label,
  value,
  trend,
  trendValue,
  className = "",
}: StatCardProps) {
  return (
    <div
      className={`bg-[var(--color-surface-2)] rounded-[20px] p-5 ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[var(--color-signal-violet)]">{icon}</span>
        {trend && (
          <span
            className={`flex items-center gap-1 text-xs font-medium ${
              trend === "up"
                ? "text-[var(--color-success)]"
                : "text-[var(--color-danger)]"
            }`}
          >
            {trend === "up" ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            {trendValue}
          </span>
        )}
      </div>
      <p className="text-2xl font-display font-bold text-[var(--color-text-primary)]">
        {value}
      </p>
      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
        {label}
      </p>
    </div>
  );
}
