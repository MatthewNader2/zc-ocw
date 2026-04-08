import { Link } from 'react-router-dom'
import { getThumbnail } from '@/services/youtube'
import clsx from 'clsx'

export default function VideoCard({ item, playlistId, index, active = false }) {
  const { snippet, contentDetails } = item
  const videoId = contentDetails?.videoId || snippet?.resourceId?.videoId

  return (
    <Link
      to={`/courses/${playlistId}/watch/${videoId}`}
      className={clsx(
        'flex gap-3 p-3 rounded-xl transition-all group',
        active
          ? 'bg-zc-blue/10 border border-zc-sky/30'
          : 'hover:bg-gray-50'
      )}
    >
      {/* Index number */}
      <div className="flex-shrink-0 w-8 pt-1 text-center text-sm font-mono text-zc-gray">
        {active
          ? <span className="text-zc-sky">▶</span>
          : index + 1
        }
      </div>

      {/* Thumbnail */}
      <div className="flex-shrink-0 w-28 aspect-video rounded-lg overflow-hidden bg-zc-navy">
        <img
          src={getThumbnail(snippet, 'medium')}
          alt={snippet.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={clsx(
          'text-sm font-semibold leading-snug line-clamp-2',
          active ? 'text-zc-sky' : 'text-zc-navy group-hover:text-zc-sky'
        )}>
          {snippet.title}
        </p>
        {snippet.videoOwnerChannelTitle && (
          <p className="text-xs text-zc-gray mt-1">{snippet.videoOwnerChannelTitle}</p>
        )}
      </div>
    </Link>
  )
}
