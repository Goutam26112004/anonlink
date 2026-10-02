interface EmptyStateProps {
  className?: string;
}

function EmptyState({ className = '' }: EmptyStateProps) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="empty-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#7d5fff" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect x="15" y="15" width="70" height="70" rx="12" fill="url(#empty-grad)" stroke="#00e5ff" strokeWidth="0.5" strokeOpacity="0.3" />
      <circle cx="50" cy="45" r="10" stroke="#7d5fff" strokeWidth="0.5" strokeOpacity="0.5" />
      <line x1="57" y1="52" x2="65" y2="60" stroke="#7d5fff" strokeWidth="0.5" strokeOpacity="0.5" />
    </svg>
  );
}

export default EmptyState;
export { EmptyState };
