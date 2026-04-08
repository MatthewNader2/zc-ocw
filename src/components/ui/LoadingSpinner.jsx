export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizes[size]} rounded-full border-2 border-zc-gold/30 border-t-zc-gold animate-spin`}
      />
    </div>
  )
}

export function CourseCardSkeleton() {
  return (
    <div className="card flex flex-col overflow-hidden">
      <div className="aspect-video skeleton" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 w-20 rounded-full" />
        <div className="skeleton h-5 w-full rounded" />
        <div className="skeleton h-5 w-3/4 rounded" />
        <div className="skeleton h-4 w-1/2 rounded mt-2" />
      </div>
    </div>
  )
}

export function VideoCardSkeleton() {
  return (
    <div className="flex gap-3 p-3">
      <div className="skeleton w-8 h-5 rounded" />
      <div className="skeleton w-28 aspect-video rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
      </div>
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="text-center space-y-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-zc-gray font-body">Loading…</p>
      </div>
    </div>
  )
}
