import { Helmet } from 'react-helmet-async'
import HeroSection from '@/components/sections/HeroSection'
import FeaturedCourses from '@/components/sections/FeaturedCourses'
import DepartmentGrid from '@/components/sections/DepartmentGrid'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <>
      <Helmet>
        <title>ZC OCW — Zewail City Open CourseWare</title>
      </Helmet>

      <HeroSection />
      <FeaturedCourses />
      <DepartmentGrid />

      {/* "How it works" strip */}
      <section className="py-16 bg-zc-navy text-white">
        <div className="section">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl mb-3">How ZC OCW Works</h2>
            <p className="text-white/60 max-w-xl mx-auto">
              All lecture videos are hosted on YouTube — free, no account needed.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '01', title: 'Choose a course',   body: 'Browse by department or search for a topic you care about.' },
              { step: '02', title: 'Watch lectures',     body: 'Stream HD lectures directly from YouTube, embedded right here.' },
              { step: '03', title: 'Get the materials',  body: 'Download syllabi, problem sets, and notes linked per course.' },
            ].map(({ step, title, body }) => (
              <div key={step} className="flex flex-col gap-3">
                <span className="font-mono text-zc-gold text-4xl font-bold opacity-60">{step}</span>
                <h3 className="font-display text-xl">{title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/courses" className="btn-primary">Start learning for free</Link>
          </div>
        </div>
      </section>
    </>
  )
}
