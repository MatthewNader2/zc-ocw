import { Link } from 'react-router-dom'
import { getThumbnail } from '@/services/youtube'
import { getDepartment } from '@/data/courses'
import clsx from 'clsx'

export default function CourseCard({ playlist, className }) {
  const { id, snippet, contentDetails, meta = {} } = playlist
  const dept = getDepartment(meta.department)

  return (
    <Link
      to={`/courses/${id}`}
      className={clsx('card group flex flex-col', className)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-zc-navy">
        <img
          src={getThumbnail(snippet, 'medium')}
          alt={snippet.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Lecture count chip */}
        <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-mono px-2 py-0.5 rounded">
          {contentDetails.itemCount} lectures
        </span>
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-zc-navy/40">
          <div className="w-14 h-14 rounded-full bg-zc-gold flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-zc-navy ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col p-4 gap-2">
        {/* Department badge */}
        {dept && (
          <span className={clsx('badge w-fit text-[10px]', dept.color)}>
            {dept.label}
          </span>
        )}

        <h3 className="font-display text-zc-navy font-semibold text-base leading-snug
                       group-hover:text-zc-sky transition-colors line-clamp-2">
          {snippet.title}
        </h3>

        {meta.instructor && (
          <p className="text-xs text-zc-gray">{meta.instructor}</p>
        )}

        <p className="text-sm text-zc-gray line-clamp-2 mt-auto pt-1">
          {snippet.description || 'No description available.'}
        </p>

        {/* Footer meta */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
          <span className="text-xs text-zc-gray">{meta.level || 'Open to all'}</span>
          {meta.semester && (
            <span className="text-xs text-zc-gray">{meta.semester}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
