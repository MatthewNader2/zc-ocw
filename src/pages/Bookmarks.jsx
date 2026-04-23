import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Bookmark } from 'lucide-react'
import { useProgress }  from '@/context/ProgressContext'
import { usePlaylists } from '@/hooks/useYouTube'
import CourseCard from '@/components/ui/CourseCard'
import { CourseCardSkeleton } from '@/components/ui/LoadingSpinner'
import ScrollReveal from '@/components/ui/ScrollReveal'

export default function Bookmarks() {
  const { getBookmarks }    = useProgress()
  const { data, isLoading } = usePlaylists()
  const ids  = getBookmarks()
  const all  = data?.pages?.flatMap(p => p.items) ?? []
  const list = all.filter(c => ids.includes(c.id))

  return (
    <>
      <Helmet><title>Bookmarks — ZC OCW</title></Helmet>
      <div className="page-header">
        <div className="section">
          <p className="text-ocean-400 text-xs font-semibold uppercase tracking-widest mb-2">Saved</p>
          <h1 className="font-display text-5xl font-bold mb-2">Bookmarks</h1>
          <p className="text-white/45">{ids.length > 0 ? `${ids.length} saved course${ids.length>1?'s':''}` : 'Your saved courses appear here'}</p>
        </div>
      </div>
      <div className="section py-10">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <CourseCardSkeleton key={i} />)}
          </div>
        ) : ids.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-20 h-20 rounded-2xl bg-ocean-50 flex items-center justify-center mb-5">
              <Bookmark className="w-9 h-9 text-ocean-300" strokeWidth={1.5} />
            </div>
            <h2 className="font-display text-2xl font-bold text-ink mb-3">No bookmarks yet</h2>
            <p className="text-sm text-ink-ghost max-w-xs mb-8 leading-relaxed">
              Tap the bookmark icon on any course card to save it here for quick access.
            </p>
            <Link to="/courses" className="btn-primary">Browse Courses</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map((c, i) => (
              <ScrollReveal key={c.id} delay={`${i * 0.08}s`}>
                <CourseCard playlist={c} className="h-full" />
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
