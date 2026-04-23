import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { LogOut, Settings, Edit2, ExternalLink, CheckCircle2, Layers, BookOpen, FileText } from 'lucide-react'
import { useAuth }       from '@/context/AuthContext'
import { useAdminData }  from '@/context/AdminDataContext'
import { usePlaylists }  from '@/hooks/useYouTube'
import { detectFromTitle, getSchool } from '@/data/coursesCatalog'
import { getThumbnail }  from '@/services/youtube'
import { PageLoader }    from '@/components/ui/LoadingSpinner'
import ScrollReveal from '@/components/ui/ScrollReveal'
import clsx from 'clsx'

const SCHOOL_ACCENT = { csai:'#0096c7', business:'#0d9488', science:'#7c3aed', engineering:'#ea580c' }

export default function AdminDashboard() {
  const { logout }                                      = useAuth()
  const { getCourseData, getMaterials, getBooks }        = useAdminData()
  const { data, isLoading }                             = usePlaylists()
  const courses = data?.pages?.flatMap(p => p.items) ?? []

  const enrichedCount = courses.filter(c => getCourseData(c.id)?.instructor || getCourseData(c.id)?.schoolId).length
  const matCount      = courses.filter(c => getMaterials(c.id).length > 0).length
  const bookCount     = courses.filter(c => getBooks(c.id).length > 0).length

  return (
    <>
      <Helmet><title>Admin Dashboard — ZC OCW</title></Helmet>

      <div className="page-header">
        <div className="section flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-ocean-400 text-xs font-semibold uppercase tracking-widest mb-1">Admin Panel</p>
            <h1 className="font-display text-4xl font-bold">Dashboard</h1>
            <p className="text-white/45 text-sm mt-1">{courses.length} playlists from YouTube</p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/settings" className="btn-outline-dark gap-2">
              <Settings className="w-4 h-4" /> Settings
            </Link>
            <button onClick={logout} className="btn-outline-dark gap-2">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="section py-10">
        {/* Info */}
        <ScrollReveal>
          <div className="bg-ocean-50 border border-ocean-200/60 rounded-2xl p-5 mb-8 flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-ocean-500/15 flex items-center justify-center flex-shrink-0">
              <Layers className="w-5 h-5 text-ocean-600" />
            </div>
            <div className="text-sm text-ink-muted space-y-1">
              <p className="font-semibold text-ink">Smart Auto-Detection</p>
              <p className="leading-relaxed">
                Playlist titles are scanned for course codes (e.g. "PHYS 323"). When matched, school,
                program, and tags are set automatically. Use the Edit button to override anything and add materials.
                Run <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">npm run profile</code> in
                terminal to see a full detection table.
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* Stats */}
        <ScrollReveal delay="0.1s">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {[
              { label:'Total playlists', value:courses.length,  icon:Layers },
              { label:'Enriched',        value:enrichedCount,   icon:CheckCircle2 },
              { label:'With materials',  value:matCount,        icon:FileText },
              { label:'With books',      value:bookCount,       icon:BookOpen },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="card-flat border border-slate-100 shadow-card text-center">
                <Icon className="w-5 h-5 text-ocean-500 mx-auto mb-2" strokeWidth={1.8} />
                <p className="font-display text-3xl font-bold text-ocean-700">{value}</p>
                <p className="text-xs text-ink-ghost mt-1">{label}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Course list */}
        <ScrollReveal delay="0.15s">
          <h2 className="font-display text-2xl text-ink mb-5">All Courses</h2>
        </ScrollReveal>

        {isLoading ? <PageLoader /> : (
          <div className="space-y-3">
            {courses.map((playlist, i) => {
              const override   = getCourseData(playlist.id)
              const auto       = detectFromTitle(playlist.snippet.title)
              const mats       = getMaterials(playlist.id).length
              const bks        = getBooks(playlist.id).length
              const schoolId   = override.schoolId ?? auto?.schoolId ?? null
              const school     = getSchool(schoolId)
              const isEnriched = !!(override.instructor || override.schoolId || override.description)
              const accent     = schoolId ? SCHOOL_ACCENT[schoolId] : null

              return (
                <ScrollReveal key={playlist.id} delay={`${Math.min(i * 0.04, 0.4)}s`}>
                  <div className="card flex items-center gap-4 p-4 hover:shadow-card-hover group">
                    {/* Accent line */}
                    {accent && <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[1.25rem]" style={{ background: accent }} />}

                    {/* Thumbnail */}
                    <img src={getThumbnail(playlist.snippet, 'medium')} alt={playlist.snippet.title}
                         className="w-20 aspect-video object-cover rounded-xl flex-shrink-0 bg-slate-100" />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {school && schoolId !== 'general' && (
                          <span className="badge text-[10px] text-white" style={{ backgroundColor: accent }}>
                            {school.short}
                          </span>
                        )}
                        {auto?.code && <span className="font-mono text-[11px] text-ink-ghost">{auto.code}</span>}
                        {auto?.confidence === 'high' && <span className="badge text-[10px] bg-green-50 text-green-700">auto ✓</span>}
                        {isEnriched && <span className="badge text-[10px] bg-ocean-50 text-ocean-700">enriched ✓</span>}
                      </div>
                      <p className="font-semibold text-sm text-ink truncate">{playlist.snippet.title}</p>
                      <p className="text-xs text-ink-ghost mt-0.5">
                        {playlist.contentDetails.itemCount} lectures
                        {mats > 0 && ` · ${mats} material${mats > 1 ? 's' : ''}`}
                        {bks  > 0 && ` · ${bks} book${bks > 1 ? 's' : ''}`}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <Link to={`/admin/courses/${playlist.id}`} className="btn-primary btn-sm gap-1.5">
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </Link>
                      <Link to={`/courses/${playlist.id}`} className="btn-outline btn-sm gap-1.5">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
