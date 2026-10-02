interface NetworkGraphProps {
  className?: string;
}

function NetworkGraph({ className = '' }: NetworkGraphProps) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="100" y1="30" x2="40" y2="100" stroke="#00e5ff" strokeWidth="0.3" strokeOpacity="0.3" />
      <line x1="100" y1="30" x2="160" y2="100" stroke="#00e5ff" strokeWidth="0.3" strokeOpacity="0.3" />
      <line x1="100" y1="170" x2="40" y2="100" stroke="#7d5fff" strokeWidth="0.3" strokeOpacity="0.3" />
      <line x1="100" y1="170" x2="160" y2="100" stroke="#7d5fff" strokeWidth="0.3" strokeOpacity="0.3" />
      <line x1="40" y1="100" x2="160" y2="100" stroke="#00e5ff" strokeWidth="0.3" strokeOpacity="0.15" />
      <circle cx="100" cy="30" r="6" fill="#00e5ff" fillOpacity="0.3" stroke="#00e5ff" strokeWidth="0.5" />
      <circle cx="40" cy="100" r="6" fill="#7d5fff" fillOpacity="0.3" stroke="#7d5fff" strokeWidth="0.5" />
      <circle cx="160" cy="100" r="6" fill="#7d5fff" fillOpacity="0.3" stroke="#7d5fff" strokeWidth="0.5" />
      <circle cx="100" cy="170" r="6" fill="#00e5ff" fillOpacity="0.3" stroke="#00e5ff" strokeWidth="0.5" />
      <circle cx="100" cy="100" r="4" fill="#00e5ff" fillOpacity="0.5" />
    </svg>
  );
}

export default NetworkGraph;
export { NetworkGraph };
