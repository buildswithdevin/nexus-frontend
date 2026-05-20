'use client'

import { ThemeProvider } from '@/lib/theme-context'
import { UserProvider } from '@/lib/user-context'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <UserProvider>
        {children}
      </UserProvider>
    </ThemeProvider>
  )
}
