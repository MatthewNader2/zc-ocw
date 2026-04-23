import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { SlidersHorizontal } from 'lucide-react'
import { usePlaylists }  from '@/hooks/useYouTube'
import { useAdminData }  from '@/context/AdminDataContext'
import { SCHOOLS, PROGRAMS, detectFromTitle, getSchool } from '@/data/coursesCatalog'
import CourseCard from '@/components/ui/CourseCard'
import { CourseCardSkeleton, LoadingSpinner } from '@/components/ui/LoadingSpinner'
import ErrorMessage from '@/components/ui/ErrorMessage'
import ScrollReveal from '@/components/ui/ScrollReveal'
import clsx from 'clsx'

const LEVELS = ['All levels', 'Undergraduate', 'Graduate']
const SCHOOL_ACCENT = { csai:'#0096c7', business:'#0d9488', science:'#7c3aed', engineering:'#ea580c' }

export default function Courses() {
  const { schoolId: slugSchool, programId: slugProgram } = useParams()
  const [levelFilter,  setLevelFilter]  = useState('All levels')
  const [schoolFilter, setSchoolFilter] = useState(slugSchool || 'all')
  const loadMoreRef = useRef(null)
  const { getCourseData } = useAdminData()

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = usePlaylists()
  const allCourses = data?.pages.flatMap(p => p.items) ?? []

  const filtered = allCourses.filter(c => {
    const ov = getCourseData(c.id)
    const au = detectFromTitle(c.snippet.title)
    const sid = ov.schoolId ?? au?.schoolId ?? null
    const pid = ov.programId ?? au?.programId ?? null
    const lv  = ov.level ?? null
    return (schoolFilter === 'all' || sid === schoolFilter)
        && (!slugProgram || pid === slugProgram)
        && (levelFilter === 'All levels' || lv === levelFilter)
  })

  useEffect(() => {
    if (!hasNextPage) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) fetchNextPage() }, { threshold: 0.1 })
    if (loadMoreRef.current) obs.observe(loadMoreRef.current)
    return () => obs.disconnect()
  }, [hasNextPage, fetchNextPage])

  useEffect(() => { if (slugSchool) setSchoolFilter(slugSchool) }, [slugSchool])

  const school   = slugSchool ? getSchool(slugSchool) : null
  const programs = slugSchool ? PROGRAMS[slugSchool] ?? [] : []
  const program  = slugProgram ? programs.find(p => p.id === slugProgram) : null
  const accent   = slugSchool ? SCHOOL_ACCENT[slugSchool] : null
  const pageTitle = program?.label ?? school?.label ?? 'All Courses'

  return (
    <>
      <Helmet><title>{pageTitle} — ZC OCW</title></Helmet>

      {/* Accent line */}
      {accent && <div className="h-1" style={{ background: accent }} />}

      <div className="page-header">
        <div className="section">
          {school && (
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{school.icon}</span>
              <span className="badge text-xs text-white" style={{ backgroundColor: accent }}>{school.short}</span>
            </div>
          )}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-2">{pageTitle}</h1>
          <p className="text-white/40">{filtered.length} course{filtered.length !== 1 ? 's' : ''} available</p>
        </div>
      </div>

      <div className="section py-8">
        {/* Filters */}
        <ScrollReveal className="flex flex-wrap gap-3 items-center mb-10">
          <div className="flex items-center gap-1.5 text-ink-ghost">
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-sm font-semibold">Filter:</span>
          </div>

          {/* School chips — only on /courses root */}
          {!slugSchool && (
            <div className="flex flex-wrap gap-1.5">
              {[{ id:'all', label:'All Schools', icon:'🎓', accent: null }, ...SCHOOLS.filter(s=>s.id!=='general')].map(s => (
                <button key={s.id} onClick={() => setSchoolFilter(s.id)}
                        className={clsx(
                          'badge cursor-pointer transition-all text-xs',
                          schoolFilter === s.id && s.id !== 'all' ? 'text-white shadow-sm' :
                          schoolFilter === s.id ? 'bg-ocean-950 text-white' :
                          'bg-slate-100 text-ink-subtle hover:bg-slate-200'
                        )}
                        style={schoolFilter === s.id && s.id !== 'all' ? { backgroundColor: SCHOOL_ACCENT[s.id] } : {}}>
                  {s.icon ?? ''} {s.label ?? s.short}
                </button>
              ))}
            </div>
          )}

          {/* Level filter */}
          <div className="flex gap-1.5 ml-auto">
            {LEVELS.map(l => (
              <button key={l} onClick={() => setLevelFilter(l)}
                      className={clsx(
                        'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                        levelFilter === l ? 'bg-ocean-950 text-white border-ocean-950' : 'border-slate-200 text-ink-subtle hover:border-ocean-400 hover:text-ocean-600'
                      )}>
                {l}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {isError ? (
          <ErrorMessage onRetry={refetch} />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading
                ? Array.from({length:9}).map((_,i) => <CourseCardSkeleton key={i} />)
                : filtered.length === 0
                ? <div className="col-span-3 text-center py-24">
                    <p className="font-display text-xl text-ink-muted mb-2">No courses found</p>
                    <p className="text-sm text-ink-ghost">Try a different filter, or check back when more are added.</p>
                  </div>
                : filtered.map((c, i) => (
                    <ScrollReveal key={c.id} delay={`${Math.min(i * 0.04, 0.3)}s`}>
                      <CourseCard playlist={c} className="h-full" />
                    </ScrollReveal>
                  ))
              }
            </div>
            <div ref={loadMoreRef} className="h-16 flex items-center justify-center mt-6">
              {isFetchingNextPage && <LoadingSpinner />}
            </div>
          </>
        )}
      </div>
    </>
  )
}
