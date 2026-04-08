/**
 * src/services/youtube.js
 *
 * Thin wrapper around YouTube Data API v3.
 * All calls go through here so quota usage is easy to audit.
 *
 * Quota cost reference (per call):
 *   search.list       → 100 units
 *   playlists.list    → 1 unit
 *   playlistItems.list→ 1 unit
 *   videos.list       → 1 unit
 *   channels.list     → 1 unit
 *
 * Free quota: 10,000 units/day. Use React Query caching to minimize calls.
 */

import axios from 'axios'

const BASE = 'https://www.googleapis.com/youtube/v3'
const KEY  = import.meta.env.VITE_YOUTUBE_API_KEY
const CHANNEL_ID = import.meta.env.VITE_YOUTUBE_CHANNEL_ID

const yt = axios.create({ baseURL: BASE })

// ── Playlists (= courses) ──────────────────────────────────────────────────

/** Fetch all playlists from the channel — each playlist = one course */
export async function fetchPlaylists({ pageToken = '', maxResults = 20 } = {}) {
  const { data } = await yt.get('/playlists', {
    params: {
      key: KEY,
      channelId: CHANNEL_ID,
      part: 'snippet,contentDetails',
      maxResults,
      pageToken: pageToken || undefined,
    },
  })
  return data   // { items, nextPageToken, pageInfo }
}

/** Fetch a single playlist by ID */
export async function fetchPlaylist(playlistId) {
  const { data } = await yt.get('/playlists', {
    params: {
      key: KEY,
      id: playlistId,
      part: 'snippet,contentDetails',
    },
  })
  return data.items?.[0] ?? null
}

// ── Playlist items (= lectures) ────────────────────────────────────────────

/** Fetch all videos in a playlist (handles pagination automatically) */
export async function fetchPlaylistItems(playlistId, maxResults = 50) {
  let items = []
  let pageToken = ''

  do {
    const { data } = await yt.get('/playlistItems', {
      params: {
        key: KEY,
        playlistId,
        part: 'snippet,contentDetails',
        maxResults: Math.min(maxResults - items.length, 50),
        pageToken: pageToken || undefined,
      },
    })
    items = [...items, ...data.items]
    pageToken = data.nextPageToken || ''
  } while (pageToken && items.length < maxResults)

  return items
}

// ── Individual video ───────────────────────────────────────────────────────

/** Fetch rich metadata for one or more video IDs (comma-separated string) */
export async function fetchVideos(ids) {
  const { data } = await yt.get('/videos', {
    params: {
      key: KEY,
      id: Array.isArray(ids) ? ids.join(',') : ids,
      part: 'snippet,contentDetails,statistics',
    },
  })
  return data.items ?? []
}

// ── Channel ────────────────────────────────────────────────────────────────

/** Fetch high-level channel stats (used on About page) */
export async function fetchChannelStats() {
  const { data } = await yt.get('/channels', {
    params: {
      key: KEY,
      id: CHANNEL_ID,
      part: 'snippet,statistics,brandingSettings',
    },
  })
  return data.items?.[0] ?? null
}

// ── Search ─────────────────────────────────────────────────────────────────

/** Search within channel — costs 100 units per call, use sparingly */
export async function searchChannel(query, maxResults = 24) {
  const { data } = await yt.get('/search', {
    params: {
      key: KEY,
      channelId: CHANNEL_ID,
      q: query,
      part: 'snippet',
      type: 'video,playlist',
      maxResults,
    },
  })
  return data
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Convert ISO 8601 duration (PT1H2M3S) to human-readable */
export function formatDuration(iso) {
  if (!iso) return ''
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return ''
  const [, h, m, s] = match.map(Number)
  if (h) return `${h}h ${m || 0}m`
  if (m) return `${m}m ${s ? s + 's' : ''}`
  return `${s || 0}s`
}

/** YouTube thumbnail — prefer maxresdefault, fall back gracefully */
export function getThumbnail(snippet, size = 'high') {
  return (
    snippet?.thumbnails?.[size]?.url ||
    snippet?.thumbnails?.medium?.url ||
    snippet?.thumbnails?.default?.url ||
    '/placeholder-thumb.jpg'
  )
}
