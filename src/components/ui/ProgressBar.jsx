export default function ProgressBar({ value = 0, max = 100, label, color, className = '' }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0

  return (
    <div className={className}>
      {label && (
        <div className="flex justify-between text-xs text-text-secondary mb-1">
          <span>{label}</span>
          <span>{pct}%</span>
        </div>
      )}
      <div className="xp-bar">
        <div
          className="xp-bar__fill"
          style={{ width: `${pct}%`, ...(color ? { background: color } : {}) }}
        />
      </div>
    </div>
  )
}
