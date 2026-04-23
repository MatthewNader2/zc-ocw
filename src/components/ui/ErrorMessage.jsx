import { AlertTriangle } from 'lucide-react'
export default function ErrorMessage({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-5">
        <AlertTriangle className="w-8 h-8 text-red-400" strokeWidth={1.5} />
      </div>
      <h3 className="font-display text-xl text-ink mb-2">{title}</h3>
      <p className="text-sm text-ink-ghost max-w-sm mb-6 leading-relaxed">
        {message ?? 'This may be a YouTube API quota issue (10,000 units/day free). Try again later or check your API key in .env'}
      </p>
      {onRetry && <button onClick={onRetry} className="btn-outline">Try again</button>}
    </div>
  )
}
