"use client";

interface SkeletonBaseProps {
  className?: string;
}

function SkeletonBase({ className = "" }: SkeletonBaseProps) {
  return (
    <div
      className={`rounded-xl bg-[var(--bg-tertiary)] animate-shimmer ${className}`}
      aria-hidden="true"
    />
  );
}

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className = "" }: SkeletonCardProps) {
  return (
    <div className={`rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6 ${className}`}>
      <SkeletonBase className="w-10 h-10 rounded-xl mb-4" />
      <SkeletonBase className="h-5 w-3/4 mb-3" />
      <SkeletonBase className="h-4 w-full mb-2" />
      <SkeletonBase className="h-4 w-2/3" />
    </div>
  );
}

interface SkeletonAvatarProps {
  className?: string;
  size?: number;
}

export function SkeletonAvatar({ className = "", size = 40 }: SkeletonAvatarProps) {
  return (
    <SkeletonBase
      className={`rounded-full shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

interface SkeletonTextProps {
  className?: string;
  lines?: number;
}

export function SkeletonText({ className = "", lines = 3 }: SkeletonTextProps) {
  const widths = ["w-full", "w-11/12", "w-3/4", "w-5/6", "w-2/3"];
  return (
    <div className={`space-y-2.5 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonBase
          key={i}
          className={`h-3.5 ${widths[i % widths.length]}`}
        />
      ))}
    </div>
  );
}

interface SkeletonButtonProps {
  className?: string;
}

export function SkeletonButton({ className = "" }: SkeletonButtonProps) {
  return (
    <SkeletonBase className={`h-10 rounded-xl ${className}`} />
  );
}

interface SkeletonPageProps {
  className?: string;
}

export function SkeletonPage({ className = "" }: SkeletonPageProps) {
  return (
    <div className={`p-6 space-y-6 ${className}`}>
      <div className="flex items-center gap-4">
        <SkeletonAvatar size={48} />
        <div className="flex-1 space-y-2">
          <SkeletonBase className="h-5 w-48" />
          <SkeletonBase className="h-3.5 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonCard className="w-full" />
    </div>
  );
}

export function SkeletonChatMessage({ isOwn = false }: { isOwn?: boolean }) {
  return (
    <div className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
      <SkeletonAvatar size={32} />
      <div className={`space-y-2 ${isOwn ? "items-end" : ""}`}>
        <SkeletonBase className={`h-8 ${isOwn ? "w-48" : "w-64"} rounded-2xl`} />
        <SkeletonBase className="h-3 w-16" />
      </div>
    </div>
  );
}
