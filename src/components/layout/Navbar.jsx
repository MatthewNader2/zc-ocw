import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Search, Bookmark, Settings, LayoutDashboard, Menu, X, Sun, Moon, User, LogOut, ChevronDown } from 'lucide-react'
import { useProgress } from '@/context/ProgressContext'
import { useAuth }     from '@/context/AuthContext'
import { useSettings } from '@/context/SettingsContext'
import { useEditablePage } from '@/hooks/useEditablePage'
import { DEFAULT_SITE_SETTINGS } from '@/data/siteSettings'
import clsx from 'clsx'

export default function Navbar() {
  const [open,    setOpen]    = useState(false)
  const [scrolled,setScrolled] = useState(false)
  const [query,   setQuery]   = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)
  const { getBookmarks } = useProgress()
  const { isAdmin, user, logout } = useAuth()
  const { settings, update } = useSettings()
  const { content: siteContent } = useEditablePage('site_settings', DEFAULT_SITE_SETTINGS)
  const navigate         = useNavigate()
  const bmCount          = getBookmarks().length
  const searchInputRef   = useRef(null)

  const navLabels = {
    courses: siteContent?.navCourses || DEFAULT_SITE_SETTINGS.navCourses,
    interviews: siteContent?.navInterviews || DEFAULT_SITE_SETTINGS.navInterviews,
    about: siteContent?.navAbout || DEFAULT_SITE_SETTINGS.navAbout,
    acknowledgments: siteContent?.navAcknowledgments || DEFAULT_SITE_SETTINGS.navAcknowledgments,
  }

  const navItems = [
    { to: '/courses',         label: navLabels.courses },
    { to: '/interviews',      label: navLabels.interviews },
    { to: '/about',           label: navLabels.about },
    { to: '/acknowledgments', label: navLabels.acknowledgments },
  ]

  function toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark')
    update('theme', isDark ? 'light' : 'dark')
  }

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    function handleKeyDown(e) {
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) &&
        !document.activeElement?.isContentEditable
      ) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
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
      <div className="section w-full flex items-center justify-between h-16 gap-2 sm:gap-4">

        {/* Logo */}
        <Link to="/" onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 flex-shrink-0 group">
          <img src="/logo.svg" alt="ZC" className="h-9 w-auto flex-shrink-0" />
          <div className="hidden sm:flex flex-col leading-none">
            <span className="font-display text-base font-bold text-white whitespace-nowrap">ZC <span className="text-ocean-400">OCW</span></span>
            <span className="text-[10px] text-white/40 font-body tracking-wide whitespace-nowrap">Open CourseWare</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 flex-shrink-0">
          <NavLink to="/courses" className={({ isActive }) => clsx(
            'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200',
            isActive ? 'bg-ocean-500/20 text-ocean-300' : 'text-white/70 hover:text-white hover:bg-white/8'
          )}>
            {navLabels.courses}
          </NavLink>
          <NavLink to="/interviews" className={({ isActive }) => clsx(
            'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200',
            isActive ? 'bg-ocean-500/20 text-ocean-300' : 'text-white/70 hover:text-white hover:bg-white/8'
          )}>
            {navLabels.interviews}
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => clsx(
            'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200',
            isActive ? 'bg-ocean-500/20 text-ocean-300' : 'text-white/70 hover:text-white hover:bg-white/8'
          )}>
            {navLabels.about}
          </NavLink>
          <NavLink to="/acknowledgments" className={({ isActive }) => clsx(
            'hidden lg:inline-flex px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200',
            isActive ? 'bg-ocean-500/20 text-ocean-300' : 'text-white/70 hover:text-white hover:bg-white/8'
          )}>
            {navLabels.acknowledgments}
          </NavLink>
        </nav>

        {/* Search */}
        <form onSubmit={submit} className="hidden md:flex flex-1 min-w-[160px] max-w-md mx-2">
          <div className="relative w-full flex items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/35 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="search" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search courses, topics, codes…"
              className="input-dark w-full min-w-0 pl-9 pr-8 py-1.5 text-xs"
              aria-label="Search courses"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono text-white/40 bg-white/10 rounded border border-white/10 pointer-events-none">
              /
            </kbd>
          </div>
        </form>

        {/* Right icons — desktop */}
        <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={toggleTheme}
            title="Toggle theme (Light / Dark)"
            className="p-2 rounded-xl text-white/65 hover:text-white hover:bg-white/8 transition-all"
            aria-label="Toggle Theme"
          >
            {settings.theme === 'dark' ? (
              <Moon className="w-4 h-4 text-ocean-300" />
            ) : (
              <Sun className="w-4 h-4 text-amber-300" />
            )}
          </button>
          <Link to="/bookmarks"
                className="relative p-2 rounded-xl text-white/65 hover:text-white hover:bg-white/8 transition-all"
                title="Bookmarks">
            <Bookmark className="w-4 h-4" strokeWidth={2} />
            {bmCount > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-cyan-400 text-ocean-950 text-[9px] font-bold flex items-center justify-center">
                {bmCount > 9 ? '9+' : bmCount}
              </span>
            )}
          </Link>
          <Link to="/settings"
                className="p-2 rounded-xl text-white/65 hover:text-white hover:bg-white/8 transition-all"
                title="Settings">
            <Settings className="w-4 h-4" strokeWidth={2} />
          </Link>
          {isAdmin && (
            <Link to="/admin"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold
                             text-ocean-300 bg-ocean-500/20 border border-ocean-400/30
                             hover:bg-ocean-500/30 transition-all whitespace-nowrap">
              <LayoutDashboard className="w-3.5 h-3.5" />
              Admin
            </Link>
          )}

          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-xl hover:bg-white/8 transition-all whitespace-nowrap"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-ocean-500/20 text-ocean-300 flex items-center justify-center font-bold text-xs">
                    {user.email ? user.email[0].toUpperCase() : 'U'}
                  </div>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-white/50" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white dark:bg-night-200 border border-slate-200 dark:border-white/10 shadow-deep py-1.5 z-50">
                  <div className="px-3.5 py-2 border-b border-slate-100 dark:border-white/10">
                    <p className="text-xs font-semibold text-ink dark:text-white truncate">{user.displayName || 'Signed in'}</p>
                    <p className="text-[11px] text-ink-ghost dark:text-slate-400 truncate">{user.email}</p>
                  </div>
                  <Link
                    to="/admin"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-ink dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-ocean-500" />
                    Admin Dashboard
                  </Link>
                  <Link
                    to="/admin/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-ink dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-cyan-500" />
                    Admin Settings (CMS)
                  </Link>
                  <div className="border-t border-slate-100 dark:border-white/10 my-1" />
                  <button
                    onClick={() => { setUserMenuOpen(false); logout() }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/admin/login"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white whitespace-nowrap flex-shrink-0
                             bg-gradient-to-r from-ocean-600 via-ocean-500 to-cyan-500
                             hover:brightness-110 shadow-sm transition-all flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Sign In / Register</span>
            </Link>
          )}
        </div>

        {/* Mobile burger */}
        <button onClick={() => setOpen(!open)} className="md:hidden text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/8 transition-all flex-shrink-0">
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
          {navItems.map(({ to, label }) => (
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
            <>
              <Link to="/admin" onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-ocean-300 hover:bg-ocean-500/15 transition-all">
                <LayoutDashboard className="w-4 h-4" />
                Admin Dashboard
              </Link>
              <Link to="/admin/settings" onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-cyan-300 hover:bg-ocean-500/15 transition-all">
                <Settings className="w-4 h-4" />
                Admin Settings (CMS)
              </Link>
            </>
          )}
          {user ? (
            <button
              onClick={() => { setOpen(false); logout() }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out ({user.email})
            </button>
          ) : (
            <Link to="/admin/login" onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-ocean-500/20 hover:bg-ocean-500/30 transition-all">
              <User className="w-4 h-4" />
              Sign In
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
