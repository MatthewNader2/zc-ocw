import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Mail, Lock, Eye, EyeOff, ShieldAlert } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

// One sign-in screen for everyone — a visitor and an admin use the exact
// same flow. Whether someone lands on /admin after signing in is decided
// by the Worker (see AuthContext.refreshRole), never by anything client-side.
export default function AdminLogin() {
  const [email,    setEmail]    = useState('')
  const [pwd,      setPwd]      = useState('')
  const [show,     setShow]     = useState(false)
  const [mode,     setMode]     = useState('signin') // 'signin' | 'signup'
  const [error,    setError]    = useState('')
  const [notAdmin, setNotAdmin] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const { loginWithGoogle, loginWithEmail, signup, isAdmin, user, loading: authLoading, isFirebaseConfigured } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAdmin) navigate('/admin', { replace: true })
    else if (user && !authLoading) setNotAdmin(true) // signed in, but not an admin account
  }, [isAdmin, user, authLoading, navigate])

  async function withErrorHandling(fn) {
    setLoading(true)
    setError('')
    setNotAdmin(false)
    try {
      await fn()
    } catch (err) {
      setError(humanizeAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  function handleGoogle() {
    withErrorHandling(loginWithGoogle)
  }

  function handleEmailSubmit(e) {
    e.preventDefault()
    withErrorHandling(() =>
      mode === 'signin' ? loginWithEmail(email, pwd) : signup(email, pwd)
    )
  }

  if (isAdmin) return null

  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 bg-slate-50 dark:bg-night text-center">
        <p className="text-ink-ghost dark:text-slate-400 max-w-sm text-sm">
          Sign-in isn't configured yet — add the <code className="bg-slate-100 dark:bg-night-100 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono text-xs">VITE_FIREBASE_*</code> keys to your <code className="bg-slate-100 dark:bg-night-100 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono text-xs">.env</code> file.
        </p>
      </div>
    )
  }

  return (
    <>
      <Helmet><title>Sign In — ZC OCW</title></Helmet>
      <div className="min-h-[80vh] flex items-center justify-center px-4 bg-slate-50 dark:bg-night">
        <div className="w-full max-w-sm animate-scale-in">
          <div className="bg-white dark:bg-night-200 rounded-[1.5rem] shadow-deep border border-slate-100 dark:border-white/10 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-ocean-950 to-ocean-800 px-8 py-10 text-center">
              <img src="/logo.svg" alt="ZC" className="h-10 w-auto mx-auto mb-4" />
              <h1 className="font-display text-2xl font-bold text-white">
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </h1>
              <p className="text-white/40 text-sm mt-1">ZC OCW</p>
            </div>

            <div className="px-8 py-8 space-y-5">
              {notAdmin && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>You're signed in, but this account doesn't have admin access. Ask an existing admin to add your email under Admin → Team.</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className="btn-outline w-full justify-center gap-3 py-3 text-sm"
              >
                <GoogleIcon className="w-4 h-4" />
                Continue with Google
              </button>

              <div className="flex items-center gap-3 text-xs text-ink-ghost dark:text-slate-500">
                <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
                or
                <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-ink dark:text-white mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-ghost" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError('') }}
                      placeholder="you@example.com"
                      className="input pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink dark:text-white mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-ghost" />
                    <input
                      type={show ? 'text' : 'password'}
                      value={pwd}
                      onChange={e => { setPwd(e.target.value); setError('') }}
                      placeholder={mode === 'signin' ? 'Enter your password…' : 'At least 6 characters'}
                      className="input pl-10 pr-10"
                      minLength={6}
                      required
                    />
                    <button type="button" onClick={() => setShow(s => !s)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-ghost hover:text-ink dark:text-white transition-colors">
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
                        {mode === 'signin' ? 'Signing in…' : 'Creating account…'}
                      </span>
                    : mode === 'signin' ? 'Sign In' : 'Create Account'
                  }
                </button>
              </form>

              <p className="text-center text-xs text-ink-ghost dark:text-slate-400">
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError('') }}
                  className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline"
                >
                  {mode === 'signin' ? 'Create one' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function humanizeAuthError(err) {
  const code = err?.code || ''
  if (code.includes('wrong-password') || code.includes('invalid-credential')) return 'Incorrect email or password.'
  if (code.includes('user-not-found')) return 'No account found with that email.'
  if (code.includes('email-already-in-use')) return 'An account with that email already exists — try signing in instead.'
  if (code.includes('weak-password')) return 'Password should be at least 6 characters.'
  if (code.includes('popup-closed-by-user')) return 'Sign-in was cancelled.'
  if (code.includes('invalid-email')) return 'That email address looks invalid.'
  return err?.message || 'Something went wrong. Please try again.'
}

function GoogleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29A11.96 11.96 0 000 12c0 1.93.46 3.76 1.29 5.38l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  )
}
