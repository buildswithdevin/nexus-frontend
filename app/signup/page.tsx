'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { oauthRedirect, googleGisToken, setToken, pingBackend } from '@/lib/api'
import { GOOGLE_CLIENT_ID } from '@/lib/google-gis'

function MicrosoftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#F25022" d="M1 1h10v10H1z"/>
      <path fill="#7FBA00" d="M13 1h10v10H13z"/>
      <path fill="#00A4EF" d="M1 13h10v10H1z"/>
      <path fill="#FFB900" d="M13 13h10v10H13z"/>
    </svg>
  )
}
function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  )
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'Contains a number',       pass: /\d/.test(password) },
    { label: 'Contains a letter',        pass: /[a-zA-Z]/.test(password) },
  ]
  if (!password) return null
  return (
    <div className="mt-2 space-y-1">
      {checks.map(c => (
        <div key={c.label} className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.pass ? '' : 'opacity-30'}`}
            style={{ background: c.pass ? '#34d399' : '#9ca3af' }} />
          <span className="text-xs" style={{ color: c.pass ? '#34d399' : 'var(--text-dim)' }}>{c.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function SignupPage() {
  const router = useRouter()
  const { signup, isLoggedIn, isLoading } = useAuth()

  const [displayName, setDisplayName] = useState('')
  const [username,    setUsername]    = useState('')
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [showPw,      setShowPw]      = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [gisLoading,  setGisLoading]  = useState(false)
  const [gisReady,    setGisReady]    = useState(false)
  const [gisError,    setGisError]    = useState<string | null>(null)
  const [error,       setError]       = useState('')

  const gisContainerRef = useRef<HTMLDivElement>(null)
  const routerRef       = useRef(router)
  routerRef.current = router

  // Pre-warm the backend so it's awake by the time the user submits
  useEffect(() => { pingBackend() }, [])

  const gisHandlerRef = useRef(async (_cred: string) => {})
  useEffect(() => {
    gisHandlerRef.current = async (credential: string) => {
      console.log('[GIS] credential callback fired — exchanging with backend')
      setGisLoading(true)
      setError('')
      try {
        const data = await googleGisToken(credential)
        setToken(data.token)
        console.log('[GIS] token stored, redirecting to /app')
        routerRef.current.replace('/app')
      } catch (err) {
        console.error('[GIS] backend exchange failed:', err)
        setError(err instanceof Error ? err.message : 'Google sign-up failed')
        setGisLoading(false)
      }
    }
  })

  useEffect(() => {
    function initGis() {
      const container = gisContainerRef.current
      if (!container || !window.google?.accounts?.id) {
        console.warn('[GIS] initGis: container or google.accounts.id not available')
        return
      }

      try {
        console.log('[GIS] google.accounts.id.initialize')
        window.google.accounts.id.initialize({
          client_id:             GOOGLE_CLIENT_ID,
          callback:              (res) => gisHandlerRef.current(res.credential),
          auto_select:           false,
          cancel_on_tap_outside: true,
        })

        const width = Math.min(container.offsetWidth || 320, 400)
        console.log('[GIS] renderButton width =', width, 'container.offsetWidth =', container.offsetWidth)
        window.google.accounts.id.renderButton(container, {
          type:  'standard',
          size:  'large',
          text:  'signup_with',
          width,
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[GIS] initialize/renderButton threw:', msg)
        setGisError(msg)
        return
      }

      const observer = new MutationObserver(() => {
        if (container.firstChild) {
          observer.disconnect()
          console.log('[GIS] button rendered — ready ✓')
          setGisReady(true)
        }
      })
      observer.observe(container, { childList: true, subtree: true })

      const errorTimer = setTimeout(() => {
        if (!container.firstChild) {
          const msg =
            'Google button did not render after 8 s. ' +
            'Most likely cause: add https://nexus-frontend-five-swart.vercel.app ' +
            'to Authorized JavaScript Origins in Google Cloud Console → ' +
            'APIs & Services → Credentials → click the OAuth client → ' +
            'Authorized JavaScript origins.'
          console.error('[GIS]', msg)
          setGisError(msg)
        }
      }, 8000)

      return () => {
        observer.disconnect()
        clearTimeout(errorTimer)
      }
    }

    if (window.google?.accounts?.id) {
      console.log('[GIS] google already on window')
      initGis()
      return
    }

    const existing = document.querySelector<HTMLScriptElement>('script[src*="accounts.google.com/gsi"]')
    if (existing) {
      console.log('[GIS] script tag found — waiting for load event')
      existing.addEventListener('load', initGis, { once: true })
      return () => existing.removeEventListener('load', initGis)
    }

    console.log('[GIS] injecting gsi/client script')
    const script = document.createElement('script')
    script.src   = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload  = () => { console.log('[GIS] script loaded ✓'); initGis() }
    script.onerror = () => {
      const msg = 'Failed to load accounts.google.com/gsi/client'
      console.error('[GIS]', msg)
      setGisError(msg)
    }
    document.head.appendChild(script)
    return () => { script.onload = null; script.onerror = null }
  }, [])

  useEffect(() => {
    if (displayName && !username) {
      setUsername(displayName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20))
    }
  }, [displayName]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isLoading && isLoggedIn) router.replace('/app')
  }, [isLoggedIn, isLoading, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (username.length < 3)  { setError('Username must be at least 3 characters'); return }
    setLoading(true)
    setError('')
    try {
      await signup(displayName.trim(), username.trim(), email.trim(), password)
      router.replace('/app')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  const busy = loading || gisLoading

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 0 32px rgba(139,92,246,0.35)' }}
          >
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Create your account</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Your personal AI knowledge hub</p>
        </div>

        <div className="p-6 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
              style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2 mb-4">

            {/* ── Google sign-in ─────────────────────────────────────────────── */}
            <div style={{ position: 'relative', minHeight: '40px' }}>

              {/* GIS button target — always present and full-width */}
              <div ref={gisContainerRef} style={{ width: '100%' }} />

              {/* Loading overlay */}
              {!gisReady && !gisError && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'var(--bg-card)' }}>
                  <div
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium"
                    style={{
                      background: 'var(--input-bg)', borderColor: 'var(--border)',
                      color: 'var(--text-muted)', cursor: gisLoading ? 'default' : 'wait', minHeight: '40px',
                    }}
                  >
                    <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                    {gisLoading ? 'Signing in with Google…' : 'Loading Google sign-in…'}
                  </div>
                </div>
              )}

              {/* Processing overlay */}
              {gisReady && gisLoading && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'var(--bg-card)' }}>
                  <div
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-muted)', minHeight: '40px' }}
                  >
                    <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                    Signing in with Google…
                  </div>
                </div>
              )}

              {/* Error state with redirect fallback */}
              {gisError && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'var(--bg-card)' }}>
                  <button
                    onClick={() => { console.log('[GIS] falling back to redirect flow'); oauthRedirect('google') }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150"
                    style={{ background: 'var(--input-bg)', borderColor: 'rgba(239,68,68,0.3)', color: '#f87171', minHeight: '40px' }}
                    title={gisError}
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    Google unavailable — try redirect →
                  </button>
                </div>
              )}
            </div>

            {([
              { provider: 'microsoft' as const, label: 'Sign up with Microsoft', Icon: MicrosoftIcon },
              { provider: 'github'    as const, label: 'Sign up with GitHub',    Icon: GitHubIcon    },
            ] as const).map(({ provider, label, Icon }) => (
              <button
                key={provider}
                onClick={() => oauthRedirect(provider)}
                disabled={busy}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150 disabled:opacity-60"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                onMouseEnter={e => { if (!busy) e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)' }}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <Icon />
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>or with email</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Display Name</label>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name" required autoComplete="name"
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all duration-200"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                onFocus={e => (e.target.style.borderColor = 'rgba(139,92,246,0.5)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm select-none" style={{ color: 'var(--text-dim)' }}>@</span>
                <input type="text" value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  placeholder="username" required autoComplete="username"
                  className="w-full pl-7 pr-4 py-3 rounded-xl border text-sm outline-none transition-all duration-200"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(139,92,246,0.5)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required autoComplete="email"
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all duration-200"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                onFocus={e => (e.target.style.borderColor = 'rgba(139,92,246,0.5)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters" required autoComplete="new-password"
                  className="w-full px-4 py-3 pr-11 rounded-xl border text-sm outline-none transition-all duration-200"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(139,92,246,0.5)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: 'var(--text-dim)' }} tabIndex={-1}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>
            <button type="submit" disabled={busy || !displayName || !email || !password || !username}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-5" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-medium transition-colors" style={{ color: '#a78bfa' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
