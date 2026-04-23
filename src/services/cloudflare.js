/**
 * src/services/cloudflare.js
 *
 * Client for the Cloudflare Worker API.
 * Identical interface to the old supabase.js so AdminDataContext needs
 * only one import line changed.
 */

const BASE = import.meta.env.VITE_WORKER_URL;
const PASS = import.meta.env.VITE_ADMIN_PASSWORD;

export const isConfigured = !!BASE;

// ── Generic fetch ────────────────────────────────────────────────────────────

async function call(path, { method = "GET", body, admin = false } = {}) {
  if (!isConfigured) throw new Error("VITE_WORKER_URL not set in .env");

  const headers = { "Content-Type": "application/json" };
  if (admin) headers["Authorization"] = `Bearer ${PASS}`;

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

  const formData = new FormData();
  formData.append("file", file);
  formData.append("label", file.name);

  const res = await fetch(`${BASE}/api/upload/${playlistId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${PASS}` },
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
      fileKey: mat.fileKey || null,
      fileSize: mat.fileSize || null,
      mimeType: mat.mimeType || null,
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
