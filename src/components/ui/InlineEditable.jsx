import { useState, useEffect, useRef } from 'react'
import { Pencil, Check, X, Loader2, Sparkles } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import * as storage from '@/services/storage'
import * as cloudflare from '@/services/cloudflare'

/**
 * InlineEditable
 * Wraps any public UI text element. For admins, shows a sleek floating edit button on hover.
 * Clicking lets admins edit the text in-place with full newline support and auto-syncs to Cloudflare D1.
 */
export default function InlineEditable({
  page = 'home',
  field,
  value = '',
  defaultContent = {},
  multiline = false,
  label = 'Edit Text',
  className = '',
  children,
}) {
  const { isAdmin } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const [savedToast, setSavedToast] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      if (typeof inputRef.current.select === 'function') {
        inputRef.current.select()
      }
    }
  }, [isEditing])

  if (!isAdmin) {
    return <>{children}</>
  }

  const handleOpen = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDraft(value)
    setIsEditing(true)
  }

  const handleCancel = (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setDraft(value)
    setIsEditing(false)
  }

  const handleSave = async (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setSaving(true)
    try {
      // 1. Get existing page content
      const existing = storage.get(`page_content_${page}`, defaultContent) || {}
      const updated = {
        ...existing,
        [field]: draft,
      }

      // 2. Save to local storage
      storage.set(`page_content_${page}`, updated)

      // 3. Sync to Cloudflare D1 Worker
      if (cloudflare.isConfigured) {
        await cloudflare.upsertPageContent(page, updated)
      }

      // 4. Dispatch global event for instant reactive update across tabs/components
      window.dispatchEvent(
        new CustomEvent('page-content-updated', {
          detail: { page, field, value: draft, full: updated },
        })
      )

      setIsEditing(false)
      setSavedToast(true)
      setTimeout(() => setSavedToast(false), 2500)
    } catch (err) {
      alert('Failed to save changes: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleCancel(e)
    } else if (e.key === 'Enter' && (!multiline || e.ctrlKey || e.metaKey)) {
      handleSave(e)
    }
  }

  return (
    <div className={`relative group/editable inline-block w-full ${className}`}>
      {/* Target Content */}
      <div className="transition-all group-hover/editable:outline-dashed group-hover/editable:outline-1 group-hover/editable:outline-cyan-400/60 rounded-lg">
        {children}
      </div>

      {/* Floating Admin Edit Button on Hover */}
      {!isEditing && (
        <button
          type="button"
          onClick={handleOpen}
          className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 opacity-0 group-hover/editable:opacity-100
                     transition-all duration-200 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full
                     bg-cyan-500 text-ocean-950 text-xs font-bold shadow-glow hover:scale-105 active:scale-95 cursor-pointer"
          title={`Edit ${label}`}
        >
          <Pencil className="w-3 h-3" />
          <span className="hidden sm:inline text-[11px]">{label}</span>
        </button>
      )}

      {/* Saved Notification Toast */}
      {savedToast && (
        <div className="absolute -top-7 right-0 z-40 flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-black/90 px-2.5 py-0.5 rounded-full border border-emerald-500/40 shadow-lg animate-fade-in">
          <Check className="w-3 h-3 text-emerald-400" />
          <span>Saved & Synced!</span>
        </div>
      )}

      {/* In-Place Popover Editor */}
      {isEditing && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-0 left-0 right-0 z-50 p-4 rounded-2xl bg-[#0c0c12]/95 backdrop-blur-xl
                     border border-cyan-400/40 shadow-2xl text-white animate-scale-in"
        >
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Editing: {label}</span>
            </div>
            <span className="text-[10px] text-white/40 font-mono">
              {multiline ? 'Ctrl+Enter to save · Esc to cancel' : 'Enter to save · Esc to cancel'}
            </span>
          </div>

          {multiline ? (
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={4}
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/20 text-white text-sm
                         font-body leading-relaxed placeholder:text-white/30 focus:outline-none focus:border-cyan-400
                         focus:ring-2 focus:ring-cyan-400/30 resize-y whitespace-pre-line"
              placeholder={`Enter ${label.toLowerCase()}…`}
            />
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/20 text-white text-sm
                         font-body placeholder:text-white/30 focus:outline-none focus:border-cyan-400
                         focus:ring-2 focus:ring-cyan-400/30"
              placeholder={`Enter ${label.toLowerCase()}…`}
            />
          )}

          <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-primary text-xs !py-1.5 !px-4 gap-1.5 shadow-md shadow-cyan-500/20"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" /> Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
