import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

export default function NotFound() {
  return (
    <>
      <Helmet><title>404 — ZC OCW</title></Helmet>
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <p className="font-mono text-7xl font-bold text-zc-gold opacity-60 mb-4">404</p>
        <h1 className="font-display text-3xl text-zc-navy mb-3">Page not found</h1>
        <p className="text-zc-gray max-w-sm mb-8">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <div className="flex gap-4">
          <Link to="/"        className="btn-primary">Go home</Link>
          <Link to="/courses" className="btn-outline">Browse courses</Link>
        </div>
      </div>
    </>
  )
}
