import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Home, BookOpen } from 'lucide-react'
export default function NotFound() {
  return (
    <>
      <Helmet><title>404 — ZC OCW</title></Helmet>
      <div className="flex flex-col items-center justify-center min-h-[75vh] text-center px-4">
        <p className="font-mono text-[9rem] font-bold text-ocean-100 leading-none mb-2 select-none">404</p>
        <h1 className="font-display text-3xl font-bold text-ink mb-3">Page not found</h1>
        <p className="text-ink-ghost max-w-sm mb-10 leading-relaxed">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <div className="flex gap-3">
          <Link to="/"        className="btn-primary gap-2"><Home className="w-4 h-4" /> Go home</Link>
          <Link to="/courses" className="btn-outline gap-2"><BookOpen className="w-4 h-4" /> Browse courses</Link>
        </div>
      </div>
    </>
  )
}
