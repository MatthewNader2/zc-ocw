import { Link } from "react-router-dom";
import {
  GraduationCap,
  Youtube,
  Facebook,
  Globe,
  Mail,
  Bug,
  Heart,
  Users,
} from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  const ytUrl = `https://www.youtube.com/channel/${import.meta.env.VITE_YOUTUBE_CHANNEL_ID}`;

  return (
    <footer className="bg-ocean-950 text-white/60 border-t border-white/6">
      <div className="section py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="lg:col-span-2">
          <Link to="/" className="flex items-center gap-3 mb-4">
            <img src="/logo.svg" alt="ZC" className="h-10 w-auto" />
            <div>
              <p className="font-display text-white text-lg font-bold">
                ZC <span className="text-ocean-400">Open CourseWare</span>
              </p>
              <p className="text-xs text-white/35 mt-0.5">
                University of Science and Technology
              </p>
            </div>
          </Link>
          <p className="text-sm leading-relaxed max-w-xs mb-5">
            Free access to lecture videos and course materials from Zewail City,
            advancing open education across Egypt and the Arab world.
          </p>
          <div className="flex items-center gap-3">
            <a
              href={ytUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center
                          hover:bg-red-500/20 hover:text-red-400 transition-all"
            >
              <Youtube className="w-4 h-4" />
            </a>
            <a
              href="https://www.facebook.com/zc.opencourseware.9"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center
                          hover:bg-blue-500/20 hover:text-blue-400 transition-all"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href="https://www.zewailcity.edu.eg"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center
                          hover:bg-ocean-400/20 hover:text-ocean-400 transition-all"
            >
              <Globe className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Browse */}
        <div>
          <h4 className="font-display text-white font-semibold text-sm mb-4">
            Browse
          </h4>
          <ul className="space-y-2.5 text-sm">
            {[
              ["/", "Home"],
              ["/courses", "All Courses"],
              ["/departments", "Departments"],
              ["/interviews", "Interviews & Special"],
              ["/search", "Search"],
              ["/bookmarks", "Bookmarks"],
            ].map(([to, label]) => (
              <li key={to}>
                <Link
                  to={to}
                  className="hover:text-ocean-300 transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* University + Support */}
        <div>
          <h4 className="font-display text-white font-semibold text-sm mb-4">
            University
          </h4>
          <ul className="space-y-2.5 text-sm mb-6">
            {[
              ["https://www.zewailcity.edu.eg", "ZC Website"],
              [ytUrl, "YouTube Channel"],
              ["/about", "About OCW"],
              ["/acknowledgments", "Acknowledgments"],
              ["/settings", "Settings"],
            ].map(([href, label]) => (
              <li key={href}>
                <a
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="hover:text-ocean-300 transition-colors"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>

          <h4 className="font-display text-white font-semibold text-sm mb-4">
            Support
          </h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link
                to="/contact"
                className="hover:text-ocean-300 transition-colors flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" /> Contact Us
              </Link>
            </li>
            <li>
              <Link
                to="/report-bug"
                className="hover:text-ocean-300 transition-colors flex items-center gap-1.5"
              >
                <Bug className="w-3.5 h-3.5" /> Report a Bug
              </Link>
            </li>
            <li>
              <a
                href="mailto:zcocw@zewailcity.edu.eg"
                className="hover:text-ocean-300 transition-colors flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" /> zcocw@zewailcity.edu.eg
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/6">
        <div className="section py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <p className="flex items-center gap-1">
            © {year} Zewail City of Science and Technology. Made with{" "}
            <Heart className="w-3 h-3 text-red-400 fill-red-400" /> for open
            education.
          </p>
          <p>
            Content licensed under{" "}
            <a
              href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ocean-400 hover:underline"
            >
              CC BY-NC-SA 4.0
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
