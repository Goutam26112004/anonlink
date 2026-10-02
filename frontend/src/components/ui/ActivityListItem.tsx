"use client";

import { Badge } from "./Badge";

interface ActivityListItemProps {
  icon: React.ReactNode;
  text: string;
  time?: string;
  live?: boolean;
  className?: string;
}

export function ActivityListItem({
  icon,
  text,
  time,
  live,
  className = "",
}: ActivityListItemProps) {
  return (
    <div
      className={`flex items-center gap-3 py-3 ${className}`}
    >
      <span className="shrink-0 text-[var(--color-signal-violet)]">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--color-text-primary)] truncate">
          {text}
        </p>
      </div>
      {live && <Badge variant="success">Live</Badge>}
      {time && !live && (
        <span className="text-xs text-[var(--color-text-secondary)] shrink-0">
          {time}
        </span>
      )}
    </div>
  );
}
