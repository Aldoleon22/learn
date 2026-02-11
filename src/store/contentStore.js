import { create } from 'zustand'
import { fetchAllContent } from '../lib/contentApi.js'

const useContentStore = create((set, get) => ({
  content: {},
  ready: false,
  loading: false,
  error: null,

  load: async () => {
    if (get().loading) return
    set({ loading: true, error: null })
    try {
      const content = await fetchAllContent()
      set({ content, ready: true, loading: false })
    } catch (error) {
      set({ error, loading: false })
    }
  },

  getType: (type, lang, key = 'default') => {
    const content = get().content || {}
    const bucket = content[type]
    if (!bucket) return null
    if (lang) return bucket?.[lang]?.[key] ?? null
    return bucket?.[key] ?? null
  },
}))

export default useContentStore
