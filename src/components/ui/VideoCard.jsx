import { Link } from 'react-router-dom'
import { Play, CheckCircle2 } from 'lucide-react'
import { getThumbnail } from '@/services/youtube'
import { useProgress }  from '@/context/ProgressContext'
import clsx from 'clsx'

export default function VideoCard({ item, playlistId, index, active = false }) {
  const { snippet, contentDetails } = item
  const videoId = contentDetails?.videoId || snippet?.resourceId?.videoId
  const { isWatched } = useProgress()
  const watched = isWatched(videoId)
  return (
    <Link to={`/courses/${playlistId}/watch/${videoId}`}
          className={clsx(
            'flex gap-3 p-3 rounded-xl transition-all duration-200 group',
            active   ? 'bg-ocean-50 border border-ocean-200/60' : 'hover:bg-slate-50 border border-transparent'
          )}>
      <div className="w-7 pt-0.5 flex-shrink-0 flex flex-col items-center gap-0.5">
        {active
          ? <Play className="w-3.5 h-3.5 text-ocean-500" fill="currentColor" strokeWidth={0} />
          : <span className={clsx('text-[11px] font-mono', watched ? 'text-ocean-300' : 'text-ink-ghost')}>{index + 1}</span>
        }
        {watched && !active && <CheckCircle2 className="w-3 h-3 text-ocean-400" />}
      </div>
      <div className="w-24 aspect-video rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
        <img src={getThumbnail(snippet, 'medium')} alt={snippet.title}
             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
             loading="lazy" />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className={clsx(
          'text-xs font-semibold leading-snug line-clamp-2 transition-colors duration-200',
          active   ? 'text-ocean-700'
          : watched ? 'text-ink-ghost'
          : 'text-ink group-hover:text-ocean-600'
        )}>
          {snippet.title}
        </p>
      </div>
    </Link>
  )
}
