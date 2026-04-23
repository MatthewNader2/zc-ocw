import { Link } from 'react-router-dom'
import { GraduationCap, Youtube, Facebook, Globe } from 'lucide-react'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="bg-ocean-950 text-white/60 border-t border-white/6">
      <div className="section py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* Brand */}
        <div className="lg:col-span-2">
          <Link to="/" className="flex items-center gap-3 mb-4">
            <img src="/logo.svg" alt="ZC" className="h-10 w-auto" />
            <div>
              <p className="font-display text-white text-lg font-bold">ZC <span className="text-ocean-400">Open CourseWare</span></p>
              <p className="text-xs text-white/35 mt-0.5">University of Science and Technology</p>
            </div>
          </Link>
          <p className="text-sm leading-relaxed max-w-xs mb-5">
            Free access to lecture videos and course materials from Zewail City,
            advancing open education across Egypt and the Arab world.
          </p>
          <div className="flex items-center gap-3">
            <a href="https://www.youtube.com/channel/UCGNOEBp7AZaY4XPNoagpv8w"
               target="_blank" rel="noopener noreferrer"
               className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center
                          hover:bg-red-500/20 hover:text-red-400 transition-all">
              <Youtube className="w-4 h-4" />
            </a>
            <a href="https://www.facebook.com/zc.opencourseware.9"
               target="_blank" rel="noopener noreferrer"
               className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center
                          hover:bg-blue-500/20 hover:text-blue-400 transition-all">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="https://www.zewailcity.edu.eg"
               target="_blank" rel="noopener noreferrer"
               className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center
                          hover:bg-ocean-400/20 hover:text-ocean-400 transition-all">
              <Globe className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Browse */}
        <div>
          <h4 className="font-display text-white font-semibold text-sm mb-4">Browse</h4>
          <ul className="space-y-2.5 text-sm">
            {[['/', 'Home'], ['/courses', 'All Courses'], ['/departments', 'Departments'], ['/search', 'Search'], ['/bookmarks', 'Bookmarks']].map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="hover:text-ocean-300 transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* University */}
        <div>
          <h4 className="font-display text-white font-semibold text-sm mb-4">University</h4>
          <ul className="space-y-2.5 text-sm">
            {[
              ['https://www.zewailcity.edu.eg', 'ZC Website'],
              ['https://www.youtube.com/channel/UCGNOEBp7AZaY4XPNoagpv8w', 'YouTube Channel'],
              ['/about', 'About OCW'],
              ['/settings', 'Settings'],
            ].map(([href, label]) => (
              <li key={href}>
                <a href={href} target={href.startsWith('http') ? '_blank' : undefined}
                   rel="noopener noreferrer"
                   className="hover:text-ocean-300 transition-colors">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/6">
        <div className="section py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <p>© {year} Zewail City of Science and Technology. All rights reserved.</p>
          <p>
            Content licensed under{' '}
            <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener noreferrer"
               className="text-ocean-400 hover:underline">CC BY-NC-SA 4.0</a>
          </p>
        </div>
      </div>
    </footer>
  )
}
