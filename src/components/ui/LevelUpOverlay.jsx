import { useEffect, useState } from 'react'
import useStore from '@/store/useStore'

export default function LevelUpOverlay() {
  const [showLevel, setShowLevel] = useState(null)
  const level = useStore(s => s.user.level)
  const prevLevel = useStore.getState().__prevLevel

  useEffect(() => {
    if (prevLevel !== undefined && level > prevLevel) {
      setShowLevel(level)
      const timer = setTimeout(() => setShowLevel(null), 3000)
      return () => clearTimeout(timer)
    }
    useStore.setState({ __prevLevel: level })
  }, [level, prevLevel])

  if (!showLevel) return null

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fadeIn_0.3s_ease]">
      <div className="text-center animate-[levelUpBounce_0.6s_ease]">
        <div className="text-6xl mb-4">🎉</div>
        <div className="text-3xl font-black text-accent-primary mb-2" style={{ textShadow: 'var(--glow-accent)' }}>
          Niveau {showLevel} !
        </div>
        <div className="text-text-secondary">Continue comme ca !</div>
      </div>
    </div>
  )
}
