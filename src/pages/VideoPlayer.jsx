import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useVideo, useLectures, useCourse } from '@/hooks/useYouTube'
import { formatDuration } from '@/services/youtube'
import VideoCard from '@/components/ui/VideoCard'
import { PageLoader, VideoCardSkeleton } from '@/components/ui/LoadingSpinner'

export default function VideoPlayer() {
  const { playlistId, videoId } = useParams()

  const { data: video,    isLoading: videoLoading    } = useVideo(videoId)
  const { data: course                                } = useCourse(playlistId)
  const { data: lectures, isLoading: lecturesLoading  } = useLectures(playlistId)

  const title = video?.snippet?.title ?? 'Loading…'
  const desc  = video?.snippet?.description ?? ''
  const duration = formatDuration(video?.contentDetails?.duration)
  const views = Number(video?.statistics?.viewCount ?? 0).toLocaleString()

  return (
    <>
      <Helmet>
        <title>{title} — ZC OCW</title>
      </Helmet>

      {/* Breadcrumb */}
      <div className="bg-zc-navy/95 text-white/70 text-sm py-2">
        <div className="section flex gap-2 items-center overflow-x-auto whitespace-nowrap">
          <Link to="/courses" className="hover:text-white transition-colors">Courses</Link>
          <span>/</span>
          <Link to={`/courses/${playlistId}`} className="hover:text-white transition-colors truncate max-w-xs">
            {course?.snippet?.title ?? '…'}
          </Link>
          <span>/</span>
          <span className="text-white/40 truncate max-w-xs">{title}</span>
        </div>
      </div>

      <div className="section py-6 grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main — video + info */}
        <div className="xl:col-span-2">
          {videoLoading ? (
            <PageLoader />
          ) : (
            <>
              {/* Embedded YouTube player */}
              <div className="yt-embed-wrapper rounded-2xl overflow-hidden shadow-lg bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1`}
                  title={title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {/* Video metadata */}
              <div className="mt-5">
                <h1 className="font-display text-2xl md:text-3xl text-zc-navy font-bold leading-snug mb-2">
                  {title}
                </h1>
                <div className="flex flex-wrap gap-4 text-sm text-zc-gray mb-4">
                  {duration && <span>⏱ {duration}</span>}
                  {video?.statistics?.viewCount && <span>👁 {views} views</span>}
                  {video?.snippet?.publishedAt && (
                    <span>📅 {new Date(video.snippet.publishedAt).toLocaleDateString('en-EG', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}</span>
                  )}
                </div>

                {/* Description (collapsed) */}
                <details className="bg-gray-50 rounded-xl p-4 text-sm text-zc-gray leading-relaxed">
                  <summary className="cursor-pointer font-semibold text-zc-navy">
                    Description
                  </summary>
                  <p className="mt-3 whitespace-pre-line">{desc || 'No description.'}</p>
                </details>

                {/* Next / Prev buttons */}
                <div className="flex gap-3 mt-6">
                  {(() => {
                    if (!lectures) return null
                    const idx = lectures.findIndex(
                      l => (l.contentDetails?.videoId || l.snippet?.resourceId?.videoId) === videoId
                    )
                    const prev = lectures[idx - 1]
                    const next = lectures[idx + 1]
                    const getId = l => l?.contentDetails?.videoId || l?.snippet?.resourceId?.videoId
                    return (
                      <>
                        {prev && (
                          <Link to={`/courses/${playlistId}/watch/${getId(prev)}`}
                                className="btn-outline text-sm">
                            ← Previous
                          </Link>
                        )}
                        {next && (
                          <Link to={`/courses/${playlistId}/watch/${getId(next)}`}
                                className="btn-primary text-sm ml-auto">
                            Next lecture →
                          </Link>
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sidebar — playlist */}
        <aside>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-zc-navy text-white p-4">
              <Link to={`/courses/${playlistId}`}
                    className="text-white/60 text-xs hover:text-white transition-colors block mb-1">
                ← Course overview
              </Link>
              <h2 className="font-display text-base font-semibold leading-snug">
                {course?.snippet?.title ?? 'Playlist'}
              </h2>
              <p className="text-white/50 text-xs mt-0.5">
                {lectures?.length ?? '…'} lectures
              </p>
            </div>
            <div className="overflow-y-auto max-h-[70vh] divide-y divide-gray-50">
              {lecturesLoading
                ? Array.from({ length: 8 }).map((_, i) => <VideoCardSkeleton key={i} />)
                : lectures?.map((item, i) => {
                    const id = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId
                    return (
                      <VideoCard
                        key={item.id}
                        item={item}
                        playlistId={playlistId}
                        index={i}
                        active={id === videoId}
                      />
                    )
                  })
              }
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}
