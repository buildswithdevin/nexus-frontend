'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type ThemeMode = 'dark' | 'light' | 'system'
export type BackgroundPreset =
  | 'none'
  | 'mountain'
  | 'ocean'
  | 'forest'
  | 'night-sky'
  | 'aurora'
  | 'sunset'
  | 'glass'

export interface BackgroundOption {
  id: BackgroundPreset
  label: string
  preview: string
}

export const BACKGROUND_OPTIONS: BackgroundOption[] = [
  { id: 'none',      label: 'Default',       preview: 'linear-gradient(135deg, #06060f, #0f0f24)' },
  { id: 'mountain',  label: 'Soft Mountain',  preview: 'linear-gradient(160deg, #1a0533 0%, #0a1830 45%, #0c1f14 100%)' },
  { id: 'ocean',     label: 'Calm Ocean',     preview: 'linear-gradient(180deg, #0c1445 0%, #0d3155 40%, #0a2337 100%)' },
  { id: 'forest',    label: 'Forest Mist',    preview: 'linear-gradient(160deg, #091e12 0%, #0e2c1a 50%, #071610 100%)' },
  { id: 'night-sky', label: 'Night Sky',      preview: 'radial-gradient(ellipse at 30% 20%, #1a0a40 0%, #04000a 60%, #000208 100%)' },
  { id: 'aurora',    label: 'Abstract Aurora',preview: 'linear-gradient(135deg, #0a0a20 0%, #1a0533 20%, #002b2b 60%, #0a0a18 100%)' },
  { id: 'sunset',    label: 'Warm Sunset',    preview: 'linear-gradient(160deg, #1a0a00 0%, #200814 40%, #0f0324 100%)' },
  { id: 'glass',     label: 'Minimal Glass',  preview: '#080818' },
]

interface ThemeContextValue {
  theme: ThemeMode
  resolvedTheme: 'dark' | 'light'
  background: BackgroundPreset
  backgroundOverlay: number
  setTheme: (t: ThemeMode) => void
  setBackground: (b: BackgroundPreset) => void
  setBackgroundOverlay: (v: number) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  resolvedTheme: 'dark',
  background: 'none',
  backgroundOverlay: 0.3,
  setTheme: () => {},
  setBackground: () => {},
  setBackgroundOverlay: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('dark')
  const [background, setBackgroundState] = useState<BackgroundPreset>('none')
  const [backgroundOverlay, setOverlayState] = useState(0.3)
  const [systemDark, setSystemDark] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('nexus-theme') as ThemeMode | null
    const storedBg = localStorage.getItem('nexus-background') as BackgroundPreset | null
    const storedOverlay = localStorage.getItem('nexus-overlay')
    if (stored) setThemeState(stored)
    if (storedBg) setBackgroundState(storedBg)
    if (storedOverlay) setOverlayState(parseFloat(storedOverlay))

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    setSystemDark(mq.matches)
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const resolvedTheme: 'dark' | 'light' =
    theme === 'system' ? (systemDark ? 'dark' : 'light') : theme

  useEffect(() => {
    const html = document.documentElement
    if (resolvedTheme === 'light') {
      html.classList.add('light')
      html.classList.remove('dark')
    } else {
      html.classList.add('dark')
      html.classList.remove('light')
    }
  }, [resolvedTheme])

  const setTheme = (t: ThemeMode) => {
    setThemeState(t)
    localStorage.setItem('nexus-theme', t)
  }

  const setBackground = (b: BackgroundPreset) => {
    setBackgroundState(b)
    localStorage.setItem('nexus-background', b)
  }

  const setBackgroundOverlay = (v: number) => {
    setOverlayState(v)
    localStorage.setItem('nexus-overlay', String(v))
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, background, backgroundOverlay, setTheme, setBackground, setBackgroundOverlay }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
