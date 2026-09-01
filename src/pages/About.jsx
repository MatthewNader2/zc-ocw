import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Youtube, Globe, BookOpen, PlayCircle, Search, Smartphone, ArrowRight, Sparkles, Target, Compass } from 'lucide-react'
import { useChannelStats } from '@/hooks/useYouTube'
import { useEditablePage } from '@/hooks/useEditablePage'
import ScrollReveal from '@/components/ui/ScrollReveal'

export const DEFAULT_ABOUT = {
  headerSubtitle: "Knowledge becomes more powerful when it is shared — carrying world-class science and engineering education from Zewail City to learners across Egypt and the Arab world.",
  aboutTitle: "About ZC-OCW",
  aboutBody: "Zewail City OpenCourseWare (ZC-OCW) was born from a simple belief: knowledge becomes more powerful when it is shared. Inspired by the vision of the late Nobel Laureate Professor Ahmed Zewail and his lifelong pursuit of a scientific renaissance in Egypt and the Arab world, a group of students began, in 2017, recording and sharing courses from the University of Science and Technology at Zewail City. What started with students, cameras, and an ambitious idea has since grown into an open educational platform carrying the knowledge of remarkable professors and researchers far beyond the university classroom. Today, with more than 551 recorded lectures, 22,000+ subscribers, and 833,000+ views, ZC-OCW continues to share university-level courses, seminars, interviews, summer schools, and other scientific content with learners across Egypt and the Arab world. Yet behind every lecture published and every learner reached remains the same spirit with which the project began: students working for students, believing that great education should never stop at the doors of a university.",
  missionTitle: "Our Mission",
  missionBody: "Our mission is bigger than recording lectures. We aspire to help make high-quality science and engineering education from Egypt accessible to every curious mind that seeks it, wherever they may be. By carefully recording, editing, organizing, and publishing university-level learning materials with the guidance and consent of their instructors, we work to preserve the academic excellence of Zewail City while transforming it into knowledge that can travel—across universities, cities, countries, and generations. We dream of an Arab world where a student's opportunity to learn is not defined by geography or circumstance, and where Arabic-speaking students can freely reach the kind of rigorous scientific education offered at leading universities around the world. ZC-OCW remains built and sustained by students who chose to believe that they could contribute to that future—and, in our own way, carry Dr. Zewail's dream a little further.",
  licenseTitle: "License",
  licenseBody: "All course materials on ZC OCW are shared under a Creative Commons BY-NC-SA 4.0 license. You are free to use, adapt, and share them for non-commercial purposes with proper attribution.",
}

