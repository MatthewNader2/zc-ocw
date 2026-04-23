import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Youtube, Globe, BookOpen, PlayCircle, Search, Smartphone, ArrowRight } from 'lucide-react'
import { useChannelStats } from '@/hooks/useYouTube'
import ScrollReveal from '@/components/ui/ScrollReveal'

export default function About() {
  const { data: ch } = useChannelStats()
  const stats = ch?.statistics
  return (
    <>
      <Helmet><title>About — ZC OCW</title></Helmet>

      <div className="page-header">
        <div className="section max-w-4xl">
          <div className="flex items-center gap-5 mb-6">
            <img src="/logo.svg" alt="ZC" className="h-14 w-auto" />
            <div>
              <h1 className="font-display text-4xl md:text-5xl font-bold">
                ZC <span className="text-ocean-400">Open CourseWare</span>
              </h1>
              <p className="text-white/40 mt-1">University of Science and Technology</p>
            </div>
          </div>
          <p className="text-white/65 text-lg leading-relaxed max-w-2xl">
            ZC OCW makes Zewail City's academic content freely available — lecture videos,
            course materials, and more — inspired by MIT OpenCourseWare and the global open education movement.
          </p>
        </div>
      </div>

      <div className="section py-16 max-w-4xl space-y-16">
        {/* Channel stats */}
        {stats && (
          <ScrollReveal>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label:'Videos',      value: Number(stats.videoCount).toLocaleString()      },
                { label:'Total Views', value: Number(stats.viewCount).toLocaleString()       },
                { label:'Subscribers', value: Number(stats.subscriberCount).toLocaleString() },
                { label:'Free',        value: '100%'                                          },
              ].map(({ label, value }) => (
                <div key={label} className="card-flat border border-slate-100 shadow-card text-center">
                  <p className="font-display text-3xl font-bold text-ocean-600">{value}</p>
                  <p className="text-sm text-ink-ghost mt-1">{label}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        )}

        {/* Mission */}
        <ScrollReveal delay="0.1s" className="space-y-4">
          <h2 className="font-display text-3xl font-bold text-ink">Our Mission</h2>
          <p className="text-ink-muted leading-relaxed">
            Zewail City was founded on the belief that access to world-class education is a right, not a privilege.
            ZC OCW extends that mission to the digital world — making our courses available to students across Egypt,
            the Arab world, and beyond.
          </p>
        </ScrollReveal>

        {/* Features */}
        <div>
          <ScrollReveal>
            <h2 className="font-display text-3xl font-bold text-ink mb-8">What We Offer</h2>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon:PlayCircle,  color:'bg-red-50 text-red-500',    title:'Lecture Videos',   body:'Full HD courses recorded and hosted on YouTube — stream directly from our site.' },
              { icon:BookOpen,    color:'bg-blue-50 text-blue-500',  title:'Course Materials', body:'Syllabi, problem sheets, slides, past exams, and textbook recommendations per course.' },
              { icon:Search,      color:'bg-purple-50 text-purple-500', title:'Smart Search', body:'Search by course code, topic, or keyword across all 4 schools and 20+ programs.' },
              { icon:Smartphone,  color:'bg-green-50 text-green-500', title:'Mobile Friendly', body:'Fully responsive — works on any phone, tablet, or desktop without an app.' },
            ].map(({ icon: Icon, color, title, body }, i) => (
              <ScrollReveal key={title} delay={`${i * 0.1}s`}>
                <div className="card p-5 flex gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="w-5 h-5" strokeWidth={1.8} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-ink mb-1">{title}</h3>
                    <p className="text-sm text-ink-ghost leading-relaxed">{body}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* License */}
        <ScrollReveal delay="0.1s">
          <div className="bg-ocean-50 border border-ocean-200/60 rounded-2xl p-6">
            <h2 className="font-display text-2xl font-bold text-ink mb-3">License</h2>
            <p className="text-ink-muted leading-relaxed text-sm">
              All course materials on ZC OCW are shared under a{' '}
              <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener noreferrer"
                 className="text-ocean-600 hover:underline font-semibold">
                Creative Commons BY-NC-SA 4.0
              </a>{' '}
              license. You are free to use, adapt, and share them for non-commercial purposes with proper attribution.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal className="flex flex-wrap gap-4">
          <Link to="/courses" className="btn-primary gap-2">Browse Courses <ArrowRight className="w-4 h-4" /></Link>
          <a href="https://www.zewailcity.edu.eg" target="_blank" rel="noopener noreferrer"
             className="btn-outline gap-2"><Globe className="w-4 h-4" /> Visit Zewail City</a>
          <a href="https://www.youtube.com/channel/UCGNOEBp7AZaY4XPNoagpv8w" target="_blank" rel="noopener noreferrer"
             className="btn-outline gap-2"><Youtube className="w-4 h-4" /> YouTube Channel</a>
        </ScrollReveal>
      </div>
    </>
  )
}
