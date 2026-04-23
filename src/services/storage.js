/**
 * src/services/storage.js
 *
 * Typed localStorage wrapper. All keys are prefixed with "zcocw_"
 * so we never clash with other apps running on the same origin.
 */

const NS = 'zcocw_'
const k  = (key) => `${NS}${key}`

function parse(raw) {
  try { return JSON.parse(raw) } catch { return null }
}

// ── Generic ──────────────────────────────────────────────────────────────────

export function get(key, fallback = null) {
  const raw = localStorage.getItem(k(key))
  if (raw === null) return fallback
  return parse(raw) ?? fallback
}

export function set(key, value) {
  try {
    localStorage.setItem(k(key), JSON.stringify(value))
  } catch (e) {
    console.warn('localStorage write failed:', e)
  }
}

export function remove(key) {
  localStorage.removeItem(k(key))
}

// ── Admin auth ────────────────────────────────────────────────────────────────

export function setAdminSession(token) { set('admin_session', token) }
export function getAdminSession()       { return get('admin_session', null) }
export function clearAdminSession()     { remove('admin_session') }

// ── Course overrides (admin-set) ──────────────────────────────────────────────
// Shape: { [playlistId]: CourseOverride }

export function getAllOverrides() { return get('course_overrides', {}) }

export function getOverride(playlistId) {
  return getAllOverrides()[playlistId] ?? {}
}

export function saveOverride(playlistId, data) {
  const all = getAllOverrides()
  all[playlistId] = { ...all[playlistId], ...data, updatedAt: Date.now() }
  set('course_overrides', all)
}

export function deleteOverride(playlistId) {
  const all = getAllOverrides()
  delete all[playlistId]
  set('course_overrides', all)
}

// ── Materials ─────────────────────────────────────────────────────────────────
// Shape: { [playlistId]: Material[] }

export function getMaterials(playlistId) {
  return get(`materials_${playlistId}`, [])
}

export function addMaterial(playlistId, material) {
  const list = getMaterials(playlistId)
  const item = { ...material, id: `mat_${Date.now()}`, addedAt: Date.now() }
  set(`materials_${playlistId}`, [...list, item])
  return item
}

export function updateMaterial(playlistId, materialId, patch) {
  const list = getMaterials(playlistId).map(m =>
    m.id === materialId ? { ...m, ...patch } : m
  )
  set(`materials_${playlistId}`, list)
}

export function deleteMaterial(playlistId, materialId) {
  const list = getMaterials(playlistId).filter(m => m.id !== materialId)
  set(`materials_${playlistId}`, list)
}

// ── Books ─────────────────────────────────────────────────────────────────────

export function getBooks(playlistId) {
  return get(`books_${playlistId}`, [])
}

export function addBook(playlistId, book) {
  const list = getBooks(playlistId)
  const item = { ...book, id: `bk_${Date.now()}`, addedAt: Date.now() }
  set(`books_${playlistId}`, [...list, item])
  return item
}

export function deleteBook(playlistId, bookId) {
  const list = getBooks(playlistId).filter(b => b.id !== bookId)
  set(`books_${playlistId}`, list)
}

// ── Watch progress ─────────────────────────────────────────────────────────────
// Shape: { [videoId]: { watchedAt, playlistId } }

export function markWatched(videoId, playlistId) {
  const all = get('progress', {})
  all[videoId] = { watchedAt: Date.now(), playlistId }
  set('progress', all)
}

export function isWatched(videoId) {
  const all = get('progress', {})
  return !!all[videoId]
}

export function getWatchedVideos() { return get('progress', {}) }

export function getCourseProgress(lectureIds = []) {
  if (!lectureIds.length) return 0
  const watched = getWatchedVideos()
  const count   = lectureIds.filter(id => watched[id]).length
  return Math.round((count / lectureIds.length) * 100)
}

// ── Recently watched (ordered list of videoIds) ───────────────────────────────

export function addRecentlyWatched(videoId, playlistId, title, thumbnail) {
  const MAX   = 12
  const list  = get('recently_watched', []).filter(v => v.videoId !== videoId)
  const entry = { videoId, playlistId, title, thumbnail, watchedAt: Date.now() }
  set('recently_watched', [entry, ...list].slice(0, MAX))
}

export function getRecentlyWatched() { return get('recently_watched', []) }

// ── Bookmarks ──────────────────────────────────────────────────────────────────

export function getBookmarks() { return get('bookmarks', []) }

export function addBookmark(playlistId) {
  const list = getBookmarks()
  if (!list.includes(playlistId)) set('bookmarks', [...list, playlistId])
}

export function removeBookmark(playlistId) {
  set('bookmarks', getBookmarks().filter(id => id !== playlistId))
}

export function isBookmarked(playlistId) {
  return getBookmarks().includes(playlistId)
}

// ── Notes per lecture ──────────────────────────────────────────────────────────

export function getNote(videoId)         { return get(`note_${videoId}`, '') }
export function saveNote(videoId, text)  { set(`note_${videoId}`, text) }
export function deleteNote(videoId)      { remove(`note_${videoId}`) }
