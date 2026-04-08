import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { usePlaylists } from '@/hooks/useYouTube'
import CourseCard from '@/components/ui/CourseCard'
import { CourseCardSkeleton, LoadingSpinner } from '@/components/ui/LoadingSpinner'
import ErrorMessage from '@/components/ui/ErrorMessage'
import { DEPARTMENTS, LEVELS } from '@/data/courses'

export default function Courses() {
  const { slug: deptSlug } = useParams()          // from /departments/:slug
  const [searchParams] = useSearchParams()
  const [levelFilter, setLevelFilter] = useState('All')
  const [deptFilter,  setDeptFilter]  = useState(deptSlug || 'All')
  const loadMoreRef = useRef(null)

  const {
    data, isLoading, isError, error,
    fetchNextPage, hasNextPage, isFetchingNextPage, refetch,
  } = usePlaylists()

  // Flatten all pages into one list
  const allCourses = data?.pages.flatMap(p => p.items) ?? []

  // Client-side filter (dept + level)
  const filtered = allCourses.filter(c => {
    const deptOk  = deptFilter  === 'All' || c.meta?.department === deptFilter
    const levelOk = levelFilter === 'All' || c.meta?.level === levelFilter
    return deptOk && levelOk
  })

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!hasNextPage) return
    const obs = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) fetchNextPage() },
      { threshold: 0.1 }
    )
    if (loadMoreRef.current) obs.observe(loadMoreRef.current)
    return () => obs.disconnect()
  }, [hasNextPage, fetchNextPage])

  // Sync dept from URL slug
  useEffect(() => {
    if (deptSlug) setDeptFilter(deptSlug)
  }, [deptSlug])

  const pageTitle = deptSlug
    ? `${DEPARTMENTS.find(d => d.slug === deptSlug)?.label ?? deptSlug} Courses — ZC OCW`
    : 'All Courses — ZC OCW'

  return (
    <>
      <Helmet><title>{pageTitle}</title></Helmet>

      {/* Page header */}
      <div className="bg-zc-navy text-white py-12">
        <div className="section">
          <h1 className="font-display text-4xl md:text-5xl mb-2">
            {deptSlug
              ? DEPARTMENTS.find(d => d.slug === deptSlug)?.label ?? 'Courses'
              : 'All Courses'}
          </h1>
          <p className="text-white/60">
            {filtered.length} course{filtered.length !== 1 ? 's' : ''} available
          </p>
        </div>
      </div>

      <div className="section py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          {/* Department filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDeptFilter('All')}
              className={`badge text-xs cursor-pointer transition-colors ${
                deptFilter === 'All' ? 'bg-zc-navy text-white' : 'bg-gray-100 text-zc-gray hover:bg-gray-200'
              }`}
            >
              All Departments
            </button>
            {DEPARTMENTS.map(d => (
              <button
                key={d.slug}
                onClick={() => setDeptFilter(d.slug)}
                className={`badge text-xs cursor-pointer transition-colors ${
                  deptFilter === d.slug ? 'bg-zc-navy text-white' : `${d.color} opacity-80 hover:opacity-100`
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Level filter */}
          <select
            value={levelFilter}
            onChange={e => setLevelFilter(e.target.value)}
            className="ml-auto text-sm border border-gray-200 rounded-lg px-3 py-1.5
                       bg-white text-zc-navy focus:outline-none focus:ring-2 focus:ring-zc-sky/40"
          >
            <option value="All">All levels</option>
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {/* Grid */}
        {isError ? (
          <ErrorMessage onRetry={refetch} />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading
                ? Array.from({ length: 9 }).map((_, i) => <CourseCardSkeleton key={i} />)
                : filtered.length === 0
                ? <p className="col-span-3 text-center text-zc-gray py-20">
                    No courses found for this filter.
                  </p>
                : filtered.map(c => <CourseCard key={c.id} playlist={c} />)
              }
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={loadMoreRef} className="h-10 flex items-center justify-center mt-8">
              {isFetchingNextPage && <LoadingSpinner />}
            </div>
          </>
        )}
      </div>
    </>
  )
}
