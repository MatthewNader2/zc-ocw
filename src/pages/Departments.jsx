import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ArrowRight } from 'lucide-react'
import { SCHOOLS, PROGRAMS } from '@/data/coursesCatalog'
import ScrollReveal from '@/components/ui/ScrollReveal'

const ACCENT = { csai:'#0096c7', business:'#0d9488', science:'#7c3aed', engineering:'#ea580c' }

export default function Departments() {
  return (
    <>
      <Helmet><title>Departments — ZC OCW</title></Helmet>
      <div className="page-header">
        <div className="section">
          <p className="text-ocean-400 text-xs font-semibold uppercase tracking-widest mb-2">Explore</p>
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-2">Schools &amp; Departments</h1>
          <p className="text-white/45 text-base">Browse courses by academic school and program</p>
        </div>
      </div>
      <div className="section py-16 space-y-20">
        {SCHOOLS.filter(s => s.id !== 'general').map((school, si) => {
          const programs = PROGRAMS[school.id] ?? []
          const accent   = ACCENT[school.id]
          return (
            <ScrollReveal key={school.id} delay={`${si * 0.05}s`}>
              {/* School header */}
              <div className="flex items-center gap-5 mb-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 shadow-card"
                     style={{ backgroundColor: accent + '15', border: `1px solid ${accent}25` }}>
                  {school.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-4 flex-wrap">
                    <h2 className="font-display text-2xl md:text-3xl font-bold text-ink">{school.label}</h2>
                    <Link to={`/departments/${school.id}`}
                          className="text-xs font-semibold flex items-center gap-1 transition-colors"
                          style={{ color: accent }}>
                      View all <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <p className="text-sm text-ink-ghost mt-1">{school.description}</p>
                </div>
              </div>
              {/* Programs grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pl-0 md:pl-[5.25rem]">
                {programs.map((prog, pi) => (
                  <ScrollReveal key={prog.id} delay={`${pi * 0.04}s`}>
                    <Link to={`/departments/${school.id}/${prog.id}`}
                          className="group flex flex-col gap-1.5 bg-white rounded-2xl p-4 border border-slate-100
                                     shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5">
                      <span className="font-display font-semibold text-[13px] text-ink leading-snug
                                       transition-colors duration-200 group-hover:text-[color:var(--accent)]"
                            style={{ '--accent': accent }}>
                        {prog.label}
                      </span>
                      <span className="font-mono text-[10px] text-ink-ghost">{prog.prefixes.join(', ')}</span>
                    </Link>
                  </ScrollReveal>
                ))}
              </div>
              {/* Divider */}
              <div className="mt-14 divider" />
            </ScrollReveal>
          )
        })}
      </div>
    </>
  )
}
