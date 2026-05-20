'use client'

/**
 * Auth context placeholder — ready for Supabase / NextAuth integration.
 *
 * Current state: single-user local mode (no login required).
 * When adding auth:
 *   1. Install @supabase/supabase-js or next-auth
 *   2. Replace the stub below with a real session/user provider
 *   3. Gate protected routes in app/app/layout.tsx
 */

import { createContext, useContext, ReactNode } from 'react'

export interface User {
  id:        string
  email:     string | null
  name:      string | null
  avatarUrl: string | null
}

interface AuthState {
  user:       User | null
  isLoading:  boolean
  isLoggedIn: boolean
  /** Placeholder — wire up to your auth provider */
  signIn:  (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const DEFAULT_USER: User = {
  id:        'local-user',
  email:     null,
  name:      'You',
  avatarUrl: null,
}

const AuthContext = createContext<AuthState>({
  user:       DEFAULT_USER,
  isLoading:  false,
  isLoggedIn: true,
  signIn:     async () => {},
  signOut:    async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  // TODO: replace this stub with real auth (Supabase, NextAuth, Clerk, etc.)
  const value: AuthState = {
    user:       DEFAULT_USER,
    isLoading:  false,
    isLoggedIn: true,
    signIn:     async (_email: string, _password: string) => {
      // await supabase.auth.signInWithPassword({ email, password })
      throw new Error('Auth not implemented yet')
    },
    signOut: async () => {
      // await supabase.auth.signOut()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  return useContext(AuthContext)
}
