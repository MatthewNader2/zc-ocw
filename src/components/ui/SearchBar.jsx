import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ArrowRight } from 'lucide-react'
import clsx from 'clsx'

export default function SearchBar({ placeholder = 'Search courses, topics…', className = '', size = 'md' }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  function handleSubmit(e) {
    e.preventDefault()
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }
  const padX = size === 'lg' ? 'pl-14 pr-36 py-4 text-base' : 'pl-11 pr-28 py-3 text-sm'
  return (
    <form onSubmit={handleSubmit} className={clsx('relative', className)}>
      <Search className={clsx('absolute top-1/2 -translate-y-1/2 text-ink-ghost pointer-events-none',
        size === 'lg' ? 'left-5 w-5 h-5' : 'left-4 w-4 h-4')} />
      <input type="search" value={query} onChange={e => setQuery(e.target.value)}
             placeholder={placeholder}
             className={clsx('w-full rounded-2xl border border-slate-200 bg-white shadow-card font-body text-ink focus:outline-none focus:ring-2 focus:ring-ocean-400/40 focus:border-ocean-400 transition-all', padX)} />
      <button type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary gap-1.5 btn-sm">
        Search <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </form>
  )
}
