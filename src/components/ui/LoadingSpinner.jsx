export function LoadingSpinner({ size = 'md', className = '' }) {
  const s = { sm:'w-4 h-4', md:'w-8 h-8', lg:'w-12 h-12' }[size]
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${s} rounded-full border-2 border-ocean-200 border-t-ocean-500 animate-spin`} />
    </div>
  )
}
export function CourseCardSkeleton() {
  return (
    <div className="bg-white rounded-[1.25rem] border border-slate-100 overflow-hidden">
      <div className="aspect-video skeleton" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-3.5 w-16 rounded-full" />
        <div className="skeleton h-5 w-full rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded mt-3" />
      </div>
    </div>
  )
}
export function VideoCardSkeleton() {
  return (
    <div className="flex gap-3 p-3">
      <div className="skeleton w-7 h-5 rounded" />
      <div className="skeleton w-24 aspect-video rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="skeleton h-3.5 w-full rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
      </div>
    </div>
  )
}
export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-ink-ghost font-body animate-pulse">Loading…</p>
    </div>
  )
}
