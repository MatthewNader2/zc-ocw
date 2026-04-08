import { Link } from 'react-router-dom'
import { DEPARTMENTS } from '@/data/courses'

const ICONS = {
  nanotechnology: '⚛️',
  physics:        '🔭',
  chemistry:      '🧪',
  biology:        '🧬',
  engineering:    '⚙️',
  cs:             '💻',
  mathematics:    '📐',
  humanities:     '📚',
}

export default function DepartmentGrid() {
  return (
    <section className="py-16 bg-zc-ivory">
      <div className="section">
        <div className="text-center mb-10">
          <p className="text-zc-gold text-sm font-semibold uppercase tracking-widest mb-1">Explore by field</p>
          <h2 className="font-display text-3xl md:text-4xl text-zc-navy">Departments</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {DEPARTMENTS.map(dept => (
            <Link
              key={dept.slug}
              to={`/departments/${dept.slug}`}
              className="group flex flex-col items-center gap-3 bg-white rounded-2xl p-6
                         border border-gray-100 shadow-sm text-center
                         transition-all duration-300 hover:shadow-md hover:-translate-y-1
                         hover:border-zc-gold/40"
            >
              <span className="text-3xl">{ICONS[dept.slug]}</span>
              <span className="font-display font-semibold text-zc-navy text-sm leading-snug
                               group-hover:text-zc-sky transition-colors">
                {dept.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
