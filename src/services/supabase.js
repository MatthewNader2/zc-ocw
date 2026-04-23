/**
 * src/services/supabase.js
 *
 * Supabase client — thin wrapper, loaded lazily so the app still works
 * without a Supabase connection (falls back to localStorage).
 *
 * Setup:
 *   1. Create a Supabase project at https://supabase.com (free)
 *   2. Run supabase/schema.sql in the SQL editor
 *   3. Create a 'materials' storage bucket (public)
 *   4. Add to .env:
 *        VITE_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
 *        VITE_SUPABASE_ANON_KEY=eyJ...
 *        VITE_SUPABASE_SERVICE_KEY=eyJ...  (admin writes only — keep secret)
 */

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const ANON_KEY      = import.meta.env.VITE_SUPABASE_ANON_KEY
const SERVICE_KEY   = import.meta.env.VITE_SUPABASE_SERVICE_KEY

export const isConfigured = !!(SUPABASE_URL && ANON_KEY)

/* ── Generic fetch helper ───────────────────────────────────────────────────── */
async function sb(path, { method = 'GET', body, admin = false } = {}) {
  const key = admin ? (SERVICE_KEY ?? ANON_KEY) : ANON_KEY
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      'apikey':        key,
      'Authorization': `Bearer ${key}`,
      'Content-Type':  'application/json',
      'Prefer':        method === 'POST' ? 'return=representation' : 'return=minimal',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? `Supabase error ${res.status}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

/* ── Storage upload helper ──────────────────────────────────────────────────── */
export async function uploadFile(file, playlistId) {
  if (!isConfigured) throw new Error('Supabase not configured')

  const ext      = file.name.split('.').pop()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path     = `${playlistId}/${Date.now()}_${safeName}`

  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/materials/${path}`,
    {
      method:  'POST',
      headers: {
        'apikey':        SERVICE_KEY ?? ANON_KEY,
        'Authorization': `Bearer ${SERVICE_KEY ?? ANON_KEY}`,
        'Content-Type':  file.type || 'application/octet-stream',
        'x-upsert':      'true',
      },
      body: file,
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? `Upload failed: ${res.status}`)
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/materials/${path}`
  return { path, publicUrl, size: file.size, mimeType: file.type }
}

/* ── Course overrides ───────────────────────────────────────────────────────── */
export async function fetchOverride(playlistId) {
  if (!isConfigured) return null
  const rows = await sb(`course_overrides?playlist_id=eq.${playlistId}&limit=1`)
  return rows?.[0] ?? null
}

export async function fetchAllOverrides() {
  if (!isConfigured) return []
  return sb('course_overrides?order=playlist_id') ?? []
}

export async function upsertOverride(playlistId, data) {
  if (!isConfigured) return
  const row = {
    playlist_id: playlistId,
    school_id:   data.schoolId   ?? null,
    program_id:  data.programId  ?? null,
    course_code: data.courseCode ?? null,
    instructor:  data.instructor ?? null,
    semester:    data.semester   ?? null,
    level:       data.level      ?? null,
    description: data.description ?? null,
    tags:        Array.isArray(data.tags) ? data.tags : [],
  }
  await sb('course_overrides', {
    method: 'POST',
    body:   row,
    admin:  true,
  })
}

/* ── Materials ──────────────────────────────────────────────────────────────── */
export async function fetchMaterials(playlistId) {
  if (!isConfigured) return []
  return sb(`materials?playlist_id=eq.${playlistId}&order=added_at`) ?? []
}

export async function insertMaterial(playlistId, mat) {
  if (!isConfigured) return null
  const rows = await sb('materials', {
    method: 'POST',
    body:   { playlist_id: playlistId, ...mat },
    admin:  true,
  })
  return rows?.[0] ?? null
}

export async function deleteMaterial(id) {
  if (!isConfigured) return
  await sb(`materials?id=eq.${id}`, { method: 'DELETE', admin: true })
}

/* ── Books ──────────────────────────────────────────────────────────────────── */
export async function fetchBooks(playlistId) {
  if (!isConfigured) return []
  return sb(`books?playlist_id=eq.${playlistId}&order=added_at`) ?? []
}

export async function insertBook(playlistId, book) {
  if (!isConfigured) return null
  const rows = await sb('books', {
    method: 'POST',
    body:   { playlist_id: playlistId, ...book },
    admin:  true,
  })
  return rows?.[0] ?? null
}

export async function deleteBook(id) {
  if (!isConfigured) return
  await sb(`books?id=eq.${id}`, { method: 'DELETE', admin: true })
}
