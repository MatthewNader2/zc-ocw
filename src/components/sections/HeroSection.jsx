import SearchBar from '@/components/ui/SearchBar'
import { Link } from 'react-router-dom'

const STATS = [
  { label: 'Courses',     value: '50+' },
  { label: 'Lectures',    value: '500+' },
  { label: 'Departments', value: '8'   },
  { label: 'Free',        value: '100%'},
]

export default function HeroSection() {
  return (
    <section className="relative bg-zc-navy overflow-hidden">
      {/* Background geometric pattern */}
      <div className="absolute inset-0 opacity-10"
           style={{
             backgroundImage: `radial-gradient(circle at 20% 50%, #C9A84C 0%, transparent 50%),
                               radial-gradient(circle at 80% 20%, #2A6CC4 0%, transparent 40%)`,
           }}
      />
      <div className="absolute inset-0"
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
           }}
      />

      <div className="section relative z-10 py-20 md:py-28">
        <div className="max-w-3xl mx-auto text-center">
          {/* OCW Logo or wordmark */}
          <div className="flex justify-center mb-6">
            <img src="/ocw-logo.svg" alt="OCW" className="h-12 w-auto"
                 onError={e => { e.currentTarget.style.display = 'none' }} />
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-white font-bold leading-tight mb-4 animate-fade-up">
            Knowledge{' '}
            <span className="text-zc-gold">Unlocked</span>
          </h1>
          <p className="text-white/70 text-lg md:text-xl font-body mb-8 leading-relaxed animate-fade-up"
             style={{ animationDelay: '0.1s' }}>
            Free lecture videos and course materials from{' '}
            <span className="text-white font-semibold">Zewail City of Science and Technology</span> —
            open to learners everywhere.
          </p>

          {/* Search */}
          <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <SearchBar size="lg" className="max-w-xl mx-auto mb-4" />
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-3 justify-center animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <Link to="/courses" className="btn-primary">
              Browse Courses
            </Link>
            <Link to="/departments" className="btn-ghost text-white/80 hover:text-white">
              By Department →
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto
                        animate-fade-up" style={{ animationDelay: '0.4s' }}>
          {STATS.map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="font-display text-3xl font-bold text-zc-gold">{value}</p>
              <p className="text-white/60 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
