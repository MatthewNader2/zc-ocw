import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import {
  fetchPlaylists,
  fetchPlaylist,
  fetchPlaylistItems,
  fetchVideos,
  fetchChannelStats,
  searchChannel,
} from '@/services/youtube'
import { enrichCourse } from '@/data/courses'

// ── All playlists (= course catalog) ──────────────────────────────────────

export function usePlaylists() {
  return useInfiniteQuery({
    queryKey: ['playlists'],
    queryFn: ({ pageParam = '' }) => fetchPlaylists({ pageToken: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    select: (data) => ({
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        items: page.items.map(enrichCourse),
      })),
    }),
  })
}

// ── Single course / playlist ──────────────────────────────────────────────

export function useCourse(playlistId) {
  return useQuery({
    queryKey: ['playlist', playlistId],
    queryFn: () => fetchPlaylist(playlistId),
    enabled: !!playlistId,
    select: (data) => enrichCourse(data),
  })
}

// ── Lectures in a course ──────────────────────────────────────────────────

export function useLectures(playlistId) {
  return useQuery({
    queryKey: ['lectures', playlistId],
    queryFn: () => fetchPlaylistItems(playlistId),
    enabled: !!playlistId,
  })
}

// ── Single video ──────────────────────────────────────────────────────────

export function useVideo(videoId) {
  return useQuery({
    queryKey: ['video', videoId],
    queryFn: () => fetchVideos([videoId]).then((items) => items[0] ?? null),
    enabled: !!videoId,
  })
}

// ── Channel stats ─────────────────────────────────────────────────────────

export function useChannelStats() {
  return useQuery({
    queryKey: ['channelStats'],
    queryFn: fetchChannelStats,
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}

// ── Search ────────────────────────────────────────────────────────────────

export function useSearch(query) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => searchChannel(query),
    enabled: !!query && query.length >= 2,
    staleTime: 1000 * 60 * 5,
  })
}
