import { Bookmark } from 'lucide-react'
import { useProgress } from '@/context/ProgressContext'
import clsx from 'clsx'

export default function BookmarkButton({ playlistId, size = 'md', className = '' }) {
  const { isBookmarked, toggleBookmark } = useProgress()
  const saved = isBookmarked(playlistId)
  const s = { sm: 'w-7 h-7', md: 'w-9 h-9', lg: 'w-10 h-10' }[size]
  const i = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-5 h-5' }[size]
  return (
    <button
      onClick={e => { e.preventDefault(); e.stopPropagation(); toggleBookmark(playlistId) }}
      title={saved ? 'Remove bookmark' : 'Bookmark'}
      className={clsx(
        'flex items-center justify-center rounded-full transition-all duration-200 shadow-sm',
        s,
        saved
          ? 'bg-ocean-500 text-white shadow-glow'
          : 'bg-white/90 text-slate-400 hover:text-ocean-500 hover:bg-white backdrop-blur-sm',
        className
      )}>
      <Bookmark className={i} fill={saved ? 'currentColor' : 'none'} strokeWidth={2} />
    </button>
  )
}
