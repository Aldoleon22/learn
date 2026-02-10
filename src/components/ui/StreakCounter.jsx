import useStore from '@/store/useStore'

export default function StreakCounter() {
  const streak = useStore(s => s.user.streak)

  if (!streak) return null

  return (
    <div className="inline-flex items-center gap-1.5 bg-bg-card border border-white/[0.06] rounded-full px-3 py-1 text-sm">
      <span className="text-neon-orange animate-[neonPulse_2s_infinite]">
        {'🔥'.repeat(Math.min(streak, 3))}
      </span>
      <span className="text-text-secondary">{streak}j</span>
    </div>
  )
}
