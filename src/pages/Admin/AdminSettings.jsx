import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Settings, ArrowLeft, Download, Upload, Trash2, Key, Youtube, RefreshCw } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import * as storage from '@/services/storage'

export default function AdminSettings() {
  const { logout }    = useAuth()
  const [exported, setExported] = useState(false)
  const [imported, setImported] = useState(false)
  const [cleared,  setCleared]  = useState(false)

  function handleExport() {
    const data = {
      course_overrides:  storage.get('course_overrides', {}),
      exportedAt:        new Date().toISOString(),
      version:           '3.0',
    }
    // Also grab all materials + books
    const overrideIds = Object.keys(data.course_overrides)
    const materials = {}
    const books = {}
    for (const id of overrideIds) {
      materials[id] = storage.getMaterials(id)
      books[id]     = storage.getBooks(id)
    }
    data.materials = materials
    data.books     = books

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `zcocw-data-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExported(true)
    setTimeout(() => setExported(false), 3000)
  }

  function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (data.course_overrides) storage.set('course_overrides', data.course_overrides)
        if (data.materials) {
          for (const [id, mats] of Object.entries(data.materials)) {
            storage.set(`materials_${id}`, mats)
          }
        }
        if (data.books) {
          for (const [id, bks] of Object.entries(data.books)) {
            storage.set(`books_${id}`, bks)
          }
        }
        setImported(true)
        setTimeout(() => { setImported(false); window.location.reload() }, 2000)
      } catch {
        alert('Invalid file format.')
      }
    }
    reader.readAsText(file)
  }

  function handleClearAll() {
    if (!confirm('This will delete ALL course overrides, materials, and books. Are you sure?')) return
    const keys = ['course_overrides']
    for (const key of keys) storage.remove(key)
    setCleared(true)
    setTimeout(() => { setCleared(false); window.location.reload() }, 2000)
  }

  return (
    <>
      <Helmet><title>Admin Settings — ZC OCW</title></Helmet>

      <div className="page-header">
        <div className="section">
          <Link to="/admin" className="inline-flex items-center gap-1.5 text-white/45 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-1">
            <Settings className="w-6 h-6 text-ocean-400" />
            <p className="text-ocean-400 text-xs font-semibold uppercase tracking-widest">Admin</p>
          </div>
          <h1 className="font-display text-4xl font-bold">Admin Settings</h1>
        </div>
      </div>

      <div className="section py-10 max-w-2xl space-y-6">

        {/* YouTube config */}
        <div className="card-flat border border-slate-100 shadow-card">
          <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
              <Youtube className="w-4.5 h-4.5 text-red-600" />
            </div>
            <h2 className="font-display text-lg font-bold text-ink">YouTube Configuration</h2>
          </div>
          <p className="text-sm text-ink-muted mb-4 leading-relaxed">
            These values are set in your <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">.env</code> file.
            Restart the dev server after changes.
          </p>
          <div className="space-y-3">
            {[
              { label: 'API Key', env: 'VITE_YOUTUBE_API_KEY', icon: Key },
              { label: 'Channel ID', env: 'VITE_YOUTUBE_CHANNEL_ID', icon: Youtube },
            ].map(({ label, env, icon: Icon }) => (
              <div key={env} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <Icon className="w-4 h-4 text-ink-ghost flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-ink-muted">{label}</p>
                  <p className="font-mono text-xs text-ink-ghost truncate">{env}</p>
                </div>
                <span className={`badge text-[10px] ${
                  import.meta.env[env] ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {import.meta.env[env] ? '✓ Set' : '✗ Missing'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Data management */}
        <div className="card-flat border border-slate-100 shadow-card">
          <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-ocean-100 flex items-center justify-center">
              <Download className="w-4.5 h-4.5 text-ocean-600" />
            </div>
            <h2 className="font-display text-lg font-bold text-ink">Data Management</h2>
          </div>

          <p className="text-sm text-ink-muted mb-5 leading-relaxed">
            Export all course enrichments, materials, and books to a JSON file.
            Import to restore or migrate to another browser/device.
          </p>

          <div className="flex flex-wrap gap-3">
            <button onClick={handleExport}
                    className={`btn gap-2 ${exported ? 'btn-outline text-green-600 border-green-300' : 'btn-primary'}`}>
              <Download className="w-4 h-4" />
              {exported ? '✓ Exported!' : 'Export All Data'}
            </button>

            <label className="btn btn-outline gap-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              {imported ? '✓ Imported!' : 'Import Data'}
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
        </div>

        {/* Danger zone */}
        <div className="card-flat border border-red-200 shadow-card bg-red-50/30">
          <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-red-100">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
              <Trash2 className="w-4.5 h-4.5 text-red-600" />
            </div>
            <h2 className="font-display text-lg font-bold text-red-700">Danger Zone</h2>
          </div>

          <p className="text-sm text-red-600/80 mb-4">
            These actions are irreversible. Export your data first.
          </p>

          <div className="flex flex-wrap gap-3">
            <button onClick={handleClearAll} className="btn-danger gap-2">
              <Trash2 className="w-4 h-4" />
              {cleared ? '✓ Cleared!' : 'Clear All Course Data'}
            </button>
            <button onClick={logout} className="btn btn-outline border-red-200 text-red-600 hover:bg-red-50 gap-2">
              Sign Out of Admin
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
