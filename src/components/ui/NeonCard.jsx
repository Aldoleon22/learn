export default function NeonCard({ children, onClick, className = '', hover = true }) {
  const base = 'neon-card'
  const clickable = onClick ? 'cursor-pointer' : ''
  const hoverClass = hover ? '' : 'hover:border-transparent hover:shadow-none hover:transform-none'

  return (
    <div
      className={`${base} ${clickable} ${hoverClass} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(e) } : undefined}
    >
      {children}
    </div>
  )
}
