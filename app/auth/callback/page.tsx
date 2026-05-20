'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sparkles, Loader2 } from 'lucide-react'
import { setToken } from '@/lib/api'

function OAuthCallback() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    const error = searchParams.get('error')

    if (error) {
      router.replace(`/login?error=${encodeURIComponent(error.replace(/\+/g, ' '))}`)
      return
    }

    if (token) {
      setToken(token)
      router.replace('/app')
    } else {
      router.replace('/login?error=OAuth+sign-in+failed')
    }
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="text-center">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 0 32px rgba(139,92,246,0.35)' }}
        >
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3" style={{ color: '#8b5cf6' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Completing sign-in…</p>
      </div>
    </div>
  )
}

export default function OAuthCallbackPage() {
  return (
    <Suspense>
      <OAuthCallback />
    </Suspense>
  )
}
