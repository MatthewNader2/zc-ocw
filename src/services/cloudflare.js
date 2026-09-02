/**
 * src/services/cloudflare.js
 *
 * Client for the Cloudflare Worker API.
 * Identical interface to the old supabase.js so AdminDataContext needs
 * only one import line changed.
 */

import { getIdToken } from "./firebase";

const BASE = import.meta.env.VITE_WORKER_URL;

export const isConfigured = !!BASE;

// ── Generic fetch ────────────────────────────────────────────────────────────

async function call(path, { method = "GET", body, admin = false } = {}) {
  if (!isConfigured) throw new Error("VITE_WORKER_URL not set in .env");

  const headers = { "Content-Type": "application/json" };
  if (admin) {
    const token = await getIdToken();
    if (!token) throw new Error("Not signed in");
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}/api/${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `API error ${res.status}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ── File upload (multipart, separate from JSON calls) ────────────────────────

export async function uploadFile(file, playlistId) {
  if (!isConfigured) throw new Error("VITE_WORKER_URL not set");

  const token = await getIdToken();
  if (!token) throw new Error("Not signed in");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("label", file.name);

  const res = await fetch(`${BASE}/api/upload/${playlistId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
    // Note: do NOT set Content-Type here — browser sets it automatically
    // with the correct multipart boundary
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Upload failed ${res.status}`);
  }

  const data = await res.json();
  return {
    publicUrl: data.publicUrl || "",
    size: file.size,
    mimeType: file.type,
  };
}

// ── Course overrides ─────────────────────────────────────────────────────────

export async function fetchAllOverrides() {
  if (!isConfigured) return [];
  const rows = await call("overrides");
  return (rows ?? []).map((r) => ({
    playlist_id: r.playlist_id,
    schoolId: r.school_id,
    programId: r.program_id,
    courseCode: r.course_code,
    instructor: r.instructor,
    semester: r.semester,
    level: r.level,
    description: r.description,
    tags: typeof r.tags === "string" ? JSON.parse(r.tags) : (r.tags ?? []),
  }));
}

export async function upsertOverride(playlistId, data) {
  if (!isConfigured) return;
  await call(`overrides/${playlistId}`, {
    method: "PUT",
    body: data,
    admin: true,
  });
}

// ── Materials ────────────────────────────────────────────────────────────────

export async function fetchMaterials(playlistId) {
  if (!isConfigured) return [];
  return (await call(`materials/${playlistId}`)) ?? [];
}

export async function insertMaterial(playlistId, mat) {
  if (!isConfigured) return null;
  return call(`materials/${playlistId}`, {
    method: "POST",
    body: {
      type: mat.type,
      label: mat.label,
      url: mat.url || null,
      fileKey: mat.fileKey || mat.file_path || null,
      fileSize: mat.fileSize || mat.file_size || null,
      mimeType: mat.mimeType || mat.mime_type || null,
    },
    admin: true,
  });
}

export async function deleteMaterial(id) {
  if (!isConfigured) return;
  await call(`materials/${id}`, { method: "DELETE", admin: true });
}

// ── Books ────────────────────────────────────────────────────────────────────

export async function fetchBooks(playlistId) {
  if (!isConfigured) return [];
  return (await call(`books/${playlistId}`)) ?? [];
}

export async function insertBook(playlistId, book) {
  if (!isConfigured) return null;
  return call(`books/${playlistId}`, {
    method: "POST",
    body: book,
    admin: true,
  });
}

export async function deleteBook(id) {
  if (!isConfigured) return;
  await call(`books/${id}`, { method: "DELETE", admin: true });
}

// ── Acknowledgments page config ────────────────────────────────────────────
// Single JSON blob (header text, image slides, team, sponsors) — synced so
// every visitor sees what an admin published, not just the admin's own browser.

export async function fetchAcknowledgments() {
  if (!isConfigured) return null;
  return call("acknowledgments");
}

export async function upsertAcknowledgments(config) {
  if (!isConfigured) return;
  await call("acknowledgments", { method: "PUT", body: config, admin: true });
}

// ── Custom Schools & Programs catalog config ──────────────────────────────

export async function fetchSchoolsPrograms() {
  if (!isConfigured) return null;
  return call("schools-programs");
}

export async function upsertSchoolsPrograms(config) {
  if (!isConfigured) return;
  await call("schools-programs", { method: "PUT", body: config, admin: true });
}

// ── Per-account user data (bookmarks, watch progress) ────────────────────

export async function fetchUserData(key, token) {
  if (!isConfigured || !token) return null;
  const res = await fetch(`${BASE}/api/user-data/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function putUserData(key, value, token) {
  if (!isConfigured || !token) return;
  try {
    await fetch(`${BASE}/api/user-data/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(value),
    });
  } catch {}
}

// ── Generic page content CMS ──────────────────────────────────────────────

export async function fetchPageContent(slug) {
  if (!isConfigured) return null;
  return call(`pages/${encodeURIComponent(slug)}`);
}

export async function upsertPageContent(slug, content) {
  if (!isConfigured) return;
  await call(`pages/${encodeURIComponent(slug)}`, { method: "PUT", body: content, admin: true });
}

// ── Site stats & activity ──────────────────────────────────────────────────

export async function pingStats() {
  if (!isConfigured) return;
  fetch(`${BASE}/api/stats/ping`, { method: "POST" }).catch(() => {});
}

export async function fetchActiveStats() {
  if (!isConfigured) return { activeLearners: 12, totalViews: 0 };
  return (await call("stats/active")) ?? { activeLearners: 12, totalViews: 0 };
}

// ── Sky Ephemeris & Weather ────────────────────────────────────────────────

export async function fetchSky() {
  if (!isConfigured) return null;
  return call("sky");
}

export async function fetchWeather() {
  if (!isConfigured) return null;
  return call("weather");
}

export async function fetchIss() {
  if (!isConfigured) return null;
  return call("iss");
}

// ── Admin team management ────────────────────────────────────────────────────
// Distinct from the content sync above — this manages who is allowed into
// /admin at all. All require the caller to already be an admin
// (enforced server-side); the Worker rejects otherwise.

export async function fetchAdmins() {
  return call("admins", { admin: true });
}

export async function grantAdmin(email, role = "moderator") {
  return call("admins", { method: "POST", body: { email, role }, admin: true });
}

export async function updateAdminRole(email, role) {
  return call(`admins/${encodeURIComponent(email)}`, { method: "PUT", body: { role }, admin: true });
}

export async function revokeAdmin(email) {
  return call(`admins/${encodeURIComponent(email)}`, { method: "DELETE", admin: true });
}

// ── Admin Feedback / Bug Reports ─────────────────────────────────────────────

export async function fetchFeedback(type) {
  if (!isConfigured) return [];
  const query = type && type !== "all" ? `?type=${encodeURIComponent(type)}` : "";
  return (await call(`feedback${query}`, { admin: true })) ?? [];
}


// ── Playlist Profiles ────────────────────────────────────────────────────────

export async function fetchProfiles() {
  if (!isConfigured) return [];
  const rows = await call("profiles");
  return (rows ?? []).map(normalizeProfile);
}

export async function fetchProfile(playlistId) {
  if (!isConfigured) return null;
  const row = await call(`profiles/${playlistId}`);
  return row ? normalizeProfile(row) : null;
}

export async function upsertProfile(playlistId, data) {
  if (!isConfigured) return;
  await call(`profiles/${playlistId}`, {
    method: "PUT",
    body: data,
    admin: true,
  });
}

export async function upsertProfilesBulk(profiles) {
  if (!isConfigured) return;
  await call("profiles", {
    method: "PUT",
    body: profiles,
    admin: true,
  });
}

// Normalize D1 row shape → app shape
function normalizeProfile(row) {
  return {
    playlistId: row.playlist_id,
    title: row.title,
    cleanedTitle: row.cleaned_title,
    category: row.category || "course",
    lectureCount: row.lecture_count,
    metadata: {
      semester: row.semester,
      year: row.year,
      isIncomplete: !!row.is_incomplete,
      extractedInstructor: row.instructor,
    },
    detection:
      typeof row.detection === "string"
        ? JSON.parse(row.detection)
        : row.detection || {},
    suggested:
      typeof row.suggested === "string"
        ? JSON.parse(row.suggested)
        : row.suggested || {},
  };
}
