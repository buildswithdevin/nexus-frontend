'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { oauthRedirect, googleGisToken, setToken } from '@/lib/api'
import { GOOGLE_CLIENT_ID } from '@/lib/google-gis'

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}
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
  const [error,       setError]       = useState('')

  // Refs so the once-registered GIS callback always has the latest router ref
  const gisRef    = useRef<HTMLDivElement>(null)
  const routerRef = useRef(router)
  routerRef.current = router

  // Keep the GIS credential handler up to date without re-initialising GIS
  const gisHandlerRef = useRef(async (_credential: string) => {})
  useEffect(() => {
    gisHandlerRef.current = async (credential: string) => {
      setGisLoading(true)
      setError('')
      try {
        const data = await googleGisToken(credential)
        setToken(data.token)
        routerRef.current.replace('/app')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Google sign-up failed')
        setGisLoading(false)
      }
    }
  })

  // Load GIS script once and render a button into the hidden container
  useEffect(() => {
    function initGis() {
      if (!gisRef.current || !window.google?.accounts?.id) return
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (res) => gisHandlerRef.current(res.credential),
        auto_select: false,
        cancel_on_tap_outside: true,
      })
      window.google.accounts.id.renderButton(gisRef.current, {
        type: 'standard',
        size: 'large',
      })
    }

    if (window.google?.accounts?.id) {
      initGis()
      return
    }

    const existing = document.querySelector<HTMLScriptElement>('script[src*="accounts.google.com/gsi"]')
    if (existing) {
      existing.addEventListener('load', initGis, { once: true })
      return () => existing.removeEventListener('load', initGis)
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = initGis
    document.head.appendChild(script)
    return () => { script.onload = null }
  }, [])

  // Auto-fill username from display name
  useEffect(() => {
    if (displayName && !username) {
      setUsername(displayName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20))
    }
  }, [displayName]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isLoading && isLoggedIn) router.replace('/app')
  }, [isLoggedIn, isLoading, router])

  // Click the GIS-rendered button inside the hidden container
  function handleGoogleClick() {
    const btn = gisRef.current?.querySelector<HTMLElement>('div[role=button]')
    if (btn) {
      btn.click()
    } else {
      setError('Google sign-in is still initializing — please try again in a moment')
    }
  }

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

        {/* Logo */}
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

        <div
          className="p-6 rounded-2xl border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          {error && (
            <div
              className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
              style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Hidden off-screen container — GIS renders its button here so we can click it */}
          <div
            ref={gisRef}
            aria-hidden="true"
            style={{ position: 'fixed', top: 0, left: '-9999px', width: '220px', height: '44px' }}
          />

          {/* OAuth buttons */}
          <div className="space-y-2 mb-4">
            {/* Google — GIS token flow (no redirect, no client secret required) */}
            <button
              onClick={handleGoogleClick}
              disabled={busy}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150 disabled:opacity-60"
              style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              onMouseEnter={e => { if (!busy) e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)' }}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              {gisLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
              Sign up with Google
            </button>

            {/* Microsoft and GitHub — server-side redirect flow */}
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
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name"
                required
                autoComplete="name"
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all duration-200"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                onFocus={e => (e.target.style.borderColor = 'rgba(139,92,246,0.5)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Username</label>
              <div className="relative">
                <span
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-sm select-none"
                  style={{ color: 'var(--text-dim)' }}
                >@</span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  placeholder="username"
                  required
                  autoComplete="username"
                  className="w-full pl-7 pr-4 py-3 rounded-xl border text-sm outline-none transition-all duration-200"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(139,92,246,0.5)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all duration-200"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                onFocus={e => (e.target.style.borderColor = 'rgba(139,92,246,0.5)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                  autoComplete="new-password"
                  className="w-full px-4 py-3 pr-11 rounded-xl border text-sm outline-none transition-all duration-200"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(139,92,246,0.5)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: 'var(--text-dim)' }}
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            <button
              type="submit"
              disabled={busy || !displayName || !email || !password || !username}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-5" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-medium transition-colors" style={{ color: '#a78bfa' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
