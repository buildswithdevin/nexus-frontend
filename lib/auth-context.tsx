'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { authLogin, authSignup, authGetMe, authUpdateMe, setToken, clearToken, getToken, type AuthUser } from './api'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthState {
  user:       AuthUser | null
  isLoading:  boolean
  isLoggedIn: boolean
  login:      (email: string, password: string) => Promise<void>
  signup:     (displayName: string, username: string, email: string, password: string) => Promise<void>
  logout:     () => void
  updateMe:   (updates: { display_name?: string; username?: string; email?: string }) => Promise<void>
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthState>({
  user:       null,
  isLoading:  true,
  isLoggedIn: false,
  login:      async () => {},
  signup:     async () => {},
  logout:     () => {},
  updateMe:   async () => {},
})

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]         = useState<AuthUser | null>(null)
  const [isLoading, setLoading] = useState(true)

  // Rehydrate from stored token on mount
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    authGetMe().then(me => {
      setUser(me)
      setLoading(false)
    })
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await authLogin(email, password)
    setToken(data.token)
    setUser(data.user)
  }, [])

  const signup = useCallback(async (
    display_name: string,
    username:     string,
    email:        string,
    password:     string,
  ) => {
    const data = await authSignup({ display_name, username, email, password })
    setToken(data.token)
    setUser(data.user)
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  const updateMe = useCallback(async (updates: { display_name?: string; username?: string; email?: string }) => {
    const result = await authUpdateMe(updates)
    if (result) {
      setToken(result.token)
      setUser(result.user)
    }
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isLoggedIn: !!user,
      login,
      signup,
      logout,
      updateMe,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  return useContext(AuthContext)
}
