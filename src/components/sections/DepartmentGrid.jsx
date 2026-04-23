import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { SCHOOLS } from '@/data/coursesCatalog'
import ScrollReveal from '@/components/ui/ScrollReveal'

const ACCENT = { csai:'#0096c7', business:'#0d9488', science:'#7c3aed', engineering:'#ea580c' }

export default function DepartmentGrid() {
  return (
    <section className="py-20 bg-slate-50/60">
      <div className="section">
        <ScrollReveal className="text-center mb-12">
          <p className="text-ocean-500 text-xs font-semibold font-mono uppercase tracking-[0.2em] mb-3">Explore by field</p>
          <h2 className="font-display text-4xl md:text-5xl text-ink font-bold">Schools &amp; Programs</h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SCHOOLS.filter(s => s.id !== 'general').map((school, i) => {
            const accent = ACCENT[school.id]
            return (
              <ScrollReveal key={school.id} delay={`${i * 0.1}s`}>
                <Link to={`/departments/${school.id}`}
                      className="group card flex flex-col gap-4 p-6 h-full relative overflow-hidden">
                  {/* Bg orb */}
                  <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-0 group-hover:opacity-8
                                  transition-all duration-500 blur-xl"
                       style={{ background: accent }} />
                  {/* Bottom line */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 scale-x-0 group-hover:scale-x-100
                                  transition-transform duration-400 ease-spring origin-left"
                       style={{ background: accent }} />

                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm"
                       style={{ backgroundColor: accent + '15', border: `1px solid ${accent}25` }}>
                    {school.icon}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-display font-bold text-lg text-ink mb-1.5 leading-snug
                                   group-hover:transition-colors duration-200"
                        style={{ '--tw-text-opacity': 1 }}
                        onMouseEnter={e => e.currentTarget.style.color = accent}
                        onMouseLeave={e => e.currentTarget.style.color = ''}>
                      {school.label}
                    </h3>
                    <p className="text-xs text-ink-ghost leading-relaxed line-clamp-2">
                      {school.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-semibold opacity-0 group-hover:opacity-100
                                  transition-all duration-200 translate-x-0 group-hover:translate-x-0.5"
                       style={{ color: accent }}>
                    Browse courses <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
