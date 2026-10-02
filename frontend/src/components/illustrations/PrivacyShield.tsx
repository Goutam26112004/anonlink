interface PrivacyShieldProps {
  className?: string;
  size?: number;
}

function PrivacyShield({ className = '', size = 100 }: PrivacyShieldProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shield-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#7d5fff" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <path d="M50 10L85 25V45C85 70 70 88 50 95C30 88 15 70 15 45V25L50 10Z" fill="url(#shield-grad)" stroke="#00e5ff" strokeWidth="0.5" strokeOpacity="0.4" />
      <path d="M50 25L50 80M35 50L50 50L60 40" stroke="#7d5fff" strokeWidth="0.5" strokeOpacity="0.5" />
    </svg>
  );
}

export default PrivacyShield;
export { PrivacyShield };
