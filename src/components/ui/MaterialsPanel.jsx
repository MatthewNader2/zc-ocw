import { useState, useRef } from 'react'
import {
  FileText, Presentation, BookOpen, HelpCircle, FileCheck, CheckCircle2,
  FlaskConical, ClipboardList, Zap, Book, Video, Image, Link2, Paperclip,
  Plus, Trash2, Download, ExternalLink, ChevronDown, Upload, CloudUpload, Globe
} from 'lucide-react'
import { useAdminData } from '@/context/AdminDataContext'
import { useAuth }      from '@/context/AuthContext'
import clsx from 'clsx'

export const MATERIAL_CATEGORIES = [
  { id:'syllabus',   label:'Syllabus',           icon:FileText,      color:'bg-blue-100 text-blue-700',     border:'border-blue-200'    },
  { id:'slides',     label:'Slides',             icon:Presentation,  color:'bg-purple-100 text-purple-700', border:'border-purple-200'  },
  { id:'notes',      label:'Lecture Notes',      icon:BookOpen,      color:'bg-indigo-100 text-indigo-700', border:'border-indigo-200'  },
  { id:'problem',    label:'Question Sheets',    icon:HelpCircle,    color:'bg-orange-100 text-orange-700', border:'border-orange-200'  },
  { id:'exam',       label:'Past Exams',         icon:FileCheck,     color:'bg-red-100 text-red-700',       border:'border-red-200'     },
  { id:'solution',   label:'Solutions',          icon:CheckCircle2,  color:'bg-green-100 text-green-700',   border:'border-green-200'   },
  { id:'lab',        label:'Lab Manuals',        icon:FlaskConical,  color:'bg-cyan-100 text-cyan-700',     border:'border-cyan-200'    },
  { id:'assignment', label:'Assignments',        icon:ClipboardList, color:'bg-amber-100 text-amber-700',   border:'border-amber-200'   },
  { id:'activity',   label:'Activities',         icon:Zap,           color:'bg-yellow-100 text-yellow-700', border:'border-yellow-200'  },
  { id:'textbook',   label:'Textbooks',          icon:Book,          color:'bg-emerald-100 text-emerald-700',border:'border-emerald-200'},
  { id:'video',      label:'Additional Videos',  icon:Video,         color:'bg-rose-100 text-rose-700',     border:'border-rose-200'    },
  { id:'image',      label:'Images & Diagrams',  icon:Image,         color:'bg-pink-100 text-pink-700',     border:'border-pink-200'    },
  { id:'link',       label:'External Links',     icon:Link2,         color:'bg-sky-100 text-sky-700',       border:'border-sky-200'     },
  { id:'other',      label:'Other',              icon:Paperclip,     color:'bg-gray-100 text-gray-600',     border:'border-gray-200'    },
]

function getCat(id) { return MATERIAL_CATEGORIES.find(c => c.id === id) ?? MATERIAL_CATEGORIES.at(-1) }

function groupMaterials(list) {
  const map = {}
  for (const item of list) {
    if (!map[item.type]) map[item.type] = []
    map[item.type].push(item)
  }
  return MATERIAL_CATEGORIES.filter(c => map[c.id]).map(c => ({ cat: c, items: map[c.id] }))
}

