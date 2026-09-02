import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import {
  Settings,
  ArrowLeft,
  Download,
  Upload,
  Trash2,
  Key,
  Youtube,
  Plus,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Image as ImageIcon,
  Heart,
  Users,
  Award,
  Loader2,
  UserPlus,
  ShieldCheck,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Pencil,
  X,
  Tv,
  ListPlus,
  Sparkles,
  PlaySquare,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useAdminData } from '@/context/AdminDataContext'
import ImageCropperModal from '@/components/ui/ImageCropperModal'
import * as storage from '@/services/storage'
import * as cloudflare from '@/services/cloudflare'
import clsx from 'clsx'

import { DEFAULT_ABOUT } from '@/pages/About'
import { DEFAULT_SITE_SETTINGS } from '@/data/siteSettings'

export const DEFAULT_HOME = {
  heroTitle: 'Knowledge Unlocked',
  heroSubtitle: 'Free lecture videos and course materials from Zewail City of Science and Technology — open to every learner.',
  featuredVideoUrl: 'https://youtu.be/Kr1P4Awv2lE',
  featuredVideoBadge: 'Featured Spotlight',
  featuredVideoTitle: 'What is ZC OCW?',
  featuredVideoDescription: 'Learn how Zewail City students and faculty came together to build an open educational platform carrying the knowledge of remarkable professors and researchers far beyond the classroom.',
}

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
    deleteCustomProgram,
    acknowledgmentsConfig,
    updateAcknowledgmentsConfig,
    uploadAcknowledgmentImage,
    saveCourseData,
    getCourseData,
  } = useAdminData()

  const [exported, setExported] = useState(false)
  const [imported, setImported] = useState(false)
  const [cleared,  setCleared]  = useState(false)

  // 🖼️ Slide form state & editing
  const [slideForm, setSlideForm] = useState({ url: '', title: '', caption: '' })
  const [editingSlideId, setEditingSlideId] = useState(null)
  const [ackSaved, setAckSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  // 📝 Header form state
  const [headerForm, setHeaderForm] = useState(() => ({
    headerTitle: acknowledgmentsConfig?.headerTitle || '',
    headerSubtitle: acknowledgmentsConfig?.headerSubtitle || '',
  }))
  const [headerSaved, setHeaderSaved] = useState(false)

  useEffect(() => {
    if (acknowledgmentsConfig) {
      setHeaderForm({
        headerTitle: acknowledgmentsConfig.headerTitle || '',
        headerSubtitle: acknowledgmentsConfig.headerSubtitle || '',
      })
    }
  }, [acknowledgmentsConfig])

  // 👥 Team member form state & editing
  const [teamForm, setTeamForm] = useState({ name: '', role: '', school: '', photoUrl: '' })
  const [editingTeamId, setEditingTeamId] = useState(null)
  const [teamSaved, setTeamSaved] = useState(false)
  const [uploadingTeamPhoto, setUploadingTeamPhoto] = useState(false)
  const [teamPhotoError, setTeamPhotoError] = useState('')
  const [cropImageSrc, setCropImageSrc] = useState(null)

  // Drag & drop state for team members
  const [draggedTeamIdx, setDraggedTeamIdx] = useState(null)
  const [dragOverTeamIdx, setDragOverTeamIdx] = useState(null)

  function handleTeamPhotoFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setTeamPhotoError('')
    const reader = new FileReader()
    reader.onload = (ev) => {
      setCropImageSrc(ev.target.result)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  async function handleCroppedUpload(croppedBlob) {
    setUploadingTeamPhoto(true)
    setTeamPhotoError('')
    try {
      const file = new File([croppedBlob], `avatar_${Date.now()}.png`, { type: 'image/png' })
      const publicUrl = await uploadAcknowledgmentImage(file)
      if (publicUrl) {
        setTeamForm((f) => ({ ...f, photoUrl: publicUrl }))
        setCropImageSrc(null)
      } else {
        throw new Error('Upload did not return a valid public URL')
      }
    } catch (err) {
      setTeamPhotoError(err.message || 'Photo upload failed')
    } finally {
      setUploadingTeamPhoto(false)
    }
  }

  // 🏆 Sponsor form state
  const [sponsorForm, setSponsorForm] = useState({ name: '', contribution: '' })
  const [sponsorSaved, setSponsorSaved] = useState(false)

  // 📺 Quick Category Assignment Tool state
  const [assignPlaylistInput, setAssignPlaylistInput] = useState('')
  const [assignCategory, setAssignCategory] = useState('interviews')
  const [assignSaved, setAssignSaved] = useState(false)

  function handleAssignPlaylistCategory(e) {
    e.preventDefault()
    let raw = assignPlaylistInput.trim()
    if (!raw) return
    let pid = raw
    if (raw.includes('list=')) {
      const match = raw.match(/list=([a-zA-Z0-9_-]+)/)
      if (match) pid = match[1]
    } else if (raw.includes('youtu.be/') || raw.includes('watch?v=')) {
      const match = raw.match(/(?:youtu\.be\/|watch\?v=)([a-zA-Z0-9_-]+)/)
      if (match) pid = match[1]
    }
    const currentData = getCourseData(pid)
    saveCourseData(pid, {
      ...currentData,
      category: assignCategory,
    })
    setAssignSaved(true)
    setAssignPlaylistInput('')
    setTimeout(() => setAssignSaved(false), 3500)
  }

  // 🛡️ Admin team management
  const [admins, setAdmins] = useState([])
  const [adminsLoading, setAdminsLoading] = useState(true)
  const [adminsError, setAdminsError] = useState('')
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newAdminRole, setNewAdminRole] = useState('moderator')
  const [grantingAdmin, setGrantingAdmin] = useState(false)

  // 📝 CMS Page Content Manager state
  const [cmsPage, setCmsPage] = useState('site_settings')
  const [cmsSaved, setCmsSaved] = useState(false)
  const [siteSettingsForm, setSiteSettingsForm] = useState(() => storage.get('page_content_site_settings', DEFAULT_SITE_SETTINGS))
  const [aboutForm, setAboutForm] = useState(() => storage.get('page_content_about', DEFAULT_ABOUT))
  const [homeForm, setHomeForm] = useState(() => storage.get('page_content_home', DEFAULT_HOME))

  async function handleSaveCms(e) {
    e.preventDefault()
    try {
      const dataToSave = cmsPage === 'about' ? aboutForm : cmsPage === 'home' ? homeForm : siteSettingsForm
      // Persist locally first
      storage.set(`page_content_${cmsPage}`, dataToSave)
      // Persist to Cloudflare Worker D1
      if (cloudflare.isConfigured) {
        await cloudflare.upsertPageContent(cmsPage, dataToSave)
      }
      setCmsSaved(true)
      setTimeout(() => setCmsSaved(false), 3000)
    } catch (err) {
      alert('Failed to save page content: ' + err.message)
    }
  }

  // 🌌 Astronomy API Test State & Handler
  const [testingSky, setTestingSky] = useState(false)
  const [skyTestStatus, setSkyTestStatus] = useState(null)

  async function handleTestSkyApi() {
    setTestingSky(true)
    setSkyTestStatus(null)
    try {
      const data = await cloudflare.fetchSky()
      const rows = data?.bodies || data?.table?.rows || []
      const hasRealAstroData = rows.length > 0 || !!data?.table || !!data?.dates

      if (hasRealAstroData) {
        const bodyCount = rows.length || 11
        setSkyTestStatus({
          success: true,
          message: `✓ Connected to Astronomy API! Retrieved live ephemeris positions for ${bodyCount} solar system bodies.`,
        })
      } else {
        setSkyTestStatus({
          success: false,
          message: `Worker responded, but Astronomy API credentials may be unconfigured or expired.`,
        })
      }
    } catch (err) {
      setSkyTestStatus({
        success: false,
        message: `Connection failed: ${err.message}`,
      })
    } finally {
      setTestingSky(false)
    }
  }

  // Load admins on mount
  useEffect(() => {
    let unmounted = false
    async function loadAdmins() {
      setAdminsLoading(true)
      setAdminsError('')
      try {
        const list = await cloudflare.fetchAdmins()
        if (!unmounted) setAdmins(list || [])
      } catch (e) {
        if (!unmounted) setAdminsError(e.message || 'Failed to load admin team')
      } finally {
        if (!unmounted) setAdminsLoading(false)
      }
    }
    loadAdmins()
    return () => { unmounted = true }
  }, [])

  async function handleGrantAdmin(e) {
    e.preventDefault()
    if (!newAdminEmail.trim()) return
    setGrantingAdmin(true)
    setAdminsError('')
    try {
      await cloudflare.grantAdmin(newAdminEmail.trim(), newAdminRole)
      const list = await cloudflare.fetchAdmins()
      setAdmins(list || [])
      setNewAdminEmail('')
    } catch (e) {
      setAdminsError(e.message || 'Failed to grant access')
    } finally {
      setGrantingAdmin(false)
    }
  }

  async function handleUpdateRole(email, newRole) {
    try {
      await cloudflare.updateAdminRole(email, newRole)
      const list = await cloudflare.fetchAdmins()
      setAdmins(list || [])
    } catch (e) {
      setAdminsError(e.message || 'Failed to update role')
    }
  }

  async function handleRevokeAdmin(email) {
    if (!confirm(`Revoke access for ${email}?`)) return
    try {
      await cloudflare.revokeAdmin(email)
      const list = await cloudflare.fetchAdmins()
      setAdmins(list || [])
    } catch (e) {
      setAdminsError(e.message || 'Failed to revoke access')
    }
  }

  // Custom School Form State
  const [schoolForm, setSchoolForm] = useState({
    id: '',
    label: '',
    short: '',
    icon: '🏛️',
    description: '',
    colorBg: 'bg-blue-600',
    colorLight: 'bg-blue-50',
    colorText: 'text-blue-700',
    colorBorder: 'border-blue-200',
  })
  const [schoolSaved, setSchoolSaved] = useState(false)

  // Custom Program Form State
  const [programForm, setProgramForm] = useState({
    schoolId: '',
    id: '',
    label: '',
    prefixes: '',
  })
  const [programSaved, setProgramSaved] = useState(false)

  function handleAddSchool(e) {
    e.preventDefault()
    if (!schoolForm.id || !schoolForm.label) {
      alert('Please fill out School ID and Label.')
      return
    }
    const cleanId = schoolForm.id.toLowerCase().replace(/[^a-z0-9_]/g, '_')
    addCustomSchool({
      id: cleanId,
      label: schoolForm.label,
      short: schoolForm.short || cleanId.toUpperCase(),
      icon: schoolForm.icon || '🏛️',
      description: schoolForm.description,
      color: {
        bg: schoolForm.colorBg,
        light: schoolForm.colorLight,
        text: schoolForm.colorText,
        border: schoolForm.colorBorder,
      },
    })
    setSchoolForm({
      id: '',
      label: '',
      short: '',
      icon: '🏛️',
      description: '',
      colorBg: 'bg-blue-600',
      colorLight: 'bg-blue-50',
      colorText: 'text-blue-700',
      colorBorder: 'border-blue-200',
    })
    setSchoolSaved(true)
    setTimeout(() => setSchoolSaved(false), 3000)
  }

  function handleAddProgram(e) {
    e.preventDefault()
    if (!programForm.schoolId || !programForm.id || !programForm.label) {
      alert('Please select a school, and provide program ID and Label.')
      return
    }
    const cleanId = programForm.id.toLowerCase().replace(/[^a-z0-9_]/g, '_')
    const prefixArray = programForm.prefixes
      .split(',')
      .map((p) => p.trim().toUpperCase())
      .filter(Boolean)

    addCustomProgram(programForm.schoolId, {
      id: cleanId,
      label: programForm.label,
      prefixes: prefixArray,
    })
    setProgramForm({
      schoolId: programForm.schoolId,
      id: '',
      label: '',
      prefixes: '',
    })
    setProgramSaved(true)
    setTimeout(() => setProgramSaved(false), 3000)
  }

  // Slide Handlers
  async function handleSlideFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError('')
    try {
      const publicUrl = await uploadAcknowledgmentImage(file)
      if (publicUrl) {
        setSlideForm((f) => ({ ...f, url: publicUrl }))
      } else {
        throw new Error('Upload did not return a valid public URL')
      }
    } catch (err) {
      setUploadError(err.message || 'Image upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  function handleStartEditSlide(s) {
    setEditingSlideId(s.id)
    setSlideForm({
      url: s.url || '',
      title: s.title || '',
      caption: s.caption || '',
    })
    document.getElementById('slide-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleCancelEditSlide() {
    setEditingSlideId(null)
    setSlideForm({ url: '', title: '', caption: '' })
  }

  function handleSaveSlide(e) {
    e.preventDefault()
    if (!slideForm.url || !slideForm.title) {
      alert('Please fill out Image URL and Title.')
      return
    }
    const currentSlides = acknowledgmentsConfig?.slides || []
    let nextSlides = []
    if (editingSlideId) {
      nextSlides = currentSlides.map((s) =>
        s.id === editingSlideId
          ? { ...s, url: slideForm.url.trim(), title: slideForm.title.trim(), caption: slideForm.caption.trim() || undefined }
          : s
      )
      setEditingSlideId(null)
    } else {
      const newSlide = {
        id: `slide_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        url: slideForm.url.trim(),
        title: slideForm.title.trim(),
        caption: slideForm.caption.trim() || undefined,
      }
      nextSlides = [...currentSlides, newSlide]
    }
    updateAcknowledgmentsConfig({
      ...acknowledgmentsConfig,
      slides: nextSlides,
    })
    setSlideForm({ url: '', title: '', caption: '' })
    setAckSaved(true)
    setTimeout(() => setAckSaved(false), 3000)
  }

  function handleDeleteSlide(id) {
    updateAcknowledgmentsConfig({
      ...acknowledgmentsConfig,
      slides: (acknowledgmentsConfig?.slides || []).filter((s) => s.id !== id),
    })
  }

  function handleMoveSlide(fromIndex, toIndex) {
    const currentSlides = [...(acknowledgmentsConfig?.slides || [])]
    if (toIndex < 0 || toIndex >= currentSlides.length || fromIndex === toIndex) return
    const [moved] = currentSlides.splice(fromIndex, 1)
    currentSlides.splice(toIndex, 0, moved)
    updateAcknowledgmentsConfig({ ...acknowledgmentsConfig, slides: currentSlides })
  }

  function handleSaveHeader(e) {
    e.preventDefault()
    updateAcknowledgmentsConfig({
      ...acknowledgmentsConfig,
      headerTitle: headerForm.headerTitle,
      headerSubtitle: headerForm.headerSubtitle,
    })
    setHeaderSaved(true)
    setTimeout(() => setHeaderSaved(false), 3000)
  }

  // 👥 Team Handlers (Reorder & In-place Edit)
  function handleStartEditTeamMember(m) {
    setEditingTeamId(m.id)
    setTeamForm({
      name: m.name || '',
      role: m.role || '',
      school: m.school || '',
      photoUrl: m.photoUrl || '',
    })
    document.getElementById('team-member-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleCancelEditTeamMember() {
    setEditingTeamId(null)
    setTeamForm({ name: '', role: '', school: '', photoUrl: '' })
  }

  function handleSaveTeamMember(e) {
    e.preventDefault()
    if (!teamForm.name || !teamForm.role) {
      alert('Please fill out at least Name and Role.')
      return
    }
    const currentTeam = acknowledgmentsConfig?.team || []
    let nextTeam = []
    if (editingTeamId) {
      // Edit in-place — preserving position and ID
      nextTeam = currentTeam.map((m) =>
        m.id === editingTeamId
          ? {
              ...m,
              name: teamForm.name.trim(),
              role: teamForm.role.trim(),
              school: teamForm.school.trim() || undefined,
              photoUrl: teamForm.photoUrl.trim() || undefined,
            }
          : m
      )
      setEditingTeamId(null)
    } else {
      const newMember = {
        id: `team_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: teamForm.name.trim(),
        role: teamForm.role.trim(),
        school: teamForm.school.trim() || undefined,
        photoUrl: teamForm.photoUrl.trim() || undefined,
      }
      nextTeam = [...currentTeam, newMember]
    }
    updateAcknowledgmentsConfig({
      ...acknowledgmentsConfig,
      team: nextTeam,
    })
    setTeamForm({ name: '', role: '', school: '', photoUrl: '' })
    setTeamSaved(true)
    setTimeout(() => setTeamSaved(false), 3000)
  }

  function handleDeleteTeamMember(id) {
    if (editingTeamId === id) {
      setEditingTeamId(null)
      setTeamForm({ name: '', role: '', school: '', photoUrl: '' })
    }
    updateAcknowledgmentsConfig({
      ...acknowledgmentsConfig,
      team: (acknowledgmentsConfig?.team || []).filter((m) => m.id !== id),
    })
  }

  function handleMoveTeamMember(fromIndex, toIndex) {
    const currentTeam = [...(acknowledgmentsConfig?.team || [])]
    if (toIndex < 0 || toIndex >= currentTeam.length || fromIndex === toIndex) return
    const [moved] = currentTeam.splice(fromIndex, 1)
    currentTeam.splice(toIndex, 0, moved)
    updateAcknowledgmentsConfig({ ...acknowledgmentsConfig, team: currentTeam })
  }

  function handleTeamDragStart(e, index) {
    setDraggedTeamIdx(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
  }

  function handleTeamDragOver(e, index) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverTeamIdx !== index) {
      setDragOverTeamIdx(index)
    }
  }

  function handleTeamDrop(e, targetIndex) {
    e.preventDefault()
    if (draggedTeamIdx === null || draggedTeamIdx === targetIndex) {
      setDraggedTeamIdx(null)
      setDragOverTeamIdx(null)
      return
    }
    handleMoveTeamMember(draggedTeamIdx, targetIndex)
    setDraggedTeamIdx(null)
    setDragOverTeamIdx(null)
  }

  // Sponsor Handlers
  function handleAddSponsor(e) {
    e.preventDefault()
    if (!sponsorForm.name) {
      alert('Please fill out at least Name.')
      return
    }
    const newSponsor = {
      id: `sponsor_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...sponsorForm,
    }
    updateAcknowledgmentsConfig({
      ...acknowledgmentsConfig,
      sponsors: [...(acknowledgmentsConfig?.sponsors || []), newSponsor],
    })
    setSponsorForm({ name: '', contribution: '' })
    setSponsorSaved(true)
    setTimeout(() => setSponsorSaved(false), 3000)
  }

  function handleDeleteSponsor(id) {
    updateAcknowledgmentsConfig({
      ...acknowledgmentsConfig,
      sponsors: (acknowledgmentsConfig?.sponsors || []).filter((s) => s.id !== id),
    })
  }

  function handleExport() {
    storage.downloadBackup()
    setExported(true)
    setTimeout(() => setExported(false), 3000)
  }

  function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const ok = storage.restoreBackup(ev.target.result)
      if (ok) {
        setImported(true)
        setTimeout(() => window.location.reload(), 800)
      } else {
        alert('Invalid backup file.')
      }
    }
    reader.readAsText(file)
  }

  function handleClearAll() {
    if (confirm('Are you sure? This will delete ALL local overrides, custom schools, materials, and books.')) {
      storage.clear()
      setCleared(true)
      setTimeout(() => window.location.reload(), 800)
    }
  }

  const currentTeamList = acknowledgmentsConfig?.team || []
  const currentSlidesList = acknowledgmentsConfig?.slides || []

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

        {/* 🎙️ Quick Playlist Category Manager (Add to Interviews / Special) */}
        <div className="card-flat border border-slate-100 dark:border-white/10 shadow-card bg-gradient-to-br from-slate-50 to-cyan-50/30 dark:from-night-200/90 dark:to-cyan-950/20">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200/80 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 flex items-center justify-center">
                <PlaySquare className="w-4.5 h-4.5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-ink dark:text-white">Playlist Section & Category Manager</h2>
                <p className="text-xs text-ink-ghost dark:text-slate-400">Quickly assign any YouTube playlist to Interviews, Public Lectures, or Courses.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleAssignPlaylistCategory} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-7">
                <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">
                  Playlist URL or Playlist ID
                </label>
                <input
                  value={assignPlaylistInput}
                  onChange={(e) => setAssignPlaylistInput(e.target.value)}
                  placeholder="https://youtube.com/playlist?list=PL... or PL..."
                  className="input text-xs"
                  required
                />
              </div>

              <div className="md:col-span-5">
                <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">
                  Target Category
                </label>
                <select
                  value={assignCategory}
                  onChange={(e) => setAssignCategory(e.target.value)}
                  className="input text-xs font-semibold"
                >
                  <option value="interviews">🎙️ Interviews & Conversations</option>
                  <option value="public-lectures">🏛️ Public Lectures & Keynotes</option>
                  <option value="special">✨ Special Events & Workshops</option>
                  <option value="club">👥 Student Club Activities</option>
                  <option value="course">🎓 Standard Academic Course</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              {assignSaved ? (
                <span className="text-xs text-green-600 dark:text-green-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Category assigned! Appears immediately in {assignCategory === 'course' ? 'Courses' : 'Interviews'}.
                </span>
              ) : (
                <p className="text-[11px] text-ink-ghost dark:text-slate-400">
                  Tip: You can also fine-tune any course's category directly in the Course Editor.
                </p>
              )}
              <button type="submit" className="btn-primary text-xs gap-2 !py-2">
                <ListPlus className="w-3.5 h-3.5" /> Save Category
              </button>
            </div>
          </form>
        </div>

        {/* 🖼️ Acknowledgments & Image Carousel Manager */}
        <div id="slides-manager" className="card-flat border border-slate-100 dark:border-white/10 shadow-card">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 flex items-center justify-center">
                <ImageIcon className="w-4.5 h-4.5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-ink dark:text-white">Acknowledgments & Image Slides Manager</h2>
                <p className="text-xs text-ink-ghost dark:text-slate-400">Add, edit, or reorder image slides and captions for the Acknowledgments page.</p>
              </div>
            </div>
          </div>

          {/* Header text form */}
          <form onSubmit={handleSaveHeader} className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-night-200/60 border border-slate-200 dark:border-white/10 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-ink dark:text-white">Page Header</h3>
              {headerSaved && <span className="text-xs text-green-600 dark:text-green-400 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Saved!</span>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">Title</label>
              <input
                value={headerForm.headerTitle}
                onChange={e => setHeaderForm(f => ({ ...f, headerTitle: e.target.value }))}
                placeholder="Acknowledgments"
                className="input text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">Subtitle</label>
              <input
                value={headerForm.headerSubtitle}
                onChange={e => setHeaderForm(f => ({ ...f, headerSubtitle: e.target.value }))}
                placeholder="Built by students, for students."
                className="input text-xs"
              />
            </div>
            <button type="submit" className="btn-outline text-xs w-full">Save Header Text</button>
          </form>

          {/* Add / Edit Slide Form */}
          <form id="slide-form" onSubmit={handleSaveSlide} className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-night-200/60 border border-slate-200 dark:border-white/10 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-ink dark:text-white flex items-center gap-2">
                {editingSlideId ? (
                  <>
                    <Pencil className="w-4 h-4 text-amber-500" />
                    <span>Editing Slide</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-cyan-500" />
                    <span>Add New Image Slide</span>
                  </>
                )}
              </h3>
              <div className="flex items-center gap-2">
                {editingSlideId && (
                  <button
                    type="button"
                    onClick={handleCancelEditSlide}
                    className="btn-ghost text-xs !py-1 text-slate-500 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Cancel Edit
                  </button>
                )}
                {ackSaved && (
                  <span className="text-xs text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Slide Saved!
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">Image URL / Path</label>
              <input
                value={slideForm.url}
                onChange={e => setSlideForm(f => ({ ...f, url: e.target.value }))}
                placeholder="/acknowledgments-hero.jpg or https://..."
                className="input text-xs"
                required
              />
              <div className="flex items-center gap-3 mt-2">
                <label className="btn-outline text-xs cursor-pointer gap-2 !py-1.5">
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {uploading ? 'Uploading…' : 'Upload image instead'}
                  <input type="file" accept="image/*" onChange={handleSlideFileChange} disabled={uploading} className="hidden" />
                </label>
                {slideForm.url && (
                  <img src={slideForm.url} alt="" className="h-8 w-14 object-cover rounded-md border border-slate-200 dark:border-white/10" />
                )}
              </div>
              {uploadError && <p className="text-[11px] text-red-500 mt-1">{uploadError}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">Slide Title</label>
                <input
                  value={slideForm.title}
                  onChange={e => setSlideForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Campus Research Labs"
                  className="input text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">Caption / Description</label>
                <input
                  value={slideForm.caption}
                  onChange={e => setSlideForm(f => ({ ...f, caption: e.target.value }))}
                  placeholder="Empowering open education across Egypt..."
                  className="input text-xs"
                />
              </div>
            </div>

            <button type="submit" className="btn-primary text-xs w-full gap-2">
              {editingSlideId ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {editingSlideId ? 'Update Slide Changes' : 'Add Slide to Acknowledgments'}
            </button>
          </form>

          {/* Active Slides List with Reordering & In-Place Editing */}
          <div>
            <h3 className="font-semibold text-sm text-ink dark:text-white mb-3">Active Acknowledgments Image Slides ({currentSlidesList.length})</h3>
            {currentSlidesList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentSlidesList.map((s, idx) => (
                  <div
                    key={s.id || idx}
                    className={clsx(
                      "relative rounded-2xl border overflow-hidden bg-slate-50 dark:bg-night-200/80 transition-all",
                      editingSlideId === s.id
                        ? "border-amber-400 ring-2 ring-amber-400/30"
                        : "border-slate-200 dark:border-white/10"
                    )}
                  >
                    <div className="aspect-video w-full overflow-hidden bg-black relative">
                      <img src={s.url} alt={s.title} className="w-full h-full object-cover" />
                      
                      {/* Top Action Overlay */}
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => handleStartEditSlide(s)}
                          className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                          title="Edit Slide"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSlide(s.id)}
                          className="p-1 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/30 transition-colors"
                          title="Delete Slide"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Position Reorder Controls */}
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/65 backdrop-blur-md px-2 py-1 rounded-lg text-white text-[11px]">
                        <span className="font-mono text-white/70">#{idx + 1}</span>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveSlide(idx, idx - 1)}
                          className="p-0.5 hover:text-cyan-400 disabled:opacity-30"
                          title="Move Up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === currentSlidesList.length - 1}
                          onClick={() => handleMoveSlide(idx, idx + 1)}
                          className="p-0.5 hover:text-cyan-400 disabled:opacity-30"
                          title="Move Down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3">
                      <p className="font-bold text-xs text-ink dark:text-white truncate">{s.title}</p>
                      <p className="text-[11px] text-ink-ghost dark:text-slate-400 line-clamp-2 mt-0.5">{s.caption || 'No caption provided'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-ink-ghost">No image slides registered yet.</p>
            )}
          </div>
        </div>

        {/* 👥 Team members manager with Drag & Drop and Profile Modification */}
        <div id="team-members-manager" className="card-flat border border-slate-100 dark:border-white/10 shadow-card">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 flex items-center justify-center">
                <Users className="w-4.5 h-4.5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-ink dark:text-white">Team & Contributors</h2>
                <p className="text-xs text-ink-ghost dark:text-slate-400">
                  Edit profiles, modify roles, or drag cards to reorder them in custom positions.
                </p>
              </div>
            </div>
            <span className="badge text-xs bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 font-semibold">
              {currentTeamList.length} Members
            </span>
          </div>

          {/* Add / Edit Team Member Form */}
          <form id="team-member-form" onSubmit={handleSaveTeamMember} className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-night-200/60 border border-slate-200 dark:border-white/10 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-ink dark:text-white flex items-center gap-2">
                {editingTeamId ? (
                  <>
                    <Pencil className="w-4 h-4 text-amber-500" />
                    <span>Modifying Member Profile</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-cyan-500" />
                    <span>Add Team Member</span>
                  </>
                )}
              </h3>
              <div className="flex items-center gap-2">
                {editingTeamId && (
                  <button
                    type="button"
                    onClick={handleCancelEditTeamMember}
                    className="btn-ghost text-xs !py-1 text-slate-500 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Cancel Edit
                  </button>
                )}
                {teamSaved && (
                  <span className="text-xs text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">Full Name</label>
                <input
                  value={teamForm.name}
                  onChange={e => setTeamForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Ahmed Nader"
                  className="input text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">Role / Contribution</label>
                <input
                  value={teamForm.role}
                  onChange={e => setTeamForm(f => ({ ...f, role: e.target.value }))}
                  placeholder="e.g. Project Lead & Recording"
                  className="input text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">School / Major (optional)</label>
                <input
                  value={teamForm.school}
                  onChange={e => setTeamForm(f => ({ ...f, school: e.target.value }))}
                  placeholder="e.g. Communications & Info Eng."
                  className="input text-xs"
                />
              </div>
            </div>

            {/* Profile Photo Uploader */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-white/10 space-y-2">
              <label className="block text-xs font-semibold text-ink dark:text-slate-300">Profile Photo</label>
              <div className="flex items-center gap-3">
                {teamForm.photoUrl ? (
                  <img src={teamForm.photoUrl} alt="Preview" className="w-10 h-10 rounded-full object-cover border-2 border-cyan-400" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-xs font-bold text-ink-ghost">
                    No Photo
                  </div>
                )}
                <div className="flex-1 flex gap-2">
                  <input
                    value={teamForm.photoUrl}
                    onChange={e => setTeamForm(f => ({ ...f, photoUrl: e.target.value }))}
                    placeholder="https://... or upload photo"
                    className="input text-xs flex-1"
                  />
                  <label className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                    {uploadingTeamPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 text-cyan-500" />}
                    <span>{uploadingTeamPhoto ? 'Uploading...' : 'Upload Photo'}</span>
                    <input type="file" accept="image/*" onChange={handleTeamPhotoFileChange} disabled={uploadingTeamPhoto} className="hidden" />
                  </label>
                </div>
              </div>
              {teamPhotoError && <p className="text-[11px] text-red-500">{teamPhotoError}</p>}
            </div>

            <button type="submit" className="btn-primary text-xs w-full gap-2">
              {editingTeamId ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {editingTeamId ? 'Save Changes to Profile' : 'Add Team Member'}
            </button>
          </form>

          {/* Team Members List with Drag & Drop & Move Controls */}
          {currentTeamList.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[11px] text-ink-ghost dark:text-slate-400 mb-2 flex items-center gap-1.5">
                <GripVertical className="w-3.5 h-3.5 text-cyan-500" />
                Drag any member by the handle to reorder, or use the quick move buttons.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentTeamList.map((m, idx) => (
                  <div
                    key={m.id || idx}
                    draggable
                    onDragStart={(e) => handleTeamDragStart(e, idx)}
                    onDragOver={(e) => handleTeamDragOver(e, idx)}
                    onDrop={(e) => handleTeamDrop(e, idx)}
                    className={clsx(
                      "flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 select-none group",
                      editingTeamId === m.id
                        ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-400 ring-2 ring-amber-400/30"
                        : dragOverTeamIdx === idx
                        ? "bg-cyan-50 dark:bg-cyan-950/30 border-cyan-400 scale-[1.01]"
                        : "bg-slate-50 dark:bg-night-200/60 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                    )}
                  >
                    {/* Left: Drag Handle + Avatar + Details */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-cyan-500 touch-none flex-shrink-0"
                        title="Drag to reorder"
                      >
                        <GripVertical className="w-4 h-4" />
                      </button>

                      {m.photoUrl ? (
                        <img src={m.photoUrl} alt={m.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-slate-200 dark:border-white/10" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {m.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-ink dark:text-white truncate">{m.name}</p>
                        <p className="text-[11px] text-ink-ghost dark:text-slate-400 truncate">
                          {m.role}{m.school ? ` · ${m.school}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Right: Quick Action Controls */}
                    <div className="flex items-center gap-1 flex-shrink-0 pl-2">
                      {/* Move to Top */}
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveTeamMember(idx, 0)}
                        className="p-1 rounded-lg text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-200/60 dark:hover:bg-white/10 disabled:opacity-20"
                        title="Move to Top"
                      >
                        <ChevronsUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Move Up */}
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveTeamMember(idx, idx - 1)}
                        className="p-1 rounded-lg text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-200/60 dark:hover:bg-white/10 disabled:opacity-20"
                        title="Move Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        disabled={idx === currentTeamList.length - 1}
                        onClick={() => handleMoveTeamMember(idx, idx + 1)}
                        className="p-1 rounded-lg text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-200/60 dark:hover:bg-white/10 disabled:opacity-20"
                        title="Move Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit Profile */}
                      <button
                        type="button"
                        onClick={() => handleStartEditTeamMember(m)}
                        className="p-1.5 rounded-lg text-ocean-600 dark:text-ocean-400 hover:bg-ocean-50 dark:hover:bg-ocean-950/40"
                        title="Modify Profile"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => handleDeleteTeamMember(m.id)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-ink-ghost">No team members yet.</p>
          )}
        </div>

        {/* Sponsors manager */}
        <div className="card-flat border border-slate-100 dark:border-white/10 shadow-card">
          <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-100 dark:border-white/10">
            <div className="w-9 h-9 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 flex items-center justify-center">
              <Award className="w-4.5 h-4.5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-ink dark:text-white">Clubs, Initiatives & Sponsors</h2>
              <p className="text-xs text-ink-ghost dark:text-slate-400">Shown as cards on the Acknowledgments page.</p>
            </div>
          </div>

          <form onSubmit={handleAddSponsor} className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-night-200/60 border border-slate-200 dark:border-white/10 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-ink dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-500" /> Add Sponsor
              </h3>
              {sponsorSaved && <span className="text-xs text-green-600 dark:text-green-400 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Saved!</span>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">Name</label>
                <input value={sponsorForm.name} onChange={e => setSponsorForm(f => ({ ...f, name: e.target.value }))} className="input text-xs" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">Contribution</label>
                <input value={sponsorForm.contribution} onChange={e => setSponsorForm(f => ({ ...f, contribution: e.target.value }))} placeholder="Facility & Equipment" className="input text-xs" />
              </div>
            </div>
            <button type="submit" className="btn-primary text-xs w-full gap-2"><Plus className="w-3.5 h-3.5" /> Add Sponsor</button>
          </form>

          {acknowledgmentsConfig?.sponsors?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {acknowledgmentsConfig.sponsors.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-night-200/60 border border-slate-200 dark:border-white/10">
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-ink dark:text-white truncate">{s.name}</p>
                    <p className="text-[11px] text-ink-ghost dark:text-slate-400 truncate">{s.contribution}</p>
                  </div>
                  <button type="button" onClick={() => handleDeleteSponsor(s.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 flex-shrink-0" title="Remove">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-ink-ghost">No sponsors yet.</p>
          )}
        </div>

        {/* 🛡️ Admin team management */}
        <div className="card-flat border border-slate-100 dark:border-white/10 shadow-card">
          <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-100 dark:border-white/10">
            <div className="w-9 h-9 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 flex items-center justify-center">
              <ShieldCheck className="w-4.5 h-4.5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-ink dark:text-white">Admin Team</h2>
              <p className="text-xs text-ink-ghost dark:text-slate-400">
                Who can access /admin. People must sign in at least once (Google or email) before you can add them.
              </p>
            </div>
          </div>

          <form onSubmit={handleGrantAdmin} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-night-200/60 border border-slate-200 dark:border-white/10 mb-6">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">Email address</label>
              <input
                type="email"
                value={newAdminEmail}
                onChange={e => setNewAdminEmail(e.target.value)}
                placeholder="teammate@example.com"
                className="input text-xs"
                required
              />
            </div>
            <div className="w-full sm:w-36">
              <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">Role</label>
              <select
                value={newAdminRole}
                onChange={e => setNewAdminRole(e.target.value)}
                className="input text-xs"
              >
                <option value="moderator">Moderator</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <button type="submit" disabled={grantingAdmin} className="btn-primary text-xs gap-2 !py-2.5 flex-shrink-0">
              {grantingAdmin ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
              Grant Access
            </button>
          </form>

          {adminsError && <p className="text-xs text-red-500 mb-4">{adminsError}</p>}

          {adminsLoading ? (
            <p className="text-xs text-ink-ghost flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading team…</p>
          ) : admins.length > 0 ? (
            <div className="space-y-2">
              {admins.map((a) => (
                <div key={a.email} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-night-200/60 border border-slate-200 dark:border-white/10">
                  <div className="min-w-0 flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-xs text-ink dark:text-white truncate">{a.email}</p>
                        <span className={clsx(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          a.role === 'admin'
                            ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-400/30"
                            : "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-400/30"
                        )}>
                          {a.role === 'admin' ? 'Admin' : 'Moderator'}
                        </span>
                      </div>
                      {a.added_at && (
                        <p className="text-[11px] text-ink-ghost dark:text-slate-400">
                          Added {new Date(a.added_at).toLocaleDateString()} {a.added_by ? `by ${a.added_by}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={a.role || 'moderator'}
                      onChange={(e) => handleUpdateRole(a.email, e.target.value)}
                      className="text-[11px] px-2 py-1 rounded-lg bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 text-ink dark:text-white focus:outline-none"
                      title="Change member role"
                    >
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button type="button" onClick={() => handleRevokeAdmin(a.email)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 flex-shrink-0" title="Revoke access">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-ink-ghost">
              No staff granted via this panel yet — your super-admin email (set as a Worker secret) always has access regardless of what's listed here.
            </p>
          )}
        </div>

        {/* 🎓 Custom Schools & Majors Catalog Management */}
        <div className="card-flat border border-slate-100 dark:border-white/10 shadow-card">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-ocean-100 flex items-center justify-center">
                <GraduationCap className="w-4.5 h-4.5 text-ocean-600" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-ink dark:text-white">Schools & Majors Catalog Manager</h2>
                <p className="text-xs text-ink-ghost">Add new university schools or majors dynamically without modifying code.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Add School Form */}
            <form onSubmit={handleAddSchool} className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-night-200/60 border border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-ink dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-ocean-500" /> Add New School
                </h3>
                {schoolSaved && <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Added!</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink dark:text-white mb-1">School ID (slug)</label>
                <input
                  value={schoolForm.id}
                  onChange={e => setSchoolForm(f => ({ ...f, id: e.target.value }))}
                  placeholder="biotech"
                  className="input text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink dark:text-white mb-1">School Full Name</label>
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
                  <label className="block text-xs font-semibold text-ink dark:text-white mb-1">Short Code</label>
                  <input
                    value={schoolForm.short}
                    onChange={e => setSchoolForm(f => ({ ...f, short: e.target.value }))}
                    placeholder="BIOT"
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink dark:text-white mb-1">Icon Emoji</label>
                  <input
                    value={schoolForm.icon}
                    onChange={e => setSchoolForm(f => ({ ...f, icon: e.target.value }))}
                    placeholder="🧬"
                    className="input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink dark:text-white mb-1">Description</label>
                <input
                  value={schoolForm.description}
                  onChange={e => setSchoolForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Molecular biology, genomics, cellular science"
                  className="input text-xs"
                />
              </div>

              <button type="submit" className="btn-primary text-xs w-full gap-2">
                <Plus className="w-3.5 h-3.5" /> Save School
              </button>
            </form>

            {/* Add Major / Program Form */}
            <form onSubmit={handleAddProgram} className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-night-200/60 border border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-ink dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-ocean-500" /> Add Major / Program
                </h3>
                {programSaved && <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Added!</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink dark:text-white mb-1">Parent School</label>
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
                <label className="block text-xs font-semibold text-ink dark:text-white mb-1">Program ID (slug)</label>
                <input
                  value={programForm.id}
                  onChange={e => setProgramForm(f => ({ ...f, id: e.target.value }))}
                  placeholder="genomics"
                  className="input text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink dark:text-white mb-1">Program Label</label>
                <input
                  value={programForm.label}
                  onChange={e => setProgramForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="Genomics & Precision Medicine"
                  className="input text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink dark:text-white mb-1">Course Prefixes (comma-separated)</label>
                <input
                  value={programForm.prefixes}
                  onChange={e => setProgramForm(f => ({ ...f, prefixes: e.target.value }))}
                  placeholder="GENM, PMED, BIOT"
                  className="input text-xs"
                />
              </div>

              <button type="submit" className="btn-primary text-xs w-full gap-2">
                <Plus className="w-3.5 h-3.5" /> Save Major / Program
              </button>
            </form>
          </div>

          {/* Active Custom Schools List */}
          {customSchools.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/10">
              <h3 className="font-semibold text-sm text-ink dark:text-white mb-3">Custom Added Schools ({customSchools.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customSchools.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-night-200/60 border border-slate-200 dark:border-white/10">
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-ink dark:text-white truncate">{s.icon} {s.label} ({s.short})</p>
                      <p className="text-[11px] text-ink-ghost dark:text-slate-400 truncate">{s.description || `ID: ${s.id}`}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteCustomSchool(s.id)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 flex-shrink-0"
                      title="Delete School"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Custom Programs List */}
          {Object.entries(customPrograms).some(([, list]) => list?.length > 0) && (
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/10">
              <h3 className="font-semibold text-sm text-ink dark:text-white mb-3">Custom Added Majors / Programs</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(customPrograms).flatMap(([schoolId, list]) =>
                  (list || []).map(p => (
                    <div key={`${schoolId}_${p.id}`} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-night-200/60 border border-slate-200 dark:border-white/10">
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-ink dark:text-white truncate">{p.label}</p>
                        <p className="text-[11px] text-ink-ghost dark:text-slate-400 truncate">
                          School: <span className="font-mono">{schoolId}</span> · Prefixes: {p.prefixes?.join(', ') || 'None'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteCustomProgram(schoolId, p.id)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 flex-shrink-0"
                        title="Delete Program"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 📝 CMS Page Content Manager (About & Home) */}
        <div className="card-flat border border-slate-100 dark:border-white/10 shadow-card">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center">
                <BookOpen className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-ink dark:text-white">Page Content Manager (CMS)</h2>
                <p className="text-xs text-ink-ghost dark:text-slate-400">Edit titles, narratives, and featured media for the About and Home pages.</p>
              </div>
            </div>

            {/* Page tab switcher */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-night-200 border border-slate-200 dark:border-white/10 overflow-x-auto">
              <button
                type="button"
                onClick={() => setCmsPage('site_settings')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  cmsPage === 'site_settings'
                    ? 'bg-white dark:bg-white/10 text-ocean-600 dark:text-white shadow-sm'
                    : 'text-ink-ghost dark:text-slate-400 hover:text-ink dark:hover:text-white'
                }`}
              >
                Navigation & Social
              </button>
              <button
                type="button"
                onClick={() => setCmsPage('home')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  cmsPage === 'home'
                    ? 'bg-white dark:bg-white/10 text-ocean-600 dark:text-white shadow-sm'
                    : 'text-ink-ghost dark:text-slate-400 hover:text-ink dark:hover:text-white'
                }`}
              >
                Home Page
              </button>
              <button
                type="button"
                onClick={() => setCmsPage('about')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  cmsPage === 'about'
                    ? 'bg-white dark:bg-white/10 text-ocean-600 dark:text-white shadow-sm'
                    : 'text-ink-ghost dark:text-slate-400 hover:text-ink dark:hover:text-white'
                }`}
              >
                About Page
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveCms} className="space-y-4">
            {cmsSaved && (
              <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Page content saved successfully! Changes are live across the website.</span>
              </div>
            )}

                        {cmsPage === 'site_settings' && (
              <div className="space-y-6">
                {/* Navigation Tab Labels */}
                <div>
                  <h3 className="font-semibold text-xs text-ocean-700 dark:text-ocean-300 uppercase tracking-wider mb-3">
                    Navbar Tab Names
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">Courses Tab Label</label>
                      <input
                        value={siteSettingsForm.navCourses || ''}
                        onChange={(e) => setSiteSettingsForm((f) => ({ ...f, navCourses: e.target.value }))}
                        placeholder="Courses"
                        className="input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">Interviews Tab Label</label>
                      <input
                        value={siteSettingsForm.navInterviews || ''}
                        onChange={(e) => setSiteSettingsForm((f) => ({ ...f, navInterviews: e.target.value }))}
                        placeholder="Interviews"
                        className="input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">About Tab Label</label>
                      <input
                        value={siteSettingsForm.navAbout || ''}
                        onChange={(e) => setSiteSettingsForm((f) => ({ ...f, navAbout: e.target.value }))}
                        placeholder="About"
                        className="input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">Acknowledgements Tab Label</label>
                      <input
                        value={siteSettingsForm.navAcknowledgments || ''}
                        onChange={(e) => setSiteSettingsForm((f) => ({ ...f, navAcknowledgments: e.target.value }))}
                        placeholder="Acknowledgements"
                        className="input text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Social & Contact Links */}
                <div className="pt-4 border-t border-slate-200/80 dark:border-white/10">
                  <h3 className="font-semibold text-xs text-ocean-700 dark:text-ocean-300 uppercase tracking-wider mb-3">
                    Social Media & Contact Links
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">Facebook Page URL</label>
                      <input
                        value={siteSettingsForm.facebookUrl || ''}
                        onChange={(e) => setSiteSettingsForm((f) => ({ ...f, facebookUrl: e.target.value }))}
                        placeholder="https://www.facebook.com/share/..."
                        className="input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">LinkedIn Page URL</label>
                      <input
                        value={siteSettingsForm.linkedinUrl || ''}
                        onChange={(e) => setSiteSettingsForm((f) => ({ ...f, linkedinUrl: e.target.value }))}
                        placeholder="https://www.linkedin.com/company/..."
                        className="input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">YouTube Channel URL</label>
                      <input
                        value={siteSettingsForm.youtubeUrl || ''}
                        onChange={(e) => setSiteSettingsForm((f) => ({ ...f, youtubeUrl: e.target.value }))}
                        placeholder="https://www.youtube.com/..."
                        className="input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">Support & Contact Email</label>
                      <input
                        value={siteSettingsForm.contactEmail || ''}
                        onChange={(e) => setSiteSettingsForm((f) => ({ ...f, contactEmail: e.target.value }))}
                        placeholder="zewailcityocw@gmail.com"
                        className="input text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Section Titles on Home */}
                <div className="pt-4 border-t border-slate-200/80 dark:border-white/10">
                  <h3 className="font-semibold text-xs text-ocean-700 dark:text-ocean-300 uppercase tracking-wider mb-3">
                    Home Page Section Headings
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">Featured Courses Heading</label>
                      <input
                        value={siteSettingsForm.featuredCoursesTitle || ''}
                        onChange={(e) => setSiteSettingsForm((f) => ({ ...f, featuredCoursesTitle: e.target.value }))}
                        placeholder="Latest Courses"
                        className="input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">Featured Courses Tagline</label>
                      <input
                        value={siteSettingsForm.featuredCoursesCategory || ''}
                        onChange={(e) => setSiteSettingsForm((f) => ({ ...f, featuredCoursesCategory: e.target.value }))}
                        placeholder="Open CourseWare"
                        className="input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">Departments Section Heading</label>
                      <input
                        value={siteSettingsForm.departmentsTitle || ''}
                        onChange={(e) => setSiteSettingsForm((f) => ({ ...f, departmentsTitle: e.target.value }))}
                        placeholder="Schools & Programs"
                        className="input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">Departments Tagline</label>
                      <input
                        value={siteSettingsForm.departmentsCategory || ''}
                        onChange={(e) => setSiteSettingsForm((f) => ({ ...f, departmentsCategory: e.target.value }))}
                        placeholder="Explore by field"
                        className="input text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {cmsPage === 'about' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">Header Title</label>
                  <input
                    value={aboutForm.headerTitle || ''}
                    onChange={(e) => setAboutForm((f) => ({ ...f, headerTitle: e.target.value }))}
                    className="input text-xs"
                    placeholder="About ZC OpenCourseWare"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">Header Subtitle</label>
                  <textarea
                    rows={2}
                    value={aboutForm.headerSubtitle || ''}
                    onChange={(e) => setAboutForm((f) => ({ ...f, headerSubtitle: e.target.value }))}
                    className="input text-xs"
                    placeholder="Knowledge becomes more powerful when it is shared..."
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-white/10 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">About / Story Section Title</label>
                    <input
                      value={aboutForm.aboutTitle || ''}
                      onChange={(e) => setAboutForm((f) => ({ ...f, aboutTitle: e.target.value }))}
                      className="input text-xs"
                      placeholder="About ZC-OCW"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">About / Story Statement Body</label>
                    <textarea
                      rows={5}
                      value={aboutForm.aboutBody || ''}
                      onChange={(e) => setAboutForm((f) => ({ ...f, aboutBody: e.target.value }))}
                      className="input text-xs leading-relaxed"
                      placeholder="Zewail City OpenCourseWare (ZC-OCW) was born from a simple belief..."
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-white/10 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">Mission Section Title</label>
                    <input
                      value={aboutForm.missionTitle || ''}
                      onChange={(e) => setAboutForm((f) => ({ ...f, missionTitle: e.target.value }))}
                      className="input text-xs"
                      placeholder="Our Mission"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">Mission Statement Body</label>
                    <textarea
                      rows={5}
                      value={aboutForm.missionBody || ''}
                      onChange={(e) => setAboutForm((f) => ({ ...f, missionBody: e.target.value }))}
                      className="input text-xs leading-relaxed"
                      placeholder="Our mission is bigger than recording lectures..."
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-white/10 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">License Section Title</label>
                    <input
                      value={aboutForm.licenseTitle || ''}
                      onChange={(e) => setAboutForm((f) => ({ ...f, licenseTitle: e.target.value }))}
                      className="input text-xs"
                      placeholder="License"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">License Statement Body</label>
                    <textarea
                      rows={2}
                      value={aboutForm.licenseBody || ''}
                      onChange={(e) => setAboutForm((f) => ({ ...f, licenseBody: e.target.value }))}
                      className="input text-xs leading-relaxed"
                      placeholder="All course materials on ZC OCW are shared under a Creative Commons BY-NC-SA 4.0 license..."
                    />
                  </div>
                </div>
              </>
            )}

            {cmsPage === 'home' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">Hero Title</label>
                  <input
                    value={homeForm.heroTitle || ''}
                    onChange={(e) => setHomeForm((f) => ({ ...f, heroTitle: e.target.value }))}
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">Hero Subtitle</label>
                  <textarea
                    rows={2}
                    value={homeForm.heroSubtitle || ''}
                    onChange={(e) => setHomeForm((f) => ({ ...f, heroSubtitle: e.target.value }))}
                    className="input text-xs"
                  />
                </div>

                <div className="pt-3 border-t border-slate-200/80 dark:border-white/10 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-500" />
                    <h3 className="font-semibold text-xs text-ink dark:text-white uppercase tracking-wider">
                      Featured Spotlight Video (Home Page)
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">
                        Featured Video URL
                      </label>
                      <input
                        value={homeForm.featuredVideoUrl || ''}
                        onChange={(e) => setHomeForm((f) => ({ ...f, featuredVideoUrl: e.target.value }))}
                        placeholder="https://youtu.be/Kr1P4Awv2lE"
                        className="input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">
                        Badge Label
                      </label>
                      <input
                        value={homeForm.featuredVideoBadge || ''}
                        onChange={(e) => setHomeForm((f) => ({ ...f, featuredVideoBadge: e.target.value }))}
                        placeholder="Featured Spotlight"
                        className="input text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">
                      Featured Video Title
                    </label>
                    <input
                      value={homeForm.featuredVideoTitle || ''}
                      onChange={(e) => setHomeForm((f) => ({ ...f, featuredVideoTitle: e.target.value }))}
                      placeholder="What is ZC OCW?"
                      className="input text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink dark:text-slate-300 mb-1">
                      Featured Video Narrative / Description
                    </label>
                    <textarea
                      rows={3}
                      value={homeForm.featuredVideoDescription || ''}
                      onChange={(e) => setHomeForm((f) => ({ ...f, featuredVideoDescription: e.target.value }))}
                      className="input text-xs leading-relaxed"
                      placeholder="Learn how Zewail City students and faculty came together..."
                    />
                  </div>
                </div>
              </div>
            )}

            <button type="submit" className="btn-primary text-xs w-full gap-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> Save {cmsPage === 'site_settings' ? 'Navigation & Social' : cmsPage === 'about' ? 'About' : 'Home'} Content
            </button>
          </form>
        </div>

        {/* YouTube & Astronomy API Config */}
        <div className="card-flat border border-slate-100 dark:border-white/10 shadow-card">
          <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100 dark:border-white/10">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
              <Youtube className="w-4.5 h-4.5 text-red-600" />
            </div>
            <h2 className="font-display text-lg font-bold text-ink dark:text-white">API Integrations (YouTube & Astronomy API)</h2>
          </div>
          <p className="text-sm text-ink-muted mb-4 leading-relaxed">
            API keys are kept secure as Cloudflare Worker secrets (<code className="bg-slate-100 dark:bg-night-100 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono text-xs">YOUTUBE_API_KEY</code>, <code className="bg-slate-100 dark:bg-night-100 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono text-xs">ASTRONOMY_API_APP_ID</code>, <code className="bg-slate-100 dark:bg-night-100 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono text-xs">ASTRONOMY_API_APP_SECRET</code>).
          </p>
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-night-200/60 border border-slate-200 dark:border-white/10">
              <Youtube className="w-4 h-4 text-ink-ghost flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-ink-muted">Channel ID</p>
                <p className="font-mono text-xs text-ink-ghost truncate">VITE_YOUTUBE_CHANNEL_ID</p>
              </div>
              <span className={`badge text-[10px] ${
                import.meta.env.VITE_YOUTUBE_CHANNEL_ID ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
              }`}>
                {import.meta.env.VITE_YOUTUBE_CHANNEL_ID ? '✓ Set' : '✗ Missing'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-night-200/60 border border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-3">
                <Key className="w-4 h-4 text-ink-ghost flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-ink-muted">Astronomy API Ephemeris Service</p>
                  <p className="font-mono text-xs text-ink-ghost truncate">Worker route: /api/sky</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleTestSkyApi}
                disabled={testingSky}
                className="btn-outline text-xs py-1 px-3"
              >
                {testingSky ? 'Testing...' : 'Test Sky API Connection'}
              </button>
            </div>
            {skyTestStatus && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${skyTestStatus.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                {skyTestStatus.message}
              </div>
            )}
          </div>
        </div>

        {/* Data management */}
        <div className="card-flat border border-slate-100 dark:border-white/10 shadow-card">
          <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100 dark:border-white/10">
            <div className="w-9 h-9 rounded-xl bg-ocean-100 flex items-center justify-center">
              <Download className="w-4.5 h-4.5 text-ocean-600" />
            </div>
            <h2 className="font-display text-lg font-bold text-ink dark:text-white">Data Management</h2>
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

      {/* Profile Photo Cropper Modal */}
      {cropImageSrc && (
        <ImageCropperModal
          imageSrc={cropImageSrc}
          onClose={() => setCropImageSrc(null)}
          onCropComplete={handleCroppedUpload}
        />
      )}
    </>
  )
}
