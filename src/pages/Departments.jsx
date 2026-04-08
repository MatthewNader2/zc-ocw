import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { DEPARTMENTS } from '@/data/courses'

const DEPT_DESC = {
  nanotechnology: 'Nanoscale materials, quantum effects, and the science of the very small.',
  physics:        'Classical mechanics, quantum physics, electromagnetism, and beyond.',
  chemistry:      'Organic, inorganic, and physical chemistry with lab techniques.',
  biology:        'Cell biology, genetics, molecular biology, and systems biology.',
  engineering:    'Electrical, mechanical, and systems engineering fundamentals.',
  cs:             'Algorithms, data structures, AI, and software engineering.',
  mathematics:    'Pure and applied mathematics, statistics, and numerical methods.',
  humanities:     'Arabic, philosophy, history of science, and academic writing.',
}

const ICONS = {
  nanotechnology: '⚛️', physics: '🔭', chemistry: '🧪', biology: '🧬',
  engineering: '⚙️', cs: '💻', mathematics: '📐', humanities: '📚',
}

export default function Departments() {
  return (
    <>
      <Helmet><title>Departments — ZC OCW</title></Helmet>

      <div className="bg-zc-navy text-white py-12">
        <div className="section">
          <h1 className="font-display text-4xl md:text-5xl mb-2">Departments</h1>
          <p className="text-white/60">Browse courses by academic discipline</p>
        </div>
      </div>

      <div className="section py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {DEPARTMENTS.map(dept => (
            <Link
              key={dept.slug}
              to={`/departments/${dept.slug}`}
              className="card group flex flex-col p-6 gap-4 items-start"
            >
              <span className="text-4xl">{ICONS[dept.slug]}</span>
              <div>
                <h2 className="font-display text-xl text-zc-navy font-semibold mb-1
                               group-hover:text-zc-sky transition-colors">
                  {dept.label}
                </h2>
                <p className="text-sm text-zc-gray leading-relaxed">
                  {DEPT_DESC[dept.slug]}
                </p>
              </div>
              <span className="btn-ghost text-sm mt-auto">View courses →</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
