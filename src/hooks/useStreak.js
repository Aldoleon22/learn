import { useEffect } from 'react'
import useStore from '@/store/useStore'

export function useStreak() {
  const updateStreak = useStore(s => s.updateStreak)

  useEffect(() => {
    updateStreak()
  }, [updateStreak])
}
