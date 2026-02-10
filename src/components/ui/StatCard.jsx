export default function StatCard({ icon, value, label, color }) {
  return (
    <div className="bg-bg-card border border-white/[0.06] rounded-xl p-4 text-center">
      {icon && <div className="text-2xl mb-1">{icon}</div>}
      <div className="text-2xl font-bold" style={color ? { color } : {}}>
        {value}
      </div>
      <div className="text-xs text-text-secondary mt-1">{label}</div>
    </div>
  )
}
