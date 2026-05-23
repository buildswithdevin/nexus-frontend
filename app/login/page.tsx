'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { oauthRedirect, googleGisToken, setToken } from '@/lib/api'
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

// ── Login form ────────────────────────────────────────────────────────────────

function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { login, isLoggedIn, isLoading } = useAuth()

  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [showPw,     setShowPw]     = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [gisLoading, setGisLoading] = useState(false)
  const [gisReady,   setGisReady]   = useState(false)
  const [error,      setError]      = useState('')

  const from = searchParams.get('from') || '/app'

  // gisContainerRef is always in the DOM (visibility:hidden until ready) so
  // that offsetWidth is correct when renderButton() reads it.
  const gisContainerRef = useRef<HTMLDivElement>(null)
  const routerRef       = useRef(router)
  const fromRef         = useRef(from)
  routerRef.current = router
  fromRef.current   = from

  // Stable callback ref — GIS registers this once; we update the closure each render
  const gisHandlerRef = useRef(async (_cred: string) => {})
  useEffect(() => {
    gisHandlerRef.current = async (credential: string) => {
      console.log('[GIS] credential callback fired — exchanging with backend')
      setGisLoading(true)
      setError('')
      try {
        const data = await googleGisToken(credential)
        setToken(data.token)
        console.log('[GIS] token stored, redirecting to', fromRef.current)
        routerRef.current.replace(fromRef.current)
      } catch (err) {
        console.error('[GIS] backend exchange failed:', err)
        setError(err instanceof Error ? err.message : 'Google sign-in failed')
        setGisLoading(false)
      }
    }
  })

  // Load GIS script and render the official button into gisContainerRef.
  //
  // We render the REAL Google button (not a transparent overlay clone) because
  // the cross-origin GIS iframe must be the direct click target for the browser
  // to treat the resulting popup as a genuine user gesture.  The overlay
  // approach fails because our wrapper's overflow:hidden clips the iframe in a
  // way that makes it unclickable even though gisReady was set by the fallback
  // timer.
  useEffect(() => {
    function initGis() {
      const container = gisContainerRef.current
      if (!container || !window.google?.accounts?.id) {
        console.warn('[GIS] initGis called but container or google.accounts.id missing')
        return
      }

      console.log('[GIS] calling google.accounts.id.initialize')
      window.google.accounts.id.initialize({
        client_id:             GOOGLE_CLIENT_ID,
        callback:              (res) => gisHandlerRef.current(res.credential),
        auto_select:           false,
        cancel_on_tap_outside: true,
      })

      // Read the container's pixel width while it is in the DOM
      // (visibility:hidden still gives correct offsetWidth unlike display:none)
      const btnWidth = Math.min(container.offsetWidth || 320, 400)
      console.log('[GIS] calling renderButton, width =', btnWidth)
      window.google.accounts.id.renderButton(container, {
        type:  'standard',
        size:  'large',
        text:  'continue_with',
        width: btnWidth,
      })

      // Watch for GIS to inject its button element into the container
      const observer = new MutationObserver(() => {
        if (container.firstChild) {
          observer.disconnect()
          console.log('[GIS] button rendered in DOM — marking ready')
          setGisReady(true)
        }
      })
      observer.observe(container, { childList: true, subtree: true })

      // 3-second safety net — only fires if MutationObserver never triggered
      setTimeout(() => {
        setGisReady(prev => {
          if (!prev) console.warn('[GIS] fallback timer fired — button may not be ready')
          return prev  // do NOT force-true; only MutationObserver should set ready
        })
      }, 3000)
    }

    if (window.google?.accounts?.id) {
      console.log('[GIS] google already on window — skipping script load')
      initGis()
      return
    }

    const existing = document.querySelector<HTMLScriptElement>('script[src*="accounts.google.com/gsi"]')
    if (existing) {
      console.log('[GIS] script tag already in DOM — attaching load listener')
      existing.addEventListener('load', initGis, { once: true })
      return () => existing.removeEventListener('load', initGis)
    }

    console.log('[GIS] injecting accounts.google.com/gsi/client script')
    const script = document.createElement('script')
    script.src   = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => { console.log('[GIS] script loaded ✓'); initGis() }
    script.onerror = () => console.error('[GIS] script failed to load')
    document.head.appendChild(script)
    return () => { script.onload = null; script.onerror = null }
  }, [])

  useEffect(() => {
    const urlError = searchParams.get('error')
    if (urlError) setError(decodeURIComponent(urlError))
  }, [searchParams])

  useEffect(() => {
    if (!isLoading && isLoggedIn) router.replace(from)
  }, [isLoggedIn, isLoading, router, from])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) return
    setLoading(true)
    setError('')
    try {
      await login(email.trim(), password)
      router.replace(from)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const busy = loading || gisLoading

  // Determine which state the Google button area is in
  const googleState: 'loading' | 'ready' | 'processing' =
    gisLoading ? 'processing' : gisReady ? 'ready' : 'loading'

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
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Welcome back</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Sign in to your NEXUS account</p>
        </div>

        <div className="p-6 rounded-2xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
              style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* OAuth buttons */}
          <div className="space-y-2 mb-4">

            {/* ── Google sign-in ────────────────────────────────────────────────
                Three visual states share the same DOM slot:
                  loading    → disabled placeholder with spinner
                  ready      → official Google button (rendered by GIS)
                  processing → spinner while backend exchanges credential

                The GIS container is kept in the DOM at all times with
                visibility:hidden so offsetWidth is readable when
                renderButton() is called.  It switches to visibility:visible
                when gisReady becomes true.
            ───────────────────────────────────────────────────────────────── */}
            <div style={{ minHeight: '40px' }}>

              {/* Loading placeholder */}
              {googleState === 'loading' && (
                <div
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium"
                  style={{
                    background:  'var(--input-bg)',
                    borderColor: 'var(--border)',
                    color:       'var(--text-muted)',
                    cursor:      'wait',
                    minHeight:   '40px',
                  }}
                >
                  <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                  Loading Google sign-in…
                </div>
              )}

              {/* Processing placeholder */}
              {googleState === 'processing' && (
                <div
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium"
                  style={{
                    background:  'var(--input-bg)',
                    borderColor: 'var(--border)',
                    color:       'var(--text-muted)',
                    minHeight:   '40px',
                  }}
                >
                  <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                  Signing in with Google…
                </div>
              )}

              {/* Official Google button — rendered by GIS into this div.
                  visibility:hidden keeps it in layout flow (preserving offsetWidth)
                  until GIS has finished rendering. */}
              <div
                ref={gisContainerRef}
                onClick={() => console.log('[GIS] Google button area clicked by user')}
                style={{
                  width:      '100%',
                  overflow:   'hidden',
                  visibility: googleState === 'ready' ? 'visible' : 'hidden',
                  height:     googleState === 'ready' ? 'auto' : '0',
                }}
              />
            </div>

            {/* Microsoft and GitHub — unchanged redirect flow */}
            {([
              { provider: 'microsoft' as const, label: 'Continue with Microsoft', Icon: MicrosoftIcon },
              { provider: 'github'    as const, label: 'Continue with GitHub',    Icon: GitHubIcon    },
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

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>or email</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required autoComplete="email"
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all duration-200"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                onFocus={e => (e.target.style.borderColor = 'rgba(139,92,246,0.5)')}
                onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required autoComplete="current-password"
                  className="w-full px-4 py-3 pr-11 rounded-xl border text-sm outline-none transition-all duration-200"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(139,92,246,0.5)')}
                  onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: 'var(--text-dim)' }} tabIndex={-1}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={busy || !email || !password}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-5" style={{ color: 'var(--text-muted)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium transition-colors" style={{ color: '#a78bfa' }}>Create one</Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}
