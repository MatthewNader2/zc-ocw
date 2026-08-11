import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Settings, ArrowLeft, Download, Upload, Trash2, Key, Youtube, Plus, GraduationCap, BookOpen, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useAdminData } from '@/context/AdminDataContext'
import * as storage from '@/services/storage'

export default function AdminSettings() {
  const { logout } = useAuth()
  const {
    allSchools,
    allPrograms,
    customSchools,
    customPrograms,
    addCustomSchool,
    deleteCustomSchool,
    addCustomProgram,
    deleteCustomProgram
  } = useAdminData()

  const [exported, setExported] = useState(false)
  const [imported, setImported] = useState(false)
  const [cleared,  setCleared]  = useState(false)

  // School form state
  const [schoolForm, setSchoolForm] = useState({
    id: '',
    label: '',
    short: '',
    icon: '🎓',
    description: '',
    accent: '#0284c7'
  })
  const [schoolSaved, setSchoolSaved] = useState(false)

  // Program form state
  const [programForm, setProgramForm] = useState({
    schoolId: '',
    id: '',
    label: '',
    prefixes: ''
  })
  const [programSaved, setProgramSaved] = useState(false)

  function handleAddSchool(e) {
    e.preventDefault()
    if (!schoolForm.id || !schoolForm.label) {
      alert('Please fill out at least School ID and School Name.')
      return
    }
    const cleanId = schoolForm.id.toLowerCase().replace(/[^a-z0-9_]/g, '')
    addCustomSchool({
      ...schoolForm,
      id: cleanId,
      short: schoolForm.short || cleanId.toUpperCase()
    })
    setSchoolForm({ id: '', label: '', short: '', icon: '🎓', description: '', accent: '#0284c7' })
    setSchoolSaved(true)
    setTimeout(() => setSchoolSaved(false), 3000)
  }

  function handleAddProgram(e) {
    e.preventDefault()
    if (!programForm.schoolId || !programForm.id || !programForm.label) {
      alert('Please select a School and fill out Major ID and Major Name.')
      return
    }
    const cleanId = programForm.id.toLowerCase().replace(/[^a-z0-9_]/g, '')
    const prefixArray = programForm.prefixes
      .split(',')
      .map(p => p.trim().toUpperCase())
      .filter(Boolean)

    addCustomProgram(programForm.schoolId, {
      id: cleanId,
      label: programForm.label,
      prefixes: prefixArray
    })
    setProgramForm({ schoolId: '', id: '', label: '', prefixes: '' })
    setProgramSaved(true)
    setTimeout(() => setProgramSaved(false), 3000)
  }

  function handleExport() {
    const data = {
      course_overrides:  storage.get('course_overrides', {}),
      custom_schools:    storage.getCustomSchools(),
      custom_programs:   storage.getCustomPrograms(),
      exportedAt:        new Date().toISOString(),
      version:           '3.1',
    }
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
        if (data.custom_schools) storage.saveCustomSchools(data.custom_schools)
        if (data.custom_programs) storage.saveCustomPrograms(data.custom_programs)
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
    if (!confirm('This will delete ALL course overrides, custom schools/majors, materials, and books. Are you sure?')) return
    storage.remove('course_overrides')
    storage.remove('custom_schools')
    storage.remove('custom_programs')
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

      <div className="section py-10 max-w-4xl space-y-8">

        {/* 🎓 Custom Schools & Majors Catalog Management */}
        <div className="card-flat border border-slate-100 shadow-card">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-ocean-100 flex items-center justify-center">
                <GraduationCap className="w-4.5 h-4.5 text-ocean-600" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-ink">Schools & Majors Catalog Manager</h2>
                <p className="text-xs text-ink-ghost">Add new university schools or majors dynamically without modifying code.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Add School Form */}
            <form onSubmit={handleAddSchool} className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-ink flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-ocean-500" /> Add New School
                </h3>
                {schoolSaved && <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Added!</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">School ID (slug)</label>
                <input
                  value={schoolForm.id}
                  onChange={e => setSchoolForm(f => ({ ...f, id: e.target.value }))}
                  placeholder="biotech"
                  className="input text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">School Full Name</label>
                <input
                  value={schoolForm.label}
                  onChange={e => setSchoolForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="School of Biotechnology"
                  className="input text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Short Badge</label>
                  <input
                    value={schoolForm.short}
                    onChange={e => setSchoolForm(f => ({ ...f, short: e.target.value }))}
                    placeholder="BIOTECH"
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Emoji Icon</label>
                  <input
                    value={schoolForm.icon}
                    onChange={e => setSchoolForm(f => ({ ...f, icon: e.target.value }))}
                    placeholder="🧬"
                    className="input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Description</label>
                <textarea
                  value={schoolForm.description}
                  onChange={e => setSchoolForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Focuses on genomics, molecular biology, and health sciences..."
                  className="input text-xs resize-none"
                  rows={2}
                />
              </div>

              <button type="submit" className="btn-primary text-xs w-full gap-2">
                <Plus className="w-3.5 h-3.5" /> Register New School
              </button>
            </form>

            {/* Add Major / Program Form */}
            <form onSubmit={handleAddProgram} className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-ink flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-ocean-500" /> Add New Major / Program
                </h3>
                {programSaved && <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Added!</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Parent School</label>
                <select
                  value={programForm.schoolId}
                  onChange={e => setProgramForm(f => ({ ...f, schoolId: e.target.value }))}
                  className="input text-xs"
                  required
                >
                  <option value="">— Select School —</option>
                  {allSchools.map(s => (
                    <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Major ID (slug)</label>
                <input
                  value={programForm.id}
                  onChange={e => setProgramForm(f => ({ ...f, id: e.target.value }))}
                  placeholder="genomics"
                  className="input text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Major Name</label>
                <input
                  value={programForm.label}
                  onChange={e => setProgramForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="Genomics & Precision Medicine"
                  className="input text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Course Code Prefixes (comma-separated)</label>
                <input
                  value={programForm.prefixes}
                  onChange={e => setProgramForm(f => ({ ...f, prefixes: e.target.value }))}
                  placeholder="GEN, BIOT"
                  className="input text-xs"
                />
              </div>

              <button type="submit" className="btn-primary text-xs w-full gap-2">
                <Plus className="w-3.5 h-3.5" /> Register New Major
              </button>
            </form>
          </div>

          {/* List of Custom Registered Catalog Entries */}
          {(customSchools.length > 0 || Object.keys(customPrograms).length > 0) && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h3 className="font-semibold text-sm text-ink mb-4">Active Custom Catalog Additions</h3>
              
              <div className="space-y-3">
                {customSchools.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{s.icon}</span>
                      <div>
                        <p className="text-xs font-bold text-ink">{s.label} <span className="font-mono text-[10px] text-ocean-600 bg-ocean-50 px-1.5 py-0.5 rounded">ID: {s.id}</span></p>
                        <p className="text-[11px] text-ink-ghost">{s.description || 'Custom added school'}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteCustomSchool(s.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Custom School"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {Object.entries(customPrograms).map(([sId, progs]) =>
                  progs.map(p => (
                    <div key={`${sId}-${p.id}`} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-4 h-4 text-ocean-500" />
                        <div>
                          <p className="text-xs font-bold text-ink">{p.label} <span className="font-mono text-[10px] text-ocean-600 bg-ocean-50 px-1.5 py-0.5 rounded">Under School: {sId}</span></p>
                          {p.prefixes?.length > 0 && (
                            <p className="text-[11px] text-ink-ghost">Prefixes: {p.prefixes.join(', ')}</p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteCustomProgram(sId, p.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Custom Major"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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
            Export all course enrichments, custom schools/majors, materials, and books to a JSON file.
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
