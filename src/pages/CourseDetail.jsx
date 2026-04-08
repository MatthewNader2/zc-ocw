import { Link, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useCourse, useLectures } from '@/hooks/useYouTube'
import { getThumbnail } from '@/services/youtube'
import { getDepartment } from '@/data/courses'
import VideoCard from '@/components/ui/VideoCard'
import { PageLoader, VideoCardSkeleton } from '@/components/ui/LoadingSpinner'
import ErrorMessage from '@/components/ui/ErrorMessage'

export default function CourseDetail() {
  const { playlistId } = useParams()
  const { data: course,   isLoading: courseLoading,   isError: courseError   } = useCourse(playlistId)
  const { data: lectures, isLoading: lecturesLoading, isError: lecturesError } = useLectures(playlistId)

  if (courseLoading) return <PageLoader />
  if (courseError || !course) return <ErrorMessage title="Course not found" />

  const { snippet, contentDetails, meta = {} } = course
  const dept = getDepartment(meta.department)
  const firstVideoId = lectures?.[0]?.contentDetails?.videoId ||
                       lectures?.[0]?.snippet?.resourceId?.videoId

  return (
    <>
      <Helmet>
        <title>{snippet.title} — ZC OCW</title>
        <meta name="description" content={snippet.description?.slice(0, 160)} />
      </Helmet>

      {/* Hero */}
      <div className="bg-zc-navy text-white">
        <div className="section py-12">
          <Link to="/courses" className="btn-ghost text-white/60 hover:text-white text-sm mb-6 inline-flex">
            ← Back to courses
          </Link>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Info */}
            <div className="flex-1">
              {dept && (
                <span className={`badge text-xs mb-3 ${dept.color}`}>{dept.label}</span>
              )}
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-4 leading-snug">
                {snippet.title}
              </h1>
              <p className="text-white/70 leading-relaxed mb-6 max-w-2xl">
                {snippet.description || 'No description provided.'}
              </p>

              <div className="flex flex-wrap gap-4 text-sm text-white/60 mb-8">
                {meta.instructor && (
                  <span className="flex items-center gap-1.5">
                    <span>👤</span> {meta.instructor}
                  </span>
                )}
                {meta.semester && (
                  <span className="flex items-center gap-1.5">
                    <span>📅</span> {meta.semester}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <span>🎬</span> {contentDetails.itemCount} lectures
                </span>
                <span className="flex items-center gap-1.5">
                  <span>🆓</span> Free
                </span>
              </div>

              {firstVideoId && (
                <Link
                  to={`/courses/${playlistId}/watch/${firstVideoId}`}
                  className="btn-primary text-base px-8 py-3"
                >
                  ▶ Start Course
                </Link>
              )}
            </div>

            {/* Thumbnail */}
            <div className="w-full lg:w-80 flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={getThumbnail(snippet, 'high')}
                alt={snippet.title}
                className="w-full aspect-video object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="section py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Lectures list */}
        <div className="lg:col-span-2">
          <h2 className="font-display text-2xl text-zc-navy mb-4">Lectures</h2>
          {lecturesLoading
            ? Array.from({ length: 8 }).map((_, i) => <VideoCardSkeleton key={i} />)
            : lecturesError
            ? <ErrorMessage title="Could not load lectures" />
            : lectures?.map((item, i) => (
                <VideoCard key={item.id} item={item} playlistId={playlistId} index={i} />
              ))
          }
        </div>

        {/* Sidebar — materials & info */}
        <aside className="space-y-6">
          {/* Course materials */}
          {meta.materials?.length > 0 && (
            <div className="card p-5">
              <h3 className="font-display text-lg text-zc-navy mb-3">📂 Course Materials</h3>
              <ul className="space-y-2">
                {meta.materials.map(m => (
                  <li key={m.url}>
                    <a href={m.url} target="_blank" rel="noopener noreferrer"
                       className="text-sm text-zc-sky hover:underline flex items-center gap-2">
                      <span>↓</span> {m.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* About */}
          <div className="card p-5">
            <h3 className="font-display text-lg text-zc-navy mb-3">ℹ️ About this Course</h3>
            <dl className="space-y-2 text-sm">
              {meta.level && (
                <div className="flex justify-between">
                  <dt className="text-zc-gray">Level</dt>
                  <dd className="font-semibold text-zc-navy">{meta.level}</dd>
                </div>
              )}
              {meta.instructor && (
                <div className="flex justify-between">
                  <dt className="text-zc-gray">Instructor</dt>
                  <dd className="font-semibold text-zc-navy">{meta.instructor}</dd>
                </div>
              )}
              {meta.semester && (
                <div className="flex justify-between">
                  <dt className="text-zc-gray">Semester</dt>
                  <dd className="font-semibold text-zc-navy">{meta.semester}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-zc-gray">Lectures</dt>
                <dd className="font-semibold text-zc-navy">{contentDetails.itemCount}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </>
  )
}
