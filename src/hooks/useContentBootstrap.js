import { useEffect } from 'react'
import useContentStore from '@/store/contentStore'

export function useContentBootstrap() {
  const ready = useContentStore(s => s.ready)
  const loading = useContentStore(s => s.loading)
  const error = useContentStore(s => s.error)
  const load = useContentStore(s => s.load)

  useEffect(() => {
    load()
  }, [load])

  return { ready, loading, error }
}
