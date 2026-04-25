/**
 * AdminDataContext.jsx
 *
 * Hybrid storage:
 *   1. Playlist profiles → fetched from Cloudflare Worker on mount (cached in localStorage)
 *   2. Course overrides  → Cloudflare when configured, localStorage fallback
 *   3. Materials / Books → Cloudflare when configured, localStorage fallback
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import * as storage from "@/services/storage";
import * as cloudflare from "@/services/cloudflare";

const AdminDataContext = createContext(null);

export function AdminDataProvider({ children }) {
  const [version, setVersion] = useState(0);
  const [synced, setSynced] = useState(false);
  const [useCloud, setUseCloud] = useState(cloudflare.isConfigured);
  const [syncingPlaylists, setSyncingPlaylists] = useState({});
  const [profiles, setProfiles] = useState(() => {
    // Hydrate from localStorage on first render to avoid flash
    return storage.get("playlist_profiles", []);
  });

  const bump = useCallback(() => setVersion((v) => v + 1), []);

  // ── On mount: pull playlist profiles from Worker ──────────────────────────
  useEffect(() => {
    if (!cloudflare.isConfigured) {
      setSynced(true);
      return;
    }
    cloudflare
      .fetchProfiles()
      .then((rows) => {
        if (rows.length) {
          setProfiles(rows);
          storage.set("playlist_profiles", rows);
        }
        setSynced(true);
        bump();
      })
      .catch(() => {
        // Fallback to cached localStorage profiles
        const cached = storage.get("playlist_profiles", []);
        if (cached.length) setProfiles(cached);
        setSynced(true);
      });
  }, []); // eslint-disable-line

  // ── On mount: pull overrides into localStorage cache ──────────────────────
  useEffect(() => {
    if (!cloudflare.isConfigured) {
      setSynced(true);
      return;
    }
    cloudflare
      .fetchAllOverrides()
      .then((rows) => {
        const all = {};
        for (const row of rows) {
          all[row.playlist_id] = {
            schoolId: row.school_id,
            programId: row.program_id,
            courseCode: row.course_code,
            instructor: row.instructor,
            semester: row.semester,
            level: row.level,
            description: row.description,
            tags: row.tags ?? [],
          };
        }
        storage.set("course_overrides", all);
        setSynced(true);
        bump();
      })
      .catch(() => {
        setSynced(true);
      });
  }, []); // eslint-disable-line

  // ── Profile helpers (NEW) ─────────────────────────────────────────────────

  const getPlaylistProfile = useCallback(
    (playlistId) => {
      return profiles.find((p) => p.playlistId === playlistId) || null;
    },
    [profiles],
  );

  const getPlaylistCategory = useCallback(
    (playlistId) => {
      return getPlaylistProfile(playlistId)?.category || "course";
    },
    [getPlaylistProfile],
  );

  const isSpecialPlaylist = useCallback(
    (playlistId) => {
      return getPlaylistCategory(playlistId) !== "course";
    },
    [getPlaylistCategory],
  );

  // ── Course override CRUD ──────────────────────────────────────────────────

  const syncCourseContent = useCallback(
    async (playlistId) => {
      if (!useCloud || syncingPlaylists[playlistId]) return;
      setSyncingPlaylists((p) => ({ ...p, [playlistId]: true }));
      try {
        const [cloudMats, cloudBooks] = await Promise.all([
          cloudflare.fetchMaterials(playlistId),
          cloudflare.fetchBooks(playlistId),
        ]);

        const formattedMats = cloudMats.map((m) => ({
          id: m.id,
          type: m.type,
          label: m.label,
          url: m.url,
          file_path: m.file_key,
          file_size: m.file_size,
          mime_type: m.mime_type,
          cloudId: m.id,
        }));

        const formattedBooks = cloudBooks.map((b) => ({
          ...b,
          cloudId: b.id,
        }));

        storage.set(`materials_${playlistId}`, formattedMats);
        storage.set(`books_${playlistId}`, formattedBooks);
        bump();
      } catch (e) {
        console.warn("Failed to sync materials from cloud", e);
      } finally {
        setSyncingPlaylists((p) => ({ ...p, [playlistId]: false }));
      }
    },
    [bump, useCloud, syncingPlaylists],
  );

  const getCourseData = useCallback(
    (playlistId) => storage.getOverride(playlistId),
    [version],
  );

  const saveCourseData = useCallback(
    async (playlistId, data) => {
      storage.saveOverride(playlistId, data);
      if (useCloud) {
        try {
          await cloudflare.upsertOverride(playlistId, data);
        } catch {
          /* local fallback ok */
        }
      }
      bump();
    },
    [bump, useCloud],
  );

  // ── Materials ─────────────────────────────────────────────────────────────

  const getMaterials = useCallback(
    (playlistId) => storage.getMaterials(playlistId),
    [version],
  );

  const addMaterial = useCallback(
    async (playlistId, mat) => {
      let finalMat = { ...mat };
      delete finalMat.file;

      if (mat.file && useCloud) {
        try {
          const { publicUrl, size, mimeType } = await cloudflare.uploadFile(
            mat.file,
            playlistId,
          );
          finalMat.url = publicUrl;
          finalMat.file_size = size;
          finalMat.mime_type = mimeType;
        } catch (e) {
          console.warn("Upload failed, using provided URL:", e.message);
        }
      }

      const item = storage.addMaterial(playlistId, finalMat);

      if (useCloud) {
        try {
          const row = await cloudflare.insertMaterial(playlistId, {
            type: finalMat.type,
            label: finalMat.label,
            url: finalMat.url,
            file_path: finalMat.file_path,
            file_size: finalMat.file_size,
            mime_type: finalMat.mime_type,
          });
          if (row?.id) {
            const list = storage
              .getMaterials(playlistId)
              .map((m) => (m.id === item.id ? { ...m, cloudId: row.id } : m));
            storage.set(`materials_${playlistId}`, list);
          }
        } catch {
          /* local only is fine */
        }
      }

      bump();
      return item;
    },
    [bump, useCloud],
  );

  const deleteMaterial = useCallback(
    async (playlistId, materialId) => {
      const mat = storage
        .getMaterials(playlistId)
        .find((m) => m.id === materialId);
      storage.deleteMaterial(playlistId, materialId);
      if (useCloud && mat?.cloudId) {
        try {
          await cloudflare.deleteMaterial(mat.cloudId);
        } catch {}
      }
      bump();
    },
    [bump, useCloud],
  );

  // ── Books ─────────────────────────────────────────────────────────────────

  const getBooks = useCallback(
    (playlistId) => storage.getBooks(playlistId),
    [version],
  );

  const addBook = useCallback(
    async (playlistId, book) => {
      const item = storage.addBook(playlistId, book);
      if (useCloud) {
        try {
          const row = await cloudflare.insertBook(playlistId, book);
          if (row?.id) {
            const list = storage
              .getBooks(playlistId)
              .map((b) => (b.id === item.id ? { ...b, cloudId: row.id } : b));
            storage.set(`books_${playlistId}`, list);
          }
        } catch {}
      }
      bump();
      return item;
    },
    [bump, useCloud],
  );

  const deleteBook = useCallback(
    async (playlistId, bookId) => {
      const bk = storage.getBooks(playlistId).find((b) => b.id === bookId);
      storage.deleteBook(playlistId, bookId);
      if (useCloud && bk?.cloudId) {
        try {
          await cloudflare.deleteBook(bk.cloudId);
        } catch {}
      }
      bump();
    },
    [bump, useCloud],
  );

  const value = useMemo(
    () => ({
      version,
      synced,
      useCloud,
      profiles,
      getPlaylistProfile,
      getPlaylistCategory,
      isSpecialPlaylist,
      getCourseData,
      saveCourseData,
      getMaterials,
      addMaterial,
      deleteMaterial,
      getBooks,
      addBook,
      deleteBook,
      syncCourseContent,
    }),
    [
      version,
      synced,
      useCloud,
      profiles,
      getPlaylistProfile,
      getPlaylistCategory,
      isSpecialPlaylist,
      getCourseData,
      saveCourseData,
      getMaterials,
      addMaterial,
      deleteMaterial,
      getBooks,
      addBook,
      deleteBook,
      syncCourseContent,
    ],
  );

  return (
    <AdminDataContext.Provider value={value}>
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error("useAdminData must be inside AdminDataProvider");
  return ctx;
}
