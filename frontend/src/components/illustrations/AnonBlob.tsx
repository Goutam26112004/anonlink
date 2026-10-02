interface AnonBlobProps {
  className?: string;
}

function AnonBlob({ className = '' }: AnonBlobProps) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="blob-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#7d5fff" stopOpacity="0.05" />
        </radialGradient>
      </defs>
      <path d="M50 10C65 10 80 20 85 40C90 60 80 80 65 88C50 96 30 90 20 75C10 60 15 35 30 20C40 12 45 10 50 10Z" fill="url(#blob-grad)" stroke="#7d5fff" strokeWidth="0.5" />
    </svg>
  );
}

export default AnonBlob;
export { AnonBlob };
