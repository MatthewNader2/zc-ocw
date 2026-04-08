import { Link } from 'react-router-dom'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="bg-zc-navy text-white/70 mt-20">
      <div className="section py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <img src="/logo.svg" alt="Zewail City" className="h-10 w-auto" />
            <div>
              <p className="font-display text-white text-lg leading-none">
                <span className="text-zc-gold font-bold">ZC</span> Open CourseWare
              </p>
              <p className="text-xs mt-0.5 text-white/50">University of Science and Technology</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed max-w-sm">
            Free access to course materials from Zewail City, advancing open education
            across Egypt and the Arab world.
          </p>
        </div>

        {/* Links */}
        <div>
          <h4 className="font-display text-white font-semibold mb-3">Browse</h4>
          <ul className="space-y-2 text-sm">
            {[['/', 'Home'], ['/courses', 'All Courses'], ['/departments', 'Departments'], ['/search', 'Search']].map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="hover:text-zc-gold transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* External */}
        <div>
          <h4 className="font-display text-white font-semibold mb-3">University</h4>
          <ul className="space-y-2 text-sm">
            {[
              ['https://www.zewailcity.edu.eg', 'ZC Website'],
              ['https://www.youtube.com/@ZewailCityOCW', 'YouTube Channel'],
              ['/about', 'About OCW'],
            ].map(([href, label]) => (
              <li key={href}>
                <a
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="hover:text-zc-gold transition-colors"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="section py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <p>© {year} Zewail City of Science and Technology. All rights reserved.</p>
          <p>
            Content licensed under{' '}
            <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener noreferrer"
               className="text-zc-gold hover:underline">
              CC BY-NC-SA 4.0
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