export default function About() {
  const { data: ch } = useChannelStats()
  const { content } = useEditablePage('about', DEFAULT_ABOUT)
  const stats = ch?.statistics

  const statItems = [
    {
      label: 'Recorded Lectures',
      value: stats?.videoCount ? `${Number(stats.videoCount).toLocaleString()}+` : '551+',
    },
    {
      label: 'Total Views',
      value: stats?.viewCount ? Number(stats.viewCount).toLocaleString() : '833,000+',
    },
    {
      label: 'Subscribers',
      value: stats?.subscriberCount ? Number(stats.subscriberCount).toLocaleString() : '22,000+',
    },
    {
      label: 'Free & Open',
      value: '100%',
    },
  ]

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
          <p className="text-white/70 text-lg leading-relaxed max-w-3xl">
            {content?.headerSubtitle || DEFAULT_ABOUT.headerSubtitle}
          </p>
        </div>
      </div>

      <div className="section py-16 max-w-4xl space-y-16">
        {/* Channel stats */}
        <ScrollReveal>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {statItems.map(({ label, value }) => (
              <div key={label} className="card-flat border border-slate-100 dark:border-white/10 shadow-card text-center p-5">
                <p className="font-display text-3xl font-bold text-ocean-600 dark:text-ocean-400">{value}</p>
                <p className="text-xs font-semibold text-ink-ghost dark:text-slate-400 mt-1.5">{label}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* About ZC-OCW Story */}
        <ScrollReveal delay="0.1s" className="space-y-4">
          <div className="flex items-center gap-2.5 text-ocean-600 dark:text-ocean-400 font-semibold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Our Story</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-ink dark:text-white">
            {content?.aboutTitle || DEFAULT_ABOUT.aboutTitle}
          </h2>
          <p className="text-ink-muted dark:text-slate-300 leading-relaxed text-base md:text-lg">
            {content?.aboutBody || DEFAULT_ABOUT.aboutBody}
          </p>
        </ScrollReveal>

        {/* Mission Statement */}
        <ScrollReveal delay="0.15s" className="space-y-4">
          <div className="rounded-3xl bg-gradient-to-br from-ocean-950 via-ocean-900 to-ocean-900 text-white p-8 md:p-10 shadow-xl border border-ocean-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-ocean-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2.5 text-ocean-300 font-semibold text-xs uppercase tracking-wider">
                <Target className="w-4 h-4" />
                <span>Our Vision & Purpose</span>
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-white">
                {content?.missionTitle || DEFAULT_ABOUT.missionTitle}
              </h2>
              <p className="text-white/80 leading-relaxed text-base md:text-lg">
                {content?.missionBody || DEFAULT_ABOUT.missionBody}
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* Features */}
        <div>
          <ScrollReveal>
            <div className="flex items-center gap-2.5 text-ocean-600 dark:text-ocean-400 font-semibold text-xs uppercase tracking-wider mb-2">
              <Compass className="w-4 h-4" />
              <span>Platform Highlights</span>
            </div>
            <h2 className="font-display text-3xl font-bold text-ink dark:text-white mb-8">What We Offer</h2>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon:PlayCircle,  color:'bg-red-50 dark:bg-red-950/40 text-red-500',    title:'Lecture Videos',   body:'Full HD courses recorded and hosted on YouTube — stream directly from our site.' },
              { icon:BookOpen,    color:'bg-blue-50 dark:bg-blue-950/40 text-blue-500',  title:'Course Materials', body:'Syllabi, problem sheets, slides, past exams, and textbook recommendations per course.' },
              { icon:Search,      color:'bg-purple-50 dark:bg-purple-950/40 text-purple-500', title:'Smart Search', body:'Search by course code, topic, or keyword across all 4 schools and 20+ programs.' },
              { icon:Smartphone,  color:'bg-green-50 dark:bg-green-950/40 text-green-500', title:'Mobile Friendly', body:'Fully responsive — works on any phone, tablet, or desktop without an app.' },
            ].map(({ icon: Icon, color, title, body }, i) => (
              <ScrollReveal key={title} delay={`${i * 0.1}s`}>
                <div className="card p-5 flex gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="w-5 h-5" strokeWidth={1.8} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-ink dark:text-white mb-1">{title}</h3>
                    <p className="text-sm text-ink-ghost dark:text-slate-400 leading-relaxed">{body}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* License */}
        <ScrollReveal delay="0.1s">
          <div className="bg-ocean-50 dark:bg-night-200/80 border border-ocean-200/60 dark:border-white/10 rounded-2xl p-6">
            <h2 className="font-display text-2xl font-bold text-ink dark:text-white mb-3">
              {content?.licenseTitle || DEFAULT_ABOUT.licenseTitle}
            </h2>
            <p className="text-ink-muted dark:text-slate-300 leading-relaxed text-sm">
              {content?.licenseBody || DEFAULT_ABOUT.licenseBody}{' '}
              <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener noreferrer"
                 className="text-ocean-600 dark:text-ocean-400 hover:underline font-semibold">
                Creative Commons BY-NC-SA 4.0
              </a>{' '}
              license. You are free to use, adapt, and share them for non-commercial purposes with proper attribution.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal className="flex flex-wrap gap-4">
          <Link to="/courses" className="btn-primary gap-2">Browse Courses <ArrowRight className="w-4 h-4" /></Link>
          <a href="https://www.linkedin.com/company/zewail-city-opencourseware/" target="_blank" rel="noopener noreferrer"
             className="btn-outline gap-2"><Globe className="w-4 h-4" /> Follow on LinkedIn</a>
          <a href="https://www.youtube.com/channel/UCGNOEBp7AZaY4XPNoagpv8w" target="_blank" rel="noopener noreferrer"
             className="btn-outline gap-2"><Youtube className="w-4 h-4" /> YouTube Channel</a>
        </ScrollReveal>
      </div>
    </>
  )
}
