import { Helmet } from 'react-helmet-async'
import { useChannelStats } from '@/hooks/useYouTube'
import { Link } from 'react-router-dom'

export default function About() {
  const { data: channel } = useChannelStats()
  const stats = channel?.statistics

  return (
    <>
      <Helmet><title>About — ZC OCW</title></Helmet>

      {/* Hero */}
      <div className="bg-zc-navy text-white py-16">
        <div className="section max-w-4xl">
          <div className="flex items-center gap-4 mb-6">
            <img src="/logo.svg" alt="Zewail City" className="h-16 w-auto" />
            <div>
              <h1 className="font-display text-4xl md:text-5xl font-bold">
                <span className="text-zc-gold">ZC</span> Open CourseWare
              </h1>
              <p className="text-white/60 mt-1">University of Science and Technology</p>
            </div>
          </div>
          <p className="text-white/80 text-lg leading-relaxed max-w-2xl">
            ZC OCW makes Zewail City's academic content freely available on the web —
            lecture videos, course materials, and more — inspired by MIT OpenCourseWare
            and the global open education movement.
          </p>
        </div>
      </div>

      <div className="section py-14 max-w-4xl">
        {/* Channel stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14">
            {[
              { label: 'Videos',        value: Number(stats.videoCount).toLocaleString()      },
              { label: 'Views',         value: Number(stats.viewCount).toLocaleString()       },
              { label: 'Subscribers',   value: Number(stats.subscriberCount).toLocaleString() },
              { label: 'Free forever',  value: '100%'                                          },
            ].map(({ label, value }) => (
              <div key={label} className="card p-5 text-center">
                <p className="font-display text-3xl font-bold text-zc-gold">{value}</p>
                <p className="text-sm text-zc-gray mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Mission */}
        <div className="prose prose-lg max-w-none space-y-6 text-zc-navy">
          <h2 className="font-display text-3xl">Our Mission</h2>
          <p className="text-zc-gray leading-relaxed">
            Zewail City of Science and Technology was founded on the belief that access to world-class
            education is a right, not a privilege. ZC OCW extends that mission to the digital world,
            making our courses available to students across Egypt, the Arab world, and beyond.
          </p>

          <h2 className="font-display text-3xl mt-10">What We Offer</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: '🎬', title: 'Lecture Videos',    body: 'Full course lectures recorded and hosted on YouTube.' },
              { icon: '📄', title: 'Course Materials',  body: 'Syllabi, problem sets, exams, and reading lists.' },
              { icon: '🔍', title: 'Search & Filter',   body: 'Find courses by department, level, or keyword.' },
              { icon: '📱', title: 'Mobile Friendly',   body: 'Works on any device — phone, tablet, or desktop.' },
            ].map(({ icon, title, body }) => (
              <div key={title} className="card p-5 flex gap-4">
                <span className="text-2xl">{icon}</span>
                <div>
                  <h3 className="font-display font-semibold text-zc-navy">{title}</h3>
                  <p className="text-sm text-zc-gray mt-1">{body}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="font-display text-3xl mt-10">License</h2>
          <p className="text-zc-gray leading-relaxed">
            All course materials on ZC OCW are shared under a{' '}
            <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank"
               rel="noopener noreferrer" className="text-zc-sky hover:underline">
              Creative Commons BY-NC-SA 4.0
            </a>{' '}
            license. You are free to use, adapt, and share them for non-commercial purposes with attribution.
          </p>
        </div>

        <div className="mt-12 flex flex-wrap gap-4">
          <Link to="/courses" className="btn-primary">Browse Courses</Link>
          <a href="https://www.zewailcity.edu.eg" target="_blank" rel="noopener noreferrer"
             className="btn-outline">Visit Zewail City →</a>
        </div>
      </div>
    </>
  )
}
