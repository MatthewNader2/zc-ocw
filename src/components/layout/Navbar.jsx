import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Search, Bookmark, Settings, LayoutDashboard, Menu, X, GraduationCap } from 'lucide-react'
import { useProgress } from '@/context/ProgressContext'
import { useAuth }     from '@/context/AuthContext'
import clsx from 'clsx'

const NAV = [
  { to: '/courses',     label: 'Courses'     },
  { to: '/departments', label: 'Departments' },
  { to: '/about',       label: 'About'       },
]

export default function Navbar() {
  const [open,    setOpen]    = useState(false)
  const [scrolled,setScrolled] = useState(false)
  const [query,   setQuery]   = useState('')
  const { getBookmarks } = useProgress()
  const { isAdmin }      = useAuth()
  const navigate         = useNavigate()
  const bmCount          = getBookmarks().length

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  function submit(e) {
    e.preventDefault()
    const q = query.trim()
    if (q) { navigate(`/search?q=${encodeURIComponent(q)}`); setQuery(''); setOpen(false) }
  }

  return (
    <header className={clsx(
      'sticky top-0 z-50 transition-all duration-300',
      scrolled
        ? 'bg-ocean-950/95 backdrop-blur-xl shadow-[0_1px_0_rgba(72,202,228,0.12),0_4px_24px_rgba(3,4,94,0.35)]'
        : 'bg-ocean-950'
    )}>
      <div className="section flex items-center h-16 gap-4">

        {/* Logo */}
        <Link to="/" onClick={() => setOpen(false)}
              className="flex items-center gap-3 flex-shrink-0 group">
          <img src="/logo.svg" alt="ZC" className="h-9 w-auto" />
          <div className="hidden sm:flex flex-col leading-none">
            <span className="font-display text-base font-bold text-white">ZC <span className="text-ocean-400">OCW</span></span>
            <span className="text-[10px] text-white/35 font-body tracking-wide">Open CourseWare</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-0.5 ml-2">
          {NAV.map(({ to, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => clsx(
              'px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
              isActive ? 'bg-ocean-500/20 text-ocean-300' : 'text-white/65 hover:text-white hover:bg-white/8'
            )}>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Search */}
        <form onSubmit={submit} className="hidden md:flex flex-1 max-w-xs ml-auto">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/35 pointer-events-none" />
            <input
              type="search" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search courses…"
              className="input-dark w-full pl-9 py-1.5 text-sm"
            />
          </div>
        </form>

        {/* Right icons — desktop */}
        <div className="hidden md:flex items-center gap-1">
          <Link to="/bookmarks"
                className="relative p-2.5 rounded-xl text-white/55 hover:text-white hover:bg-white/8 transition-all">
            <Bookmark className="w-4.5 h-4.5" strokeWidth={2} />
            {bmCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-ocean-500 text-white text-[9px] font-bold flex items-center justify-center">
                {bmCount > 9 ? '9+' : bmCount}
              </span>
            )}
          </Link>
          <Link to="/settings"
                className="p-2.5 rounded-xl text-white/55 hover:text-white hover:bg-white/8 transition-all">
            <Settings className="w-4.5 h-4.5" strokeWidth={2} />
          </Link>
          {isAdmin && (
            <Link to="/admin"
                  className="ml-1 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                             text-ocean-300 bg-ocean-500/15 border border-ocean-400/20
                             hover:bg-ocean-500/25 transition-all">
              <LayoutDashboard className="w-3.5 h-3.5" />
              Admin
            </Link>
          )}
        </div>

        {/* Mobile burger */}
        <button onClick={() => setOpen(!open)} className="md:hidden text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/8 transition-all">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-ocean-950/98 backdrop-blur-xl border-t border-white/8 px-4 py-5 space-y-2 animate-slide-up-in">
          <form onSubmit={submit} className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
              <input type="search" value={query} onChange={e => setQuery(e.target.value)}
                     placeholder="Search courses…" className="input-dark w-full pl-10" />
            </div>
          </form>
          {NAV.map(({ to, label }) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)}
              className={({ isActive }) => clsx(
                'flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all',
                isActive ? 'bg-ocean-500/20 text-ocean-300' : 'text-white/70 hover:text-white hover:bg-white/8'
              )}>
              {label}
            </NavLink>
          ))}
          <div className="divider my-2" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <Link to="/bookmarks" onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white/70 hover:text-white hover:bg-white/8 transition-all">
            <Bookmark className="w-4 h-4" />
            Bookmarks {bmCount > 0 && <span className="ml-auto badge bg-ocean-500/20 text-ocean-300">{bmCount}</span>}
          </Link>
          <Link to="/settings" onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white/70 hover:text-white hover:bg-white/8 transition-all">
            <Settings className="w-4 h-4" />
            Settings
          </Link>
          {isAdmin && (
            <Link to="/admin" onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-ocean-300 hover:bg-ocean-500/15 transition-all">
              <LayoutDashboard className="w-4 h-4" />
              Admin Dashboard
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
