import autoProfiles from "./auto-profiles.json";

const PROFILES_MAP = new Map(
  (autoProfiles.results ?? []).map((r) => [r.playlistId, r]),
);

/** Get the full profiler record for a playlist (or null) */
export function getPlaylistProfile(playlistId) {
  return PROFILES_MAP.get(playlistId) ?? null;
}

/** 'course' | 'interviews' | 'public-lectures' | 'special' | 'club' */
export function getPlaylistCategory(playlistId) {
  return getPlaylistProfile(playlistId)?.category || "course";
}

/** True for anything that is not a standard course */
export function isSpecialPlaylist(playlistId) {
  return getPlaylistCategory(playlistId) !== "course";
}