export default function MaterialsPanel({ playlistId, inAdmin = false }) {
  const { isAdmin }                                = useAuth()
  const { getMaterials, addMaterial, deleteMaterial,
          getBooks, addBook, deleteBook, useCloud } = useAdminData()

  const materials = getMaterials(playlistId)
  const books     = getBooks(playlistId)
  const canEdit   = isAdmin || inAdmin

  const [addOpen,    setAddOpen]    = useState(false)
  const [addBookOpen,setAddBookOpen]= useState(false)
  const [uploading,  setUploading]  = useState(false)
  const [uploadMode, setUploadMode] = useState('url')   // 'url' | 'file'
  const [openGroups, setOpenGroups] = useState({})

  const [matForm,  setMatForm]  = useState({ type:'slides', label:'', url:'' })
  const [bookForm, setBookForm] = useState({ title:'', author:'', edition:'', isbn:'', url:'' })
  const fileRef = useRef(null)

  const hasContent = materials.length > 0 || books.length > 0
  if (!hasContent && !canEdit) return null

  const groups = groupMaterials(materials)
  function toggleGroup(id) { setOpenGroups(p => ({ ...p, [id]: p[id] === false })) }

  async function submitMat(e) {
    e.preventDefault()
    if (!matForm.label.trim()) return
    if (uploadMode === 'url' && !matForm.url.trim()) return
    if (uploadMode === 'file' && !fileRef.current?.files?.[0]) return

    setUploading(true)
    try {
      const payload = { type: matForm.type, label: matForm.label.trim() }
      if (uploadMode === 'file') {
        payload.file = fileRef.current.files[0]
        payload.url  = ''
      } else {
        payload.url = matForm.url.trim()
      }
      await addMaterial(playlistId, payload)
      setMatForm({ type:'slides', label:'', url:'' })
      if (fileRef.current) fileRef.current.value = ''
      setAddOpen(false)
    } finally { setUploading(false) }
  }

  async function submitBook(e) {
    e.preventDefault()
    if (!bookForm.title.trim()) return
    await addBook(playlistId, { ...bookForm })
    setBookForm({ title:'', author:'', edition:'', isbn:'', url:'' })
    setAddBookOpen(false)
  }

  function fmtSize(bytes) {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024*1024) return `${(bytes/1024).toFixed(1)} KB`
    return `${(bytes/1024/1024).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6">
      {/* ── Materials ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-base font-semibold text-ink">Course Materials</h3>
          {canEdit && (
            <button onClick={() => setAddOpen(!addOpen)} type="button"
                    className={clsx('btn btn-sm', addOpen ? 'btn-outline' : 'btn-primary')}>
              <Plus className="w-3.5 h-3.5" />
              {addOpen ? 'Cancel' : 'Add'}
            </button>
          )}
        </div>

        {/* Add form */}
        {addOpen && (
          <form onSubmit={submitMat}
                className="bg-ocean-50 border border-ocean-200/60 rounded-2xl p-4 mb-4 space-y-4 animate-scale-in">
            <p className="text-xs font-semibold text-ocean-700">New Material</p>

            {/* Type picker */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {MATERIAL_CATEGORIES.map(cat => {
                const Icon = cat.icon
                return (
                  <button key={cat.id} type="button"
                          onClick={() => setMatForm(f => ({...f, type: cat.id}))}
                          className={clsx(
                            'flex flex-col items-center gap-1 p-2 rounded-xl border text-[10px] font-semibold transition-all',
                            matForm.type === cat.id
                              ? `${cat.color} ${cat.border} scale-[1.04] shadow-sm`
                              : 'border-slate-200 text-ink-ghost hover:border-slate-300 bg-white'
                          )}>
                    <Icon className="w-4 h-4" />
                    <span className="leading-tight text-center">{cat.label.split(' ')[0]}</span>
                  </button>
                )
              })}
            </div>

            {/* Label */}
            <input value={matForm.label}
                   onChange={e => setMatForm(f => ({...f, label: e.target.value}))}
                   placeholder={`Label — e.g. "${getCat(matForm.type).label} Week 3"`}
                   className="input" required />

            {/* Upload mode toggle */}
            <div className="flex gap-2">
              {[
                { mode:'url',  label:'Link / URL',   icon:Globe    },
                { mode:'file', label:'Upload File',  icon:CloudUpload, disabled: !useCloud },
              ].map(({ mode, label, icon: Icon, disabled }) => (
                <button key={mode} type="button"
                        disabled={disabled}
                        onClick={() => setUploadMode(mode)}
                        title={disabled ? 'Configure Supabase to enable file uploads' : ''}
                        className={clsx(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                          disabled ? 'opacity-40 cursor-not-allowed border-slate-200 text-ink-ghost' :
                          uploadMode === mode
                            ? 'bg-ocean-600 text-white border-ocean-600 shadow-sm'
                            : 'border-slate-200 text-ink-subtle hover:border-ocean-300 bg-white'
                        )}>
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                  {disabled && <span className="ml-1 text-[9px] opacity-60">(needs Supabase)</span>}
                </button>
              ))}
            </div>

            {uploadMode === 'url' ? (
              <input value={matForm.url}
                     onChange={e => setMatForm(f => ({...f, url: e.target.value}))}
                     placeholder="https://drive.google.com/…  or  https://example.com/file.pdf"
                     className="input" required />
            ) : (
              <div className="border-2 border-dashed border-ocean-200 rounded-xl p-4 text-center cursor-pointer
                              hover:border-ocean-400 transition-colors bg-white"
                   onClick={() => fileRef.current?.click()}>
                <Upload className="w-6 h-6 text-ocean-400 mx-auto mb-2" />
                <p className="text-sm text-ink-muted">Click to select file</p>
                <p className="text-xs text-ink-ghost mt-1">PDF, DOCX, PPTX, images, ZIP…</p>
                <input ref={fileRef} type="file" className="hidden"
                       accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.png,.jpg,.jpeg,.mp4,.webm" />
              </div>
            )}

            <div className="flex gap-2">
              <button type="submit" disabled={uploading}
                      className="btn-primary btn-sm gap-2">
                {uploading
                  ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Uploading…</>
                  : <><Plus className="w-3.5 h-3.5" />Save material</>
                }
              </button>
              <button type="button" onClick={() => setAddOpen(false)} className="btn-outline btn-sm">Cancel</button>
            </div>
          </form>
        )}

        {/* Grouped list */}
        {groups.length === 0 ? (
          <p className="text-sm text-ink-ghost text-center py-8">
            {canEdit ? 'No materials yet.' : 'No materials available.'}
          </p>
        ) : (
          <div className="space-y-2">
            {groups.map(({ cat, items }) => {
              const Icon  = cat.icon
              const open  = openGroups[cat.id] !== false
              return (
                <div key={cat.id} className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
                  <button type="button" onClick={() => toggleGroup(cat.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors">
                    <span className={clsx('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm', cat.color)}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="font-semibold text-sm text-ink flex-1">{cat.label}</span>
                    <span className="text-xs text-ink-ghost font-mono mr-1">{items.length}</span>
                    <ChevronDown className={clsx('w-4 h-4 text-ink-ghost transition-transform duration-200', open && 'rotate-180')} />
                  </button>
                  {open && (
                    <div className="border-t border-slate-100 divide-y divide-slate-50">
                      {items.map(mat => (
                        <div key={mat.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-ink truncate">{mat.label}</p>
                            {mat.file_size && (
                              <p className="text-xs text-ink-ghost">{fmtSize(mat.file_size)}</p>
                            )}
                          </div>
                          <a href={mat.url} target="_blank" rel="noopener noreferrer"
                             className="btn-outline btn-sm gap-1.5 flex-shrink-0">
                            <Download className="w-3 h-3" /> Open
                          </a>
                          {canEdit && (
                            <button onClick={() => deleteMaterial(playlistId, mat.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg
                                               text-red-400 hover:bg-red-50 hover:text-red-600 transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Books / Textbooks ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-base font-semibold text-ink">Textbooks</h3>
          {canEdit && (
            <button onClick={() => setAddBookOpen(!addBookOpen)} type="button"
                    className={clsx('btn btn-sm', addBookOpen ? 'btn-outline' : 'btn-primary')}>
              <Plus className="w-3.5 h-3.5" />
              {addBookOpen ? 'Cancel' : 'Add Book'}
            </button>
          )}
        </div>

        {addBookOpen && (
          <form onSubmit={submitBook}
                className="bg-ocean-50 border border-ocean-200/60 rounded-2xl p-4 mb-4 space-y-3 animate-scale-in">
            <p className="text-xs font-semibold text-ocean-700">Add Textbook / Reference</p>
            <input value={bookForm.title}   onChange={e=>setBookForm(f=>({...f,title:e.target.value}))}   placeholder="Book title *"  className="input" required />
            <div className="grid grid-cols-2 gap-2">
              <input value={bookForm.author}  onChange={e=>setBookForm(f=>({...f,author:e.target.value}))}  placeholder="Author(s)"    className="input" />
              <input value={bookForm.edition} onChange={e=>setBookForm(f=>({...f,edition:e.target.value}))} placeholder="Edition"      className="input" />
              <input value={bookForm.isbn}    onChange={e=>setBookForm(f=>({...f,isbn:e.target.value}))}    placeholder="ISBN"         className="input" />
              <input value={bookForm.url}     onChange={e=>setBookForm(f=>({...f,url:e.target.value}))}     placeholder="URL (optional)" className="input" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary btn-sm gap-1.5"><Plus className="w-3.5 h-3.5" />Save book</button>
              <button type="button" onClick={() => setAddBookOpen(false)} className="btn-outline btn-sm">Cancel</button>
            </div>
          </form>
        )}

        {books.length === 0 ? (
          <p className="text-sm text-ink-ghost text-center py-5">
            {canEdit ? 'No textbooks yet.' : 'No textbooks listed.'}
          </p>
        ) : (
          <div className="space-y-2">
            {books.map(book => (
              <div key={book.id} className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-slate-100 group hover:shadow-card transition-all">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <Book className="w-4.5 h-4.5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-ink">{book.title}</p>
                  {book.author  && <p className="text-xs text-ink-subtle mt-0.5">{book.author}</p>}
                  {book.edition && <p className="text-xs text-ink-ghost">{book.edition} edition</p>}
                  {book.isbn    && <p className="text-xs text-ink-ghost font-mono">ISBN: {book.isbn}</p>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {book.url && (
                    <a href={book.url} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm gap-1">
                      <ExternalLink className="w-3 h-3" /> View
                    </a>
                  )}
                  {canEdit && (
                    <button onClick={() => deleteBook(playlistId, book.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
