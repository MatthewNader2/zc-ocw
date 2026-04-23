import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function AdminLogin() {
  const [pwd,     setPwd]     = useState('')
  const [show,    setShow]    = useState(false)
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const { login, isAdmin } = useAuth()
  const navigate = useNavigate()

  if (isAdmin) { navigate('/admin', { replace: true }); return null }

  function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      if (login(pwd)) navigate('/admin', { replace: true })
      else { setError('Incorrect password.'); setLoading(false) }
    }, 400)
  }

  return (
    <>
      <Helmet><title>Admin Login — ZC OCW</title></Helmet>
      <div className="min-h-[80vh] flex items-center justify-center px-4 bg-slate-50">
        <div className="w-full max-w-sm animate-scale-in">
          <div className="bg-white rounded-[1.5rem] shadow-deep border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-ocean-950 to-ocean-800 px-8 py-10 text-center">
              <img src="/logo.svg" alt="ZC" className="h-10 w-auto mx-auto mb-4" />
              <h1 className="font-display text-2xl font-bold text-white">Admin Access</h1>
              <p className="text-white/40 text-sm mt-1">ZC OCW Content Management</p>
            </div>

            <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-ink mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-ghost" />
                  <input
                    type={show ? 'text' : 'password'}
                    value={pwd}
                    onChange={e => { setPwd(e.target.value); setError('') }}
                    placeholder="Enter admin password…"
                    className="input pl-10 pr-10"
                    autoFocus required
                  />
                  <button type="button" onClick={() => setShow(s => !s)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-ghost hover:text-ink transition-colors">
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {error && <p className="text-red-500 text-xs mt-1.5 animate-fade-in">{error}</p>}
              </div>

              <button type="submit" disabled={loading}
                      className="btn-primary w-full justify-center text-base py-3">
                {loading
                  ? <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Checking…
                    </span>
                  : 'Sign In'
                }
              </button>

              <p className="text-xs text-center text-ink-ghost pt-1">
                Set <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">VITE_ADMIN_PASSWORD</code> in .env
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
