import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Settings as SettingsIcon,
  Play, BookOpen, Gauge, RotateCcw, Sun, Moon, Monitor, Shield, LayoutDashboard, Lock, Sparkles
} from 'lucide-react'
import { useSettings } from '@/context/SettingsContext'
import { useAuth } from '@/context/AuthContext'
import ScrollReveal   from '@/components/ui/ScrollReveal'

/* ── Toggle switch ──────────────────────────────────────────────────────────── */
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-300
                  cursor-pointer flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-ocean-400/40
                  ${checked ? 'bg-ocean-500' : 'bg-slate-200'}`}
    >
      <span className={`pointer-events-none absolute top-1 h-4 w-4 rounded-full bg-white dark:bg-night-200
                        shadow-sm transition-transform duration-300
                        ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

/* ── Setting row ────────────────────────────────────────────────────────────── */
function SettingRow({ label, desc, children }) {
  return (
    <div className="flex items-center justify-between gap-6 py-4
                    border-b border-slate-100 dark:border-white/10 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-ink dark:text-white">{label}</p>
        {desc && <p className="text-xs text-ink-ghost dark:text-slate-400 mt-0.5 leading-relaxed">{desc}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

/* ── Section card ────────────────────────────────────────────────────────────── */
function Section({ icon: Icon, iconColor, title, children }) {
  return (
    <div className="card-flat border border-slate-100 dark:border-white/10 dark:bg-night-200 shadow-card">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100 dark:border-white/10">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconColor}`}>
          <Icon className="w-4.5 h-4.5" strokeWidth={1.8} />
        </div>
        <h2 className="font-display text-lg font-bold text-ink dark:text-white">{title}</h2>
      </div>
      {children}
    </div>
  )
}

/* ── Page ────────────────────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const { settings, update, reset } = useSettings()

  return (
    <>
      <Helmet><title>Settings — ZC OCW</title></Helmet>

      <div className="page-header">
        <div className="section">
          <div className="flex items-center gap-3 mb-1">
            <SettingsIcon className="w-6 h-6 text-ocean-400" strokeWidth={2} />
            <p className="text-ocean-400 text-xs font-semibold uppercase tracking-widest">
              Preferences
            </p>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold">Settings</h1>
          <p className="text-white/45 mt-1 text-sm">
            Your preferences are saved locally in your browser.
          </p>
        </div>
      </div>

      <div className="section py-10 max-w-2xl space-y-6">

        {/* Appearance & Theme */}
        <ScrollReveal>
          <Section icon={Sun} iconColor="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300" title="Appearance & Theme">
            <SettingRow
              label="Theme Mode"
              desc="Choose your preferred color theme or match your device system settings."
            >
              <div className="flex gap-2">
                {[
                  { id: 'light', label: 'Light', icon: Sun },
                  { id: 'dark', label: 'Dark', icon: Moon },
                  { id: 'system', label: 'System', icon: Monitor },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => update('theme', id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      settings.theme === id
                        ? 'bg-ocean-950 text-white border-ocean-950 dark:bg-ocean-500 dark:border-ocean-500'
                        : 'border-slate-200 text-ink-subtle hover:border-ocean-400 dark:border-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </SettingRow>
          </Section>
        </ScrollReveal>

        {/* Playback */}
        <ScrollReveal>
          <Section icon={Play} iconColor="bg-ocean-100 text-ocean-600" title="Playback">
            <SettingRow
              label="Auto-play next lecture"
              desc="Automatically start the next video when the current one ends."
            >
              <Toggle
                checked={settings.autoplayNext}
                onChange={v => update('autoplayNext', v)}
              />
            </SettingRow>

            <SettingRow label="Default playback speed">
              <select
                value={settings.playbackSpeed}
                onChange={e => update('playbackSpeed', parseFloat(e.target.value))}
                className="input w-28 text-sm"
              >
                {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(s => (
                  <option key={s} value={s}>{s}×</option>
                ))}
              </select>
            </SettingRow>

            <SettingRow label="Default video quality">
              <select
                value={settings.defaultQuality}
                onChange={e => update('defaultQuality', e.target.value)}
                className="input w-32 text-sm"
              >
                {[
                  { value:'highres',  label:'4K / 2160p' },
                  { value:'hd1080',   label:'1080p HD'   },
                  { value:'hd720',    label:'720p HD'     },
                  { value:'large',    label:'480p'        },
                  { value:'medium',   label:'360p'        },
                  { value:'small',    label:'240p'        },
                  { value:'default',  label:'Auto'        },
                ].map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </SettingRow>
          </Section>
        </ScrollReveal>

        {/* Display */}
        <ScrollReveal delay="0.1s">
          <Section icon={BookOpen} iconColor="bg-purple-100 text-purple-600" title="Display">
            <SettingRow
              label="Show progress on course cards"
              desc="Display watch progress ring and percentage on course thumbnails."
            >
              <Toggle
                checked={settings.showProgress}
                onChange={v => update('showProgress', v)}
              />
            </SettingRow>

            <SettingRow
              label="Compact course cards"
              desc="Smaller cards with less info — fit more courses per row."
            >
              <Toggle
                checked={settings.compactCards}
                onChange={v => update('compactCards', v)}
              />
            </SettingRow>
          </Section>
        </ScrollReveal>

        {/* Data */}
        <ScrollReveal delay="0.2s">
          <Section icon={Gauge} iconColor="bg-amber-100 text-amber-600" title="Your Data">
            <p className="text-sm text-ink-muted leading-relaxed mb-5">
              ZC OCW saves your watch progress, notes, bookmarks, and settings in your
              browser's local storage. No account is needed and nothing is sent to any server.
            </p>
            <button
              type="button"
              onClick={() => { if (confirm('Reset all settings to defaults?')) reset() }}
              className="btn-danger gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset all settings to defaults
            </button>
          </Section>
        </ScrollReveal>

        {/* Admin Portal & Management */}
        <ScrollReveal delay="0.25s">
          <Section icon={Shield} iconColor="bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300" title="Administrator Portal">
            <p className="text-sm text-ink-muted dark:text-slate-300 leading-relaxed mb-5">
              Access the administrative studio to manage course metadata, upload syllabus/materials, edit the team directory, or customize site branding.
            </p>
            {isAdmin ? (
              <div className="flex flex-wrap gap-3">
                <Link to="/admin/settings" className="btn-primary gap-2 text-xs">
                  <SettingsIcon className="w-4 h-4" /> Open Admin Settings &amp; CMS
                </Link>
                <Link to="/admin" className="btn-outline gap-2 text-xs">
                  <LayoutDashboard className="w-4 h-4" /> Admin Dashboard
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <Link to="/admin/login" className="btn-primary gap-2 text-xs">
                  <Lock className="w-4 h-4" /> Sign In to Admin Portal
                </Link>
                <span className="text-xs text-ink-ghost dark:text-slate-400">
                  Authorized ZC-OCW team accounts only
                </span>
              </div>
            )}
          </Section>
        </ScrollReveal>
      </div>
    </>
  )
}
