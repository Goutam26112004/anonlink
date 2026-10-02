"use client";

import { useMemo } from "react";

interface AnonAvatarProps {
  sessionId?: string;
  size?: number;
  className?: string;
}

function hashToGradient(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  const h1 = ((hash & 0xff) % 360 + 360) % 360;
  const h2 = ((hash >> 8) & 0xff) % 360;
  const s = 40 + ((hash >> 16) & 0x3f);
  const l = 30 + ((hash >> 22) & 0x1f);
  return {
    start: `hsl(${h1}, ${s}%, ${l}%)`,
    end: `hsl(${h2}, ${s}%, ${l + 20}%)`,
  };
}

export function AnonAvatar({
  sessionId = "anon",
  size = 40,
  className = "",
}: AnonAvatarProps) {
  const gradient = useMemo(() => hashToGradient(sessionId), [sessionId]);

  return (
    <div
      className={`rounded-full shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${gradient.start}, ${gradient.end})`,
      }}
    />
  );
}
