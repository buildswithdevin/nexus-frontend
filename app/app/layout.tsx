'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { useTheme, BACKGROUND_OPTIONS } from '@/lib/theme-context'
import { useAuth } from '@/lib/auth-context'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { background, backgroundOverlay } = useTheme()
  const { isLoggedIn, isLoading }         = useAuth()
  const router                            = useRouter()
  const bgOption = BACKGROUND_OPTIONS.find(b => b.id === background)

  // Client-side guard (middleware handles the server-side redirect)
  useEffect(() => {
    if (!isLoading && !isLoggedIn) router.replace('/login')
  }, [isLoading, isLoggedIn, router])

  if (isLoading || !isLoggedIn) return null

  return (
    <div
      className="flex h-screen overflow-hidden relative"
      style={{ background: 'var(--bg-primary)' }}
    >
      {background !== 'none' && bgOption && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: bgOption.preview, zIndex: 0 }}
        />
      )}
      {background !== 'none' && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `rgba(0,0,0,${backgroundOverlay})`, zIndex: 1 }}
        />
      )}
      <div className="relative flex w-full h-full" style={{ zIndex: 2 }}>
        <Sidebar />
        <main
          className="flex-1 overflow-y-auto"
          style={{ background: background === 'none' ? 'var(--bg-primary)' : 'transparent' }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
