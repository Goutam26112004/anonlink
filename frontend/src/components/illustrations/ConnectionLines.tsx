interface ConnectionLinesProps {
  className?: string;
  width?: number;
  height?: number;
  count?: number;
}

function ConnectionLines({ className = '', width = 200, height = 40, count = 1 }: ConnectionLinesProps) {
  const lines = Array.from({ length: count }, (_, i) => {
    const yOffset = i * 20 + 10;
    return (
      <g key={i}>
        <line x1="0" y1={yOffset} x2={width} y2={yOffset} stroke="#00e5ff" strokeWidth="0.5" strokeOpacity="0.4" />
        <line x1="0" y1={yOffset} x2={width / 3} y2={yOffset - 6} stroke="#7d5fff" strokeWidth="0.5" strokeOpacity="0.6" />
        <circle cx={width / 3} cy={yOffset - 6} r="2" fill="#7d5fff" fillOpacity="0.8" />
        <circle cx={width * 2 / 3} cy={yOffset + 4} r="1.5" fill="#00e5ff" fillOpacity="0.6" />
      </g>
    );
  });

  return (
    <svg className={className} viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      {lines}
    </svg>
  );
}

export default ConnectionLines;
export { ConnectionLines };
