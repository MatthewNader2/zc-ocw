import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { ArrowRight, PlayCircle, BookOpen, Download } from 'lucide-react'
import HeroSection     from '@/components/sections/HeroSection'
import FeaturedCourses from '@/components/sections/FeaturedCourses'
import DepartmentGrid  from '@/components/sections/DepartmentGrid'
import CourseCard from '@/components/ui/CourseCard'
import { CourseCardSkeleton } from '@/components/ui/LoadingSpinner'
import ScrollReveal from '@/components/ui/ScrollReveal'
import { useProgress }  from '@/context/ProgressContext'
import { usePlaylists } from '@/hooks/useYouTube'

function ContinueSection() {
  const { getRecentlyWatched } = useProgress()
  const { data } = usePlaylists()
  const recent = getRecentlyWatched()
  if (recent.length === 0) return null
  const all = data?.pages?.flatMap(p => p.items) ?? []
  const courses = [...new Set(recent.map(v => v.playlistId))].slice(0, 3)
    .map(id => all.find(c => c.id === id)).filter(Boolean)
  if (!courses.length) return null
  return (
    <section className="py-16 bg-white border-b border-slate-100">
      <div className="section">
        <ScrollReveal className="flex items-end justify-between mb-8">
          <div>
            <p className="text-ocean-500 text-xs font-semibold font-mono uppercase tracking-[0.2em] mb-2">Continue learning</p>
            <h2 className="font-display text-3xl font-bold text-ink">Pick Up Where You Left Off</h2>
          </div>
          <Link to="/bookmarks" className="btn-ghost hidden sm:inline-flex gap-1.5">
            Bookmarks <ArrowRight className="w-4 h-4" />
          </Link>
        </ScrollReveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((c, i) => (
            <ScrollReveal key={c.id} delay={`${i * 0.1}s`}>
              <CourseCard playlist={c} className="h-full" />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

const HOW_STEPS = [
  { icon: BookOpen,   n: '01', title: 'Choose a Course',   body: 'Browse 4 schools and 20+ programs, or search by topic or course code.' },
  { icon: PlayCircle, n: '02', title: 'Watch Lectures',    body: 'Stream HD lectures with our custom player. No sign-up required.' },
  { icon: Download,   n: '03', title: 'Get Materials',     body: 'Download slides, problem sheets, past exams, and textbook recommendations.' },
]

export default function Home() {
  return (
    <>
      <Helmet>
        <title>ZC OCW — Zewail City Open CourseWare</title>
        <meta name="description" content="Free lecture videos and course materials from Zewail City of Science and Technology — open to every learner." />
      </Helmet>
      <HeroSection />
      <ContinueSection />
      <FeaturedCourses />
      <DepartmentGrid />

      {/* How it works */}
      <section className="py-20 bg-ocean-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-100" />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[80px] opacity-[0.07]"
             style={{ background: 'radial-gradient(circle, #00b4d8, transparent)' }} />
        <div className="section relative z-10">
          <ScrollReveal className="text-center mb-16">
            <p className="text-ocean-400 text-xs font-semibold font-mono uppercase tracking-[0.2em] mb-3">Simple process</p>
            <h2 className="font-display text-4xl md:text-5xl text-white font-bold">How ZC OCW Works</h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {HOW_STEPS.map(({ icon: Icon, n, title, body }, i) => (
              <ScrollReveal key={n} delay={`${i * 0.15}s`}
                            className="group flex flex-col gap-4 p-8 rounded-2xl glass-dark
                                       hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-5xl font-bold text-ocean-500/40 group-hover:text-ocean-400/60 transition-colors">
                    {n}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-ocean-500/15 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-ocean-400" strokeWidth={1.8} />
                  </div>
                </div>
                <h3 className="font-display text-xl text-white font-semibold">{title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{body}</p>
              </ScrollReveal>
            ))}
          </div>
          <ScrollReveal className="text-center mt-14" delay="0.3s">
            <Link to="/courses" className="btn-primary btn-lg gap-2.5 animate-pulse-ring">
              Start Learning Free <ArrowRight className="w-5 h-5" />
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
