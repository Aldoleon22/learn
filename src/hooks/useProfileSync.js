import { useEffect, useRef } from 'react'
import useStore from '../store/useStore'
import { fetchProfile, saveProfile } from '../lib/profileApi'

function selectProfileData(state) {
  return {
    user: state.user,
    currentLang: state.currentLang,
    js: state.js,
    python: state.python,
    achievements: state.achievements,
    settings: state.settings,
  }
}

export function useProfileSync() {
  const initialized = useRef(false)
  const saveTimeout = useRef(null)
  const lastSavedJson = useRef('')

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const remote = await fetchProfile()
        if (!active) return
        if (remote) {
          useStore.getState().applyProfile(remote)
          lastSavedJson.current = JSON.stringify(selectProfileData(useStore.getState()))
        } else {
          // Seed a profile in MySQL if one does not exist yet
          await saveProfile(selectProfileData(useStore.getState()))
          lastSavedJson.current = JSON.stringify(selectProfileData(useStore.getState()))
        }
      } catch (error) {
        console.warn('Profile sync load failed:', error)
      } finally {
        initialized.current = true
      }
    }

    load()

    const unsubscribe = useStore.subscribe((state) => {
      if (!initialized.current) return
      const payload = selectProfileData(state)
      const json = JSON.stringify(payload)
      if (json === lastSavedJson.current) return

      if (saveTimeout.current) clearTimeout(saveTimeout.current)
      saveTimeout.current = setTimeout(async () => {
        try {
          await saveProfile(payload)
          lastSavedJson.current = json
        } catch (error) {
          console.warn('Profile sync save failed:', error)
        }
      }, 800)
    })

    return () => {
      active = false
      unsubscribe()
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
    }
  }, [])
}
