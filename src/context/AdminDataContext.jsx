/**
 * AdminDataContext.jsx
 *
 * Hybrid storage: Supabase when configured, localStorage as fallback.
 * The admin panel writes to Supabase (if VITE_SUPABASE_URL is set) so data
 * persists across devices. Falls back to localStorage when offline.
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import * as storage from "@/services/storage";
import * as supabase from "@/services/cloudflare";

const AdminDataContext = createContext(null);

export function AdminDataProvider({ children }) {
  const [version, setVersion] = useState(0);
  const [synced, setSynced] = useState(false);
  const [useCloud, setUseCloud] = useState(supabase.isConfigured);

  const bump = useCallback(() => setVersion((v) => v + 1), []);

  // ── On mount: pull Supabase overrides into localStorage cache ───────────────
  useEffect(() => {
    if (!supabase.isConfigured) {
      setSynced(true);
      return;
    }
    supabase
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
  }, []);

  // ── Course override CRUD ─────────────────────────────────────────────────────

  const getCourseData = useCallback(
    (playlistId) => {
      return storage.getOverride(playlistId);
    },
    [version],
  ); // eslint-disable-line

  const saveCourseData = useCallback(
    async (playlistId, data) => {
      storage.saveOverride(playlistId, data);
      if (useCloud) {
        try {
          await supabase.upsertOverride(playlistId, data);
        } catch {
          /* local fallback ok */
        }
      }
      bump();
    },
    [bump, useCloud],
  );

  // ── Materials ────────────────────────────────────────────────────────────────

  const getMaterials = useCallback(
    (playlistId) => {
      return storage.getMaterials(playlistId);
    },
    [version],
  ); // eslint-disable-line

  const addMaterial = useCallback(
    async (playlistId, mat) => {
      // mat may include a `file` (File object) for upload OR just a URL
      let finalMat = { ...mat };
      delete finalMat.file;

      if (mat.file && useCloud) {
        try {
          const { publicUrl, size, mimeType } = await supabase.uploadFile(
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
          const row = await supabase.insertMaterial(playlistId, {
            type: finalMat.type,
            label: finalMat.label,
            url: finalMat.url,
            file_path: finalMat.file_path,
            file_size: finalMat.file_size,
            mime_type: finalMat.mime_type,
          });
          // Store cloud ID alongside local ID
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
          await supabase.deleteMaterial(mat.cloudId);
        } catch {}
      }
      bump();
    },
    [bump, useCloud],
  );

  // ── Books ────────────────────────────────────────────────────────────────────

  const getBooks = useCallback(
    (playlistId) => {
      return storage.getBooks(playlistId);
    },
    [version],
  ); // eslint-disable-line

  const addBook = useCallback(
    async (playlistId, book) => {
      const item = storage.addBook(playlistId, book);
      if (useCloud) {
        try {
          const row = await supabase.insertBook(playlistId, book);
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
          await supabase.deleteBook(bk.cloudId);
        } catch {}
      }
      bump();
    },
    [bump, useCloud],
  );

  return (
    <AdminDataContext.Provider
      value={{
        version,
        synced,
        useCloud,
        getCourseData,
        saveCourseData,
        getMaterials,
        addMaterial,
        deleteMaterial,
        getBooks,
        addBook,
        deleteBook,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error("useAdminData must be inside AdminDataProvider");
  return ctx;
}
