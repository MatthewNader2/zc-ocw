export default function ProgressRing({ percent = 0, size = 48, stroke = 4, className = '' }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (percent / 100) * circ

  return (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        {/* Fill */}
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke="#C9A84C" strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      {/* Label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-mono font-bold text-zc-gold leading-none">
          {percent}%
        </span>
      </div>
    </div>
  )
}
