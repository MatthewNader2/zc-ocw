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
            active
              ? 'bg-ocean-50 dark:bg-ocean-950/80 border border-ocean-200/60 dark:border-ocean-400/30'
              : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
          )}>
      <div className="w-7 pt-0.5 flex-shrink-0 flex flex-col items-center gap-0.5">
        {active
          ? <Play className="w-3.5 h-3.5 text-ocean-500 dark:text-ocean-400" fill="currentColor" strokeWidth={0} />
          : <span className={clsx('text-[11px] font-mono', watched ? 'text-ocean-400 dark:text-ocean-300' : 'text-ink-ghost dark:text-slate-400')}>{index + 1}</span>
        }
        {watched && !active && <CheckCircle2 className="w-3 h-3 text-ocean-400 dark:text-ocean-300" />}
      </div>
      <div className="w-24 aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
        <img src={getThumbnail(snippet, 'medium')} alt={snippet.title}
             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
             loading="lazy" />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className={clsx(
          'text-xs font-semibold leading-snug line-clamp-2 transition-colors duration-200',
          active
            ? 'text-ocean-700 dark:text-ocean-300 font-bold'
            : watched ? 'text-ink-ghost dark:text-slate-400'
            : 'text-ink dark:text-slate-200 group-hover:text-ocean-600 dark:group-hover:text-ocean-400'
        )}>
          {snippet.title}
        </p>
      </div>
    </Link>
  )
}
