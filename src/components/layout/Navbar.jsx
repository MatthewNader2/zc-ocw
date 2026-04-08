import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

const NAV_LINKS = [
  { to: '/courses',     label: 'Courses'     },
  { to: '/departments', label: 'Departments' },
  { to: '/about',       label: 'About'       },
]

export default function Navbar() {
  const [open,      setOpen]      = useState(false)
  const [scrolled,  setScrolled]  = useState(false)
  const [query,     setQuery]     = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  function handleSearch(e) {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
      setQuery('')
      setOpen(false)
    }
  }

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-zc-navy shadow-lg' : 'bg-zc-navy'
      }`}
    >
      <div className="section flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group" onClick={() => setOpen(false)}>
          <img src="/logo.svg" alt="Zewail City" className="h-9 w-auto" />
          <span className="hidden sm:block font-display text-white text-lg leading-tight">
            <span className="text-zc-gold font-bold">ZC</span> OCW
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-body font-semibold transition-colors ${
                  isActive
                    ? 'bg-zc-blue text-white'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop search */}
        <form onSubmit={handleSearch} className="hidden md:flex items-center">
          <div className="relative">
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search courses…"
              className="w-52 pl-9 pr-3 py-1.5 rounded-lg bg-white/10 text-white placeholder-white/50
                         text-sm border border-white/20 focus:outline-none focus:border-zc-gold
                         focus:bg-white/20 transition-all"
            />
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50"
                 fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </div>
        </form>

        {/* Mobile burger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-white p-2 rounded-lg hover:bg-white/10"
          aria-label="Toggle menu"
        >
          {open
            ? <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            : <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
          }
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-zc-blue border-t border-white/10 px-4 py-4 space-y-2 animate-fade-in">
          <form onSubmit={handleSearch} className="mb-3">
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search courses…"
              className="w-full px-4 py-2 rounded-lg bg-white/10 text-white placeholder-white/50
                         text-sm border border-white/20 focus:outline-none focus:border-zc-gold"
            />
          </form>
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive ? 'bg-zc-navy text-white' : 'text-white/80 hover:text-white hover:bg-white/10'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  )
}
