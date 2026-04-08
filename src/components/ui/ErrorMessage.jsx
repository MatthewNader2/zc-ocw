export default function ErrorMessage({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        </svg>
      </div>
      <h3 className="font-display text-xl text-zc-navy mb-2">{title}</h3>
      {message && <p className="text-sm text-zc-gray max-w-sm mb-6">{message}</p>}
      {!message && (
        <p className="text-sm text-zc-gray max-w-sm mb-6">
          This may be a YouTube API quota issue. The free daily quota is 10,000 units.
          Try again tomorrow or check your API key in <code className="bg-gray-100 px-1 rounded">.env</code>.
        </p>
      )}
      {onRetry && (
        <button onClick={onRetry} className="btn-outline">
          Try again
        </button>
      )}
    </div>
  )
}
