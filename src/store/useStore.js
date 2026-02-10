import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const LEVELS = [
  { level: 1, xpRequired: 0 },
  { level: 2, xpRequired: 100 },
  { level: 3, xpRequired: 250 },
  { level: 4, xpRequired: 500 },
  { level: 5, xpRequired: 800 },
  { level: 6, xpRequired: 1200 },
  { level: 7, xpRequired: 1800 },
  { level: 8, xpRequired: 2500 },
  { level: 9, xpRequired: 3500 },
  { level: 10, xpRequired: 5000 },
  { level: 11, xpRequired: 7000 },
  { level: 12, xpRequired: 9500 },
  { level: 13, xpRequired: 12500 },
  { level: 14, xpRequired: 16000 },
  { level: 15, xpRequired: 20000 },
]

function calculateLevel(xp) {
  let level = 1
  for (const l of LEVELS) {
    if (xp >= l.xpRequired) level = l.level
    else break
  }
  return level
}

const DEFAULT_STATE = {
  user: {
    name: 'Apprenant',
    xp: 0,
    level: 1,
    streak: 0,
    lastActiveDate: null,
    createdAt: new Date().toISOString(),
  },
  currentLang: 'js',
  js: { progress: {}, games: {} },
  python: { progress: {}, games: {} },
  achievements: [],
  settings: { soundEnabled: true, animationsEnabled: true },
}

const useStore = create(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,

      // Language
      setLang: (lang) => {
        set({ currentLang: lang })
        document.body.dataset.lang = lang
      },

      // XP & Progression
      awardXP: (amount) => {
        set((state) => {
          const newXP = state.user.xp + amount
          const newLevel = calculateLevel(newXP)
          return { user: { ...state.user, xp: newXP, level: newLevel } }
        })
      },

      getProgressToNextLevel: () => {
        const { xp, level } = get().user
        const current = LEVELS.find(l => l.level === level)
        const next = LEVELS.find(l => l.level === level + 1)
        if (!next) return { current: xp, needed: xp, progress: 100 }
        const currentXP = current ? current.xpRequired : 0
        return {
          current: xp - currentXP,
          needed: next.xpRequired - currentXP,
          progress: Math.round(((xp - currentXP) / (next.xpRequired - currentXP)) * 100),
        }
      },

      // Progress (per-language)
      getProgress: (lessonId) => {
        const lang = get().currentLang
        return get()[lang]?.progress?.[lessonId]
      },

      setProgress: (lessonId, data) => {
        const lang = get().currentLang
        set((state) => ({
          [lang]: {
            ...state[lang],
            progress: { ...state[lang].progress, [lessonId]: data },
          },
        }))
      },

      getAllProgress: () => {
        const lang = get().currentLang
        return get()[lang]?.progress || {}
      },

      // Games (per-language)
      getGames: () => {
        const lang = get().currentLang
        return get()[lang]?.games || {}
      },

      setGameStats: (gameType, data) => {
        const lang = get().currentLang
        set((state) => ({
          [lang]: {
            ...state[lang],
            games: { ...state[lang].games, [gameType]: data },
          },
        }))
      },

      // Achievements
      unlockAchievements: (ids) => {
        set((state) => ({
          achievements: [...new Set([...state.achievements, ...ids])],
        }))
      },

      // Streak
      updateStreak: () => {
        const today = new Date().toISOString().slice(0, 10)
        const lastActive = get().user.lastActiveDate
        if (lastActive === today) return

        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
        const newStreak = lastActive === yesterday ? get().user.streak + 1 : 1

        set((state) => ({
          user: { ...state.user, streak: newStreak, lastActiveDate: today },
        }))
      },

      // User
      setUserName: (name) => set((state) => ({ user: { ...state.user, name } })),

      // Reset
      reset: () => set({ ...DEFAULT_STATE, user: { ...DEFAULT_STATE.user, createdAt: new Date().toISOString() } }),
    }),
    {
      name: 'codemaster_state',
      version: 1,
    }
  )
)

export default useStore
