/**
 * src/services/youtube.js
 * * Now proxying through Cloudflare Workers to hide the API Key.
 */

// Point to your Cloudflare Worker instead of direct Google APIs
const BASE = `${import.meta.env.VITE_WORKER_URL}/api/youtube`;
const CHANNEL_ID = import.meta.env.VITE_YOUTUBE_CHANNEL_ID;

async function ytGet(endpoint, params = {}) {
  const url = new URL(`${BASE}${endpoint}`);
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      url.searchParams.append(key, val);
    }
  });
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`YouTube API error: ${res.status}`);
  }
  return res.json();
}

// ── Playlists (= courses) ──────────────────────────────────────────────────

export async function fetchPlaylists({ pageToken = "", maxResults = 50 } = {}) {
  return ytGet("/playlists", {
    channelId: CHANNEL_ID,
    maxResults,
    pageToken: pageToken || undefined,
  });
}

export async function fetchPlaylist(playlistId) {
  const data = await ytGet("/playlists", {
    // Note: Our Worker handles 'id' vs 'channelId' logic
    id: playlistId,
    part: "snippet,contentDetails",
  });
  return data.items?.[0] ?? null;
}

// ── Playlist items (= lectures) ────────────────────────────────────────────

export async function fetchPlaylistItems(playlistId, maxResults = 50) {
  let items = [];
  let pageToken = "";

  do {
    const data = await ytGet("/playlistItems", {
      playlistId,
      maxResults: Math.min(maxResults - items.length, 50),
      pageToken: pageToken || undefined,
    });
    items = [...items, ...(data.items || [])];
    pageToken = data.nextPageToken || "";
  } while (pageToken && items.length < maxResults);

  return items;
}

// ── Individual video ───────────────────────────────────────────────────────

export async function fetchVideos(ids) {
  const data = await ytGet("/videos", {
    id: Array.isArray(ids) ? ids.join(",") : ids,
  });
  return data.items ?? [];
}

// ── Channel ────────────────────────────────────────────────────────────────

export async function fetchChannelStats() {
  const data = await ytGet("/channels", {
    id: CHANNEL_ID,
  });
  return data.items?.[0] ?? null;
}

// ── Search ─────────────────────────────────────────────────────────────────

export async function searchChannel(query, maxResults = 24) {
  return ytGet("/search", {
    channelId: CHANNEL_ID,
    q: query,
    maxResults,
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function formatDuration(iso) {
  if (!iso) return "";
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "";
  const [, h, m, s] = match.map(Number);
  if (h) return `${h}h ${m || 0}m`;
  if (m) return `${m}m ${s ? s + "s" : ""}`;
  return `${s || 0}s`;
}

export function getThumbnail(snippet, size = "high") {
  return (
    snippet?.thumbnails?.[size]?.url ||
    snippet?.thumbnails?.medium?.url ||
    snippet?.thumbnails?.default?.url ||
    "/placeholder-thumb.jpg"
  );
}
