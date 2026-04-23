import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Search as SearchIcon, X, Filter, BookOpen, Video } from 'lucide-react'
import { useSearch, usePlaylists } from '@/hooks/useYouTube'
import { getThumbnail }     from '@/services/youtube'
import { detectFromTitle, getSchool } from '@/data/coursesCatalog'
import { useAdminData }     from '@/context/AdminDataContext'
import { PageLoader }       from '@/components/ui/LoadingSpinner'
import CourseCard           from '@/components/ui/CourseCard'

/* ── Client-side search across already-loaded playlists ── */
function clientSearch(playlists, query) {
  if (!query) return []
  const q = query.toLowerCase()
  return playlists.filter(p => {
    const title = p.snippet.title.toLowerCase()
    const desc  = (p.snippet.description ?? '').toLowerCase()
    const auto  = detectFromTitle(p.snippet.title)
    const tags  = (auto?.tags ?? []).join(' ').toLowerCase()
    return title.includes(q) || desc.includes(q) || tags.includes(q) || (auto?.code ?? '').toLowerCase().includes(q)
  })
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQ = searchParams.get('q') ?? ''
  const [input,    setInput]    = useState(initialQ)
  const [query,    setQuery]    = useState(initialQ)
  const [tab,      setTab]      = useState('courses')  // 'courses' | 'videos'

  const { data: playlistData } = usePlaylists()
  const allPlaylists = playlistData?.pages?.flatMap(p => p.items) ?? []

  // YouTube API search (videos) — costs quota, only on explicit search
  const { data: apiResults, isLoading: apiLoading, isError: apiError } = useSearch(tab === 'videos' ? query : null)

  // Client-side course search
  const courseResults = query ? clientSearch(allPlaylists, query) : []
  const videoResults  = apiResults?.items?.filter(i => i.id.kind === 'youtube#video') ?? []

  // Debounced query update
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(input.trim())
      if (input.trim()) setSearchParams({ q: input.trim() }, { replace: true })
    }, 350)
    return () => clearTimeout(t)
  }, [input])

  // Sync URL → input on load
  useEffect(() => { setInput(initialQ); setQuery(initialQ) }, [])

  const totalResults = tab === 'courses' ? courseResults.length : videoResults.length

  return (
    <>
      <Helmet>
        <title>{query ? `"${query}" — Search` : 'Search'} — ZC OCW</title>
      </Helmet>

      {/* Hero search bar */}
      <div className="bg-gradient-to-br from-ocean-950 via-ocean-900 to-ocean-700 py-12">
        <div className="section max-w-3xl">
          <h1 className="font-display text-3xl md:text-4xl text-white font-bold mb-6">Search Courses</h1>
          <div className="relative flex items-center glass p-2">
            <SearchIcon className="absolute left-5 w-5 h-5 text-white/40 pointer-events-none" />
            <input
              type="search"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Search by course code, topic, or keyword…"
              className="flex-1 bg-transparent pl-12 pr-4 py-3 text-white placeholder-white/35 text-sm font-body focus:outline-none"
              autoFocus
            />
            {input && (
              <button onClick={() => { setInput(''); setQuery(''); setSearchParams({}) }}
                      className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all mr-1">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {query && (
            <p className="text-white/40 text-sm mt-3">
              {tab === 'courses' ? courseResults.length : videoResults.length} result{totalResults !== 1 ? 's' : ''} for <strong className="text-white/70">"{query}"</strong>
            </p>
          )}
        </div>
      </div>

      <div className="section py-8 max-w-3xl">
        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {[
            { id:'courses', label:'Courses', icon:BookOpen },
            { id:'videos',  label:'All Videos', icon:Video },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      tab === id
                        ? 'bg-ocean-600 text-white shadow-glow'
                        : 'bg-white border border-slate-200 text-ink-subtle hover:border-ocean-300 hover:text-ocean-600'
                    }`}>
              <Icon className="w-4 h-4" />
              {label}
              {tab === id && totalResults > 0 && (
                <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">{totalResults}</span>
              )}
            </button>
          ))}
          {tab === 'videos' && (
            <p className="ml-auto text-xs text-ink-ghost self-center">
              Uses YouTube API quota
            </p>
          )}
        </div>

        {/* No query */}
        {!query && (
          <div className="text-center py-20">
            <SearchIcon className="w-12 h-12 text-ocean-200 mx-auto mb-4" />
            <p className="font-display text-xl text-ink-muted">Start typing to search</p>
            <p className="text-sm text-ink-ghost mt-2">Try "Quantum Mechanics", "PHYS 323", or "machine learning"</p>
          </div>
        )}

        {/* Courses tab */}
        {query && tab === 'courses' && (
          courseResults.length === 0
            ? <NoResults query={query} />
            : <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {courseResults.map(c => <CourseCard key={c.id} playlist={c} />)}
              </div>
        )}

        {/* Videos tab */}
        {query && tab === 'videos' && (
          apiLoading ? <PageLoader /> :
          apiError   ? <div className="text-center py-16 text-ink-ghost">API search failed. Check your API key quota.</div> :
          videoResults.length === 0 ? <NoResults query={query} /> :
          <div className="space-y-3">
            {videoResults.map(item => {
              const vid = item.id.videoId
              return (
                <a key={vid}
                   href={`https://www.youtube.com/watch?v=${vid}`}
                   target="_blank" rel="noopener noreferrer"
                   className="card flex gap-4 p-4 hover:shadow-card-hover group">
                  <div className="w-36 aspect-video rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                    <img src={getThumbnail(item.snippet, 'medium')} alt={item.snippet.title}
                         className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-sm text-ink group-hover:text-ocean-600 transition-colors line-clamp-2 mb-1">
                      {item.snippet.title}
                    </p>
                    <p className="text-xs text-ink-ghost line-clamp-2">{item.snippet.description}</p>
                  </div>
                </a>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

function NoResults({ query }) {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 rounded-2xl bg-ocean-50 flex items-center justify-center mx-auto mb-4">
        <SearchIcon className="w-8 h-8 text-ocean-300" />
      </div>
      <p className="font-display text-xl text-ink-muted mb-2">No results for "{query}"</p>
      <p className="text-sm text-ink-ghost">Try a different keyword, or browse by department.</p>
      <Link to="/departments" className="btn-outline mt-6 inline-flex">Browse Departments</Link>
    </div>
  )
}
