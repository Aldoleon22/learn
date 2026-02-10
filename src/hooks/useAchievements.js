import { useEffect, useRef } from 'react'
import useStore from '@/store/useStore'
import { checkAchievements } from '@/data/achievements-data'
import { useToast } from '@/components/ui/ToastProvider'

export function useAchievements() {
  const { addToast } = useToast()
  const prevXP = useRef(null)

  useEffect(() => {
    const unsub = useStore.subscribe((state) => {
      if (prevXP.current === null) {
        prevXP.current = state.user.xp
        return
      }
      if (state.user.xp === prevXP.current) return
      prevXP.current = state.user.xp

      const newlyUnlocked = checkAchievements(state)
      if (newlyUnlocked.length > 0) {
        const ids = newlyUnlocked.map(a => a.id)
        useStore.getState().unlockAchievements(ids)

        const totalXP = newlyUnlocked.reduce((sum, a) => sum + (a.xpReward || 0), 0)
        if (totalXP > 0) {
          useStore.getState().awardXP(totalXP)
        }

        for (const a of newlyUnlocked) {
          addToast(`${a.icon} ${a.title} — ${a.description}`, { type: 'achievement', duration: 5000 })
        }
      }
    })

    return unsub
  }, [addToast])
}
