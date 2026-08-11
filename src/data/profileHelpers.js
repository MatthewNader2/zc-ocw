import autoProfiles from "./auto-profiles.json";

const PROFILES_MAP = new Map(
  (autoProfiles.results ?? []).map((r) => [r.playlistId, r]),
);

/** Get the full profiler record for a playlist (or null) */
export function getPlaylistProfile(playlistId) {
  return PROFILES_MAP.get(playlistId) ?? null;
}

/** 'course' | 'interviews' | 'public-lectures' | 'special' | 'club' */
export function getPlaylistCategory(playlistId, title = "") {
  const profileCat = getPlaylistProfile(playlistId)?.category;
  if (profileCat) return profileCat;

  if (title) {
    const lower = title.toLowerCase();
    if (/\b(interview|interviews|podcast|conversation|q&a|qa)\b/i.test(lower)) {
      return "interviews";
    }
    if (/\b(public lecture|seminar|symposium|colloquium|keynote|guest lecture)\b/i.test(lower)) {
      return "public-lectures";
    }
    if (/\b(club|society|student activity)\b/i.test(lower)) {
      return "club";
    }
    if (/\b(special|once upon|panel)\b/i.test(lower)) {
      return "special";
    }
  }

  return "course";
}

/** True for anything that is not a standard course */
export function isSpecialPlaylist(playlistId, title = "") {
  return getPlaylistCategory(playlistId, title) !== "course";
}
