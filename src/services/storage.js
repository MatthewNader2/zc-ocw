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

const SESSION_TTL = 24 * 60 * 60 * 1000 // 24 hours

export function setAdminSession(token = 'authenticated') {
  const session = {
    token,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL,
  }
  set('admin_session', session)
}

export function getAdminSession() {
  const session = get('admin_session', null)
  if (!session) return null
  if (typeof session === 'string') {
    if (session === 'authenticated') return session
    clearAdminSession()
    return null
  }
  if (session.expiresAt && Date.now() > session.expiresAt) {
    clearAdminSession()
    return null
  }
  return session.token ?? null
}

export function clearAdminSession() {
  remove('admin_session')
}

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

function generateId(prefix) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export function getMaterials(playlistId) {
  return get(`materials_${playlistId}`, [])
}

export function addMaterial(playlistId, material) {
  const list = getMaterials(playlistId)
  const item = { ...material, id: generateId('mat'), addedAt: Date.now() }
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
  const item = { ...book, id: generateId('bk'), addedAt: Date.now() }
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

// ── Custom Schools & Programs ─────────────────────────────────────────────────

export function getCustomSchools() { return get('custom_schools', []) }
export function saveCustomSchools(schools) { set('custom_schools', schools) }

export function getCustomPrograms() { return get('custom_programs', {}) }
export function saveCustomPrograms(programs) { set('custom_programs', programs) }

// ── Acknowledgments Config ───────────────────────────────────────────────────

export const DEFAULT_ACKNOWLEDGMENTS_CONFIG = {
  headerTitle: "Acknowledgments",
  headerSubtitle: "Built by students, for students. Huge thanks to everyone who contributed.",
  slides: [
    {
      id: "slide_1",
      url: "/acknowledgments-hero.jpg",
      title: "Zewail City Innovation & Research",
      caption: "Empowering open education and world-class scientific research across Egypt and the Arab world.",
    },
    {
      id: "slide_2",
      url: "/student-collaboration.jpg",
      title: "Student & Faculty Collaboration",
      caption: "Special thanks to all student clubs, course TAs, and professors who dedicated hours to record and organize lecture series.",
    },
    {
      // Placeholder slide — drop a file named image1.jpg into the /public
      // folder at the repo root (same level as acknowledgments-hero.jpg).
      // Vite serves everything in /public from the site root, so
      // /image1.jpg here resolves to yourdomain.com/image1.jpg.
      // Admins can also replace this via the Acknowledgments editor in
      // /admin/settings (upload a file or paste a URL) once deployed.
      id: "slide_3",
      url: "/image1.jpg",
      title: "Add your photo",
      caption: "Placeholder slide — upload image1.jpg to /public, or replace it from the admin panel.",
    },
  ],
  team: [
    { id: "t1", name: "Matthew Nader", role: "Project Lead & Full-Stack Architect", school: "CSAI" },
    { id: "t2", name: "Physics & Math Club", role: "Content Curation & Verification", school: "Science" },
    { id: "t3", name: "Engineering Society", role: "Lecture Recording & Media Editing", school: "Engineering" },
  ],
  sponsors: [
    { id: "s1", name: "Zewail City of Science and Technology", contribution: "Facility & Recording Equipment" },
    { id: "s2", name: "CFP Summer School Initiative", contribution: "Special Lecture Content & Materials" },
  ],
}

export function getAcknowledgmentsConfig() {
  return get('acknowledgments_config', DEFAULT_ACKNOWLEDGMENTS_CONFIG)
}

export function saveAcknowledgmentsConfig(config) {
  set('acknowledgments_config', config)
}
