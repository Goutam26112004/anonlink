interface HeroSceneProps {
  className?: string;
}

function HeroScene({ className = '' }: HeroSceneProps) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="hero-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.2" />
          <stop offset="60%" stopColor="#7d5fff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#7d5fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="80" fill="url(#hero-grad)" />
      <circle cx="100" cy="100" r="50" stroke="#00e5ff" strokeWidth="0.5" strokeOpacity="0.3" />
      <circle cx="100" cy="100" r="30" stroke="#7d5fff" strokeWidth="0.5" strokeOpacity="0.4" />
      <circle cx="100" cy="100" r="8" fill="#00e5ff" fillOpacity="0.4" />
      <line x1="30" y1="30" x2="80" y2="80" stroke="#7d5fff" strokeWidth="0.3" strokeOpacity="0.2" />
      <line x1="170" y1="30" x2="120" y2="80" stroke="#7d5fff" strokeWidth="0.3" strokeOpacity="0.2" />
      <line x1="30" y1="170" x2="80" y2="120" stroke="#7d5fff" strokeWidth="0.3" strokeOpacity="0.2" />
      <line x1="170" y1="170" x2="120" y2="120" stroke="#7d5fff" strokeWidth="0.3" strokeOpacity="0.2" />
    </svg>
  );
}

export default HeroScene;
export { HeroScene };
