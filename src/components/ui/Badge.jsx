import { getRarityColor, getRarityLabel } from '@/data/achievements-data'

export default function Badge({ achievement, unlocked = false, size = 'sm' }) {
  const rarityColor = getRarityColor(achievement.rarity)

  const sizeClasses = size === 'lg'
    ? 'p-4 min-w-[120px]'
    : 'p-2 min-w-[80px]'

  const iconSize = size === 'lg' ? 'text-3xl' : 'text-xl'

  return (
    <div
      className={`rounded-xl text-center transition-all duration-300 border ${
        unlocked
          ? 'bg-bg-card border-white/10'
          : 'bg-bg-card/50 border-white/[0.04] opacity-40 grayscale'
      } ${sizeClasses}`}
      title={unlocked ? `${achievement.title} — ${achievement.description}` : '???'}
    >
      <div className={`${iconSize} mb-1`}>
        {unlocked ? achievement.icon : '🔒'}
      </div>
      <div className="text-xs font-semibold truncate">
        {unlocked ? achievement.title : '???'}
      </div>
      {size === 'lg' && unlocked && (
        <div className="text-[10px] mt-1" style={{ color: rarityColor }}>
          {getRarityLabel(achievement.rarity)}
        </div>
      )}
    </div>
  )
}
