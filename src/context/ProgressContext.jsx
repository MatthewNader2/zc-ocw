import { createContext, useContext, useState, useCallback } from 'react'
import * as storage from '@/services/storage'

const ProgressContext = createContext(null)

export function ProgressProvider({ children }) {
  const [version, setVersion] = useState(0)
  const bump = useCallback(() => setVersion(v => v + 1), [])

  const markWatched = useCallback((videoId, playlistId, meta = {}) => {
    storage.markWatched(videoId, playlistId)
    if (meta.title) {
      storage.addRecentlyWatched(videoId, playlistId, meta.title, meta.thumbnail)
    }
    bump()
  }, [bump])

  const isWatched         = useCallback((id)  => storage.isWatched(id),          [version]) // eslint-disable-line
  const getCourseProgress = useCallback((ids) => storage.getCourseProgress(ids),  [version]) // eslint-disable-line
  const getRecentlyWatched = useCallback(()   => storage.getRecentlyWatched(),    [version]) // eslint-disable-line

  // ── Notes ────────────────────────────────────────────────

  const getNote  = useCallback((videoId) => storage.getNote(videoId),       [version]) // eslint-disable-line
  const saveNote = useCallback((videoId, text) => { storage.saveNote(videoId, text); bump() }, [bump])

  // ── Bookmarks ────────────────────────────────────────────

  const isBookmarked = useCallback((id)  => storage.isBookmarked(id),       [version]) // eslint-disable-line
  const getBookmarks = useCallback(()    => storage.getBookmarks(),          [version]) // eslint-disable-line

  const toggleBookmark = useCallback((playlistId) => {
    if (storage.isBookmarked(playlistId)) {
      storage.removeBookmark(playlistId)
    } else {
      storage.addBookmark(playlistId)
    }
    bump()
  }, [bump])

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
