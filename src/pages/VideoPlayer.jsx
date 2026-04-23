import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ChevronRight, CheckCircle2, NotebookPen, ChevronDown, Play, ArrowLeft, ArrowRight } from 'lucide-react'
import { useVideo, useLectures, useCourse } from '@/hooks/useYouTube'
import { getThumbnail }      from '@/services/youtube'
import { useProgress }       from '@/context/ProgressContext'
import { useSettings }       from '@/context/SettingsContext'
import PlayerWrapper         from '@/components/ui/PlayerWrapper'
import { PageLoader, VideoCardSkeleton } from '@/components/ui/LoadingSpinner'
import clsx from 'clsx'

function WatchedCheckmark({ videoId }) {
  const { isWatched } = useProgress()
  if (!isWatched(videoId)) return null
  return <CheckCircle2 className="w-3.5 h-3.5 text-ocean-400 flex-shrink-0" />
}

export default function VideoPlayer() {
  const { playlistId, videoId } = useParams()
  const { data: video,    isLoading: vl } = useVideo(videoId)
  const { data: course  }                 = useCourse(playlistId)
  const { data: lectures, isLoading: ll } = useLectures(playlistId)
  const { markWatched, isWatched, getNote, saveNote } = useProgress()
  const { settings } = useSettings()

  const [note,      setNote]      = useState('')
  const [noteDirty, setNoteDirty] = useState(false)
  const [noteOpen,  setNoteOpen]  = useState(false)
  const [descOpen,  setDescOpen]  = useState(false)

  const title     = video?.snippet?.title ?? 'Loading…'
  const desc      = video?.snippet?.description ?? ''
  const watched   = isWatched(videoId)

  // Load note
  useEffect(() => {
    const saved = getNote(videoId)
    setNote(saved); setNoteDirty(false)
  }, [videoId])

  // Auto-mark watched
  useEffect(() => {
    const t = setTimeout(() => {
      markWatched(videoId, playlistId, {
        title: video?.snippet?.title,
        thumbnail: getThumbnail(video?.snippet, 'medium'),
      })
    }, 8000)
    return () => clearTimeout(t)
  }, [videoId, video?.snippet?.title])

  // Lecture nav
  const lectureIds = lectures?.map(l => l.contentDetails?.videoId || l.snippet?.resourceId?.videoId).filter(Boolean) ?? []
  const idx        = lectureIds.indexOf(videoId)
  const prevId     = lectureIds[idx - 1]
  const nextId     = lectureIds[idx + 1]
  const progress   = lectures?.length ? Math.round(((idx + 1) / lectures.length) * 100) : 0

  function handleNoteBlur() {
    if (noteDirty) { saveNote(videoId, note); setNoteDirty(false) }
  }

  function handleEnded() {
    if (settings.autoplayNext && nextId) {
      setTimeout(() => window.location.href = `/courses/${playlistId}/watch/${nextId}`, 1000)
    }
  }

  return (
    <>
      <Helmet><title>{title} — ZC OCW</title></Helmet>

      {/* Breadcrumb */}
      <div className="bg-ocean-950/98 border-b border-white/6 py-2.5">
        <div className="section flex items-center gap-1.5 text-xs text-white/45 overflow-x-auto whitespace-nowrap">
          <Link to="/courses" className="hover:text-white transition-colors">Courses</Link>
          <ChevronRight className="w-3 h-3 flex-shrink-0" />
          <Link to={`/courses/${playlistId}`} className="hover:text-white transition-colors truncate max-w-[200px]">
            {course?.snippet?.title ?? '…'}
          </Link>
          <ChevronRight className="w-3 h-3 flex-shrink-0" />
          <span className="text-white/25 truncate max-w-[180px]">{title}</span>
        </div>
      </div>

      <div className="section py-6 grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* ── Main column ── */}
        <div className="xl:col-span-2 space-y-5">
          {vl ? <PageLoader /> : (
            <>
              {/* Custom Player */}
              <PlayerWrapper
                videoId={videoId}
                title={title}
                autoplay={false}
                onEnded={handleEnded}
                onProgress={({ playedSeconds }) => {
                  // mark watched after 10s of playback
                  if (playedSeconds > 10 && !watched) {
                    markWatched(videoId, playlistId, {
                      title: video?.snippet?.title,
                      thumbnail: getThumbnail(video?.snippet, 'medium'),
                    })
                  }
                }}
              />

              {/* Title + meta */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-card">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h1 className="font-display text-xl md:text-2xl text-ink font-bold leading-snug flex-1">
                    {title}
                  </h1>
                  {watched && (
                    <div className="flex items-center gap-1.5 flex-shrink-0 badge bg-ocean-100 text-ocean-700 border border-ocean-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Watched
                    </div>
                  )}
                </div>

                {/* Nav prev/next */}
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                  {prevId ? (
                    <Link to={`/courses/${playlistId}/watch/${prevId}`}
                          className="btn-outline btn-sm gap-1.5">
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Previous
                    </Link>
                  ) : <div />}
                  <div className="flex-1 text-center">
                    <span className="text-xs text-ink-ghost font-mono">
                      {idx >= 0 ? `${idx + 1} / ${lectures?.length ?? '…'}` : ''}
                    </span>
                  </div>
                  {nextId && (
                    <Link to={`/courses/${playlistId}/watch/${nextId}`}
                          className="btn-primary btn-sm gap-1.5 ml-auto">
                      Next
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
                <button onClick={() => setNoteOpen(!noteOpen)}
                        className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-slate-50 transition-colors">
                  <NotebookPen className="w-4.5 h-4.5 text-ocean-500" />
                  <span className="font-display font-semibold text-ink">My Notes</span>
                  {note && <span className="ml-1 badge bg-ocean-100 text-ocean-600">Saved</span>}
                  <ChevronDown className={clsx('w-4 h-4 text-ink-ghost ml-auto transition-transform', noteOpen && 'rotate-180')} />
                </button>
                {noteOpen && (
                  <div className="px-5 pb-5 border-t border-slate-100 pt-4 animate-slide-up-in">
                    <textarea
                      value={note}
                      onChange={e => { setNote(e.target.value); setNoteDirty(true) }}
                      onBlur={handleNoteBlur}
                      rows={5}
                      placeholder="Write your notes for this lecture…"
                      className="input resize-none font-body text-sm leading-relaxed"
                    />
                    {noteDirty && (
                      <button onClick={handleNoteBlur}
                              className="btn-primary btn-sm mt-2">Save</button>
                    )}
                  </div>
                )}
              </div>

              {/* Description */}
              {desc && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
                  <button onClick={() => setDescOpen(!descOpen)}
                          className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-slate-50 transition-colors">
                    <span className="font-display font-semibold text-ink">Description</span>
                    <ChevronDown className={clsx('w-4 h-4 text-ink-ghost ml-auto transition-transform', descOpen && 'rotate-180')} />
                  </button>
                  {descOpen && (
                    <div className="px-5 pb-5 border-t border-slate-100 pt-4 text-sm text-ink-muted leading-relaxed whitespace-pre-line animate-slide-up-in">
                      {desc}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Sidebar playlist ── */}
        <aside>
          <div className="sticky top-20 bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-ocean-950 to-ocean-900 p-4">
              <Link to={`/courses/${playlistId}`}
                    className="text-white/45 text-xs hover:text-white/80 transition-colors flex items-center gap-1 mb-2">
                <ArrowLeft className="w-3 h-3" />
                Course overview
              </Link>
              <p className="font-display text-sm font-semibold text-white leading-snug line-clamp-2">
                {course?.snippet?.title ?? 'Playlist'}
              </p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-white/40 text-xs">{lectures?.length ?? '…'} lectures</p>
                {idx >= 0 && <p className="text-white/40 text-xs">{idx + 1} / {lectures?.length}</p>}
              </div>
              {/* Progress bar */}
              <div className="mt-2.5 progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Lecture list */}
            <div className="overflow-y-auto max-h-[65vh] divide-y divide-slate-50">
              {ll
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex gap-3 p-3">
                      <div className="skeleton w-7 h-4 rounded" />
                      <div className="skeleton w-24 aspect-video rounded-xl flex-shrink-0" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="skeleton h-3.5 w-full rounded" />
                        <div className="skeleton h-3 w-2/3 rounded" />
                      </div>
                    </div>
                  ))
                : lectures?.map((item, i) => {
                    const id = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId
                    const active = id === videoId
                    return (
                      <Link key={item.id}
                            to={`/courses/${playlistId}/watch/${id}`}
                            className={clsx(
                              'flex gap-3 p-3 transition-all group',
                              active ? 'bg-ocean-50 border-l-2 border-ocean-500' : 'hover:bg-slate-50 border-l-2 border-transparent'
                            )}>
                        <div className="w-7 pt-1 flex-shrink-0 flex items-start justify-center">
                          {active
                            ? <Play className="w-3.5 h-3.5 text-ocean-500" fill="currentColor" strokeWidth={0} />
                            : <div className="flex flex-col items-center gap-0.5">
                                <span className="text-[11px] font-mono text-ink-ghost">{i + 1}</span>
                                <WatchedCheckmark videoId={id} />
                              </div>
                          }
                        </div>
                        <div className="w-24 aspect-video rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                          <img src={getThumbnail(item.snippet, 'medium')}
                               alt={item.snippet.title}
                               className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                               loading="lazy" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={clsx(
                            'text-xs font-semibold leading-snug line-clamp-2 transition-colors',
                            active ? 'text-ocean-700' : 'text-ink group-hover:text-ocean-600'
                          )}>
                            {item.snippet.title}
                          </p>
                        </div>
                      </Link>
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
