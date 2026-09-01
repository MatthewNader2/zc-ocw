import autoProfiles from "./auto-profiles.json";
import * as storage from "@/services/storage";

const PROFILES_MAP = new Map(
  (autoProfiles.results ?? []).map((r) => [r.playlistId, r]),
);

/** Get the full profiler record for a playlist (or null) */
export function getPlaylistProfile(playlistId) {
  return PROFILES_MAP.get(playlistId) ?? null;
}

/** 'course' | 'interviews' | 'public-lectures' | 'special' | 'club' */
export function getPlaylistCategory(playlistId, title = "") {
  // 1. Check admin override first
  const override = storage.getOverride(playlistId);
  if (override?.category) return override.category;

  // 2. Check static profile
  const profileCat = getPlaylistProfile(playlistId)?.category;
  if (profileCat) return profileCat;

  // 3. Dynamic title detection
  if (title) {
    const lower = title.toLowerCase();
    if (/\b(interview|interviews|podcast|conversation|q&a|qa|talk)\b/i.test(lower)) {
      return "interviews";
    }
    if (/\b(public lecture|seminar|symposium|colloquium|keynote|guest lecture)\b/i.test(lower)) {
      return "public-lectures";
    }
    if (/\b(club|society|student activity)\b/i.test(lower)) {
      return "club";
    }
    if (/\b(special|once upon|panel|workshop|summer school)\b/i.test(lower)) {
      return "special";
    }
  }

  return "course";
}

/** True for anything that is not a standard course */
export function isSpecialPlaylist(playlistId, title = "") {
  return getPlaylistCategory(playlistId, title) !== "course";
}
