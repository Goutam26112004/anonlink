interface MatchingGlobeProps {
  className?: string;
  size?: number;
}

function MatchingGlobe({ className = '', size = 100 }: MatchingGlobeProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="globe-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#7d5fff" stopOpacity="0.05" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="40" fill="url(#globe-grad)" stroke="#00e5ff" strokeWidth="0.5" strokeOpacity="0.4" />
      <ellipse cx="50" cy="50" rx="20" ry="40" stroke="#7d5fff" strokeWidth="0.3" strokeOpacity="0.3" />
      <ellipse cx="50" cy="50" rx="40" ry="20" stroke="#7d5fff" strokeWidth="0.3" strokeOpacity="0.3" />
      <line x1="10" y1="50" x2="90" y2="50" stroke="#00e5ff" strokeWidth="0.3" strokeOpacity="0.2" />
      <line x1="50" y1="10" x2="50" y2="90" stroke="#00e5ff" strokeWidth="0.3" strokeOpacity="0.2" />
      <circle cx="50" cy="50" r="4" fill="#7d5fff" fillOpacity="0.6" />
    </svg>
  );
}

export default MatchingGlobe;
export { MatchingGlobe };
