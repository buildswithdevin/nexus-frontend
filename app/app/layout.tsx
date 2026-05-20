'use client'

import Sidebar from '@/components/Sidebar'
import { useTheme, BACKGROUND_OPTIONS } from '@/lib/theme-context'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { background, backgroundOverlay } = useTheme()
  const bgOption = BACKGROUND_OPTIONS.find(b => b.id === background)

  return (
    <div
      className="flex h-screen overflow-hidden relative"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Custom background layer */}
      {background !== 'none' && bgOption && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: bgOption.preview, zIndex: 0 }}
        />
      )}
      {/* Overlay for readability */}
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
