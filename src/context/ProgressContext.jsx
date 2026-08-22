import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import * as storage from '@/services/storage'
import * as cloudflare from '@/services/cloudflare'
import { useAuth } from '@/context/AuthContext'

const ProgressContext = createContext(null)

export function ProgressProvider({ children }) {
  const [version, setVersion] = useState(0)
  const { user, getIdToken } = useAuth()

  const bump = useCallback(() => setVersion(v => v + 1), [])

  // Sync / merge user data with Cloudflare D1 when user logs in
  useEffect(() => {
    if (!user) return
    let active = true

    async function syncUserData() {
      try {
        const token = await getIdToken()
        if (!token || !active) return

        // 1. Sync bookmarks — merge local + cloud (union)
        const cloudBookmarks = await cloudflare.fetchUserData('bookmarks', token)
        const localBookmarks = storage.getBookmarks()
        
        let finalBookmarks = localBookmarks
        if (Array.isArray(cloudBookmarks)) {
          // Union merge so guest bookmarks are never lost
          finalBookmarks = Array.from(new Set([...localBookmarks, ...cloudBookmarks]))
        }
        storage.set('bookmarks', finalBookmarks)
        await cloudflare.putUserData('bookmarks', finalBookmarks, token)

        // 2. Sync progress
        const cloudProgress = await cloudflare.fetchUserData('progress', token)
        if (cloudProgress && typeof cloudProgress === 'object') {
          const localProgress = storage.get('progress', {})
          const mergedProgress = { ...cloudProgress, ...localProgress }
          storage.set('progress', mergedProgress)
          await cloudflare.putUserData('progress', mergedProgress, token)
        }

        if (active) bump()
      } catch (e) {
        console.warn('Failed to sync user data with cloud:', e)
      }
    }

    syncUserData()
    return () => { active = false }
  }, [user, getIdToken, bump])

  const markWatched = useCallback(async (videoId, playlistId, meta = {}) => {
    storage.markWatched(videoId, playlistId)
    if (meta.title) {
      storage.addRecentlyWatched(videoId, playlistId, meta.title, meta.thumbnail)
    }
    bump()

    if (user) {
      try {
        const token = await getIdToken()
        if (token) {
          const currentProgress = storage.get('progress', {})
          await cloudflare.putUserData('progress', currentProgress, token)
        }
      } catch {}
    }
  }, [bump, user, getIdToken])

  const isWatched         = useCallback((id)  => storage.isWatched(id),          [version]) // eslint-disable-line
  const getCourseProgress = useCallback((ids) => storage.getCourseProgress(ids),  [version]) // eslint-disable-line
  const getRecentlyWatched = useCallback(()   => storage.getRecentlyWatched(),    [version]) // eslint-disable-line

  // ── Notes ────────────────────────────────────────────────

  const getNote  = useCallback((videoId) => storage.getNote(videoId),       [version]) // eslint-disable-line
  const saveNote = useCallback((videoId, text) => { storage.saveNote(videoId, text); bump() }, [bump])

  // ── Bookmarks ────────────────────────────────────────────

  const isBookmarked = useCallback((id)  => storage.isBookmarked(id),       [version]) // eslint-disable-line
  const getBookmarks = useCallback(()    => storage.getBookmarks(),          [version]) // eslint-disable-line

  const toggleBookmark = useCallback(async (playlistId) => {
    if (storage.isBookmarked(playlistId)) {
      storage.removeBookmark(playlistId)
    } else {
      storage.addBookmark(playlistId)
    }
    bump()

    if (user) {
      try {
        const token = await getIdToken()
        if (token) {
          const currentBookmarks = storage.getBookmarks()
          await cloudflare.putUserData('bookmarks', currentBookmarks, token)
        }
      } catch {}
    }
  }, [bump, user, getIdToken])

  return (
    <ProgressContext.Provider value={{
      version,
      markWatched, isWatched, getCourseProgress, getRecentlyWatched,
      getNote, saveNote,
      isBookmarked, getBookmarks, toggleBookmark,
    }}>
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider')
  return ctx
}
