import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import * as storage from '@/services/storage'

const SettingsContext = createContext(null)

const DEFAULTS = {
  // Appearance & Theme
  theme:          'dark',  // 'dark' | 'light' | 'system'
  // Playback
  autoplayNext:   true,
  defaultQuality: 'hd720',
  playbackSpeed:  1,
  // Display
  compactCards:   false,
  showProgress:   true,
  // Language
  uiLanguage:     'en',
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    const saved = storage.get('user_settings', {})
    return { ...DEFAULTS, ...saved }
  })

  const update = useCallback((key, value) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value }
      storage.set('user_settings', next)
      return next
    })
  }, [])

  // Sync theme mode to documentElement class (.dark)
  useEffect(() => {
    const root = document.documentElement
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    function applyTheme() {
      const isDark =
        settings.theme === 'dark' ||
        (settings.theme === 'system' && mediaQuery.matches)

      if (isDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }

    applyTheme()

    const handler = () => {
      if (settings.theme === 'system') applyTheme()
    }
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [settings.theme])

  const reset = useCallback(() => {
    storage.remove('user_settings')
    setSettings(DEFAULTS)
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, update, reset }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be inside SettingsProvider')
  return ctx
}
