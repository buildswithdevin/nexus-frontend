'use client'

import { createContext, useContext } from 'react'
import { useAuth } from './auth-context'

// ── Compatibility shim ────────────────────────────────────────────────────────
// Pages that call useUser() get a stable shape derived from the real auth context.

export interface UserProfile {
  displayName:   string
  username:      string
  email:         string
  avatarInitial: string
}

interface UserContextValue {
  user:          UserProfile
  isLoggedIn:    boolean
  updateProfile: (updates: Partial<Pick<UserProfile, 'displayName' | 'username' | 'email'>>) => Promise<void>
  login:         (name: string, email: string) => void   // legacy no-op (unused)
  logout:        () => void
}

const UserContext = createContext<UserContextValue>({
  user:          { displayName: '', username: '', email: '', avatarInitial: '?' },
  isLoggedIn:    false,
  updateProfile: async () => {},
  login:         () => {},
  logout:        () => {},
})

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser, isLoggedIn, logout, updateMe } = useAuth()

  const user: UserProfile = {
    displayName:   authUser?.display_name || '',
    username:      authUser?.username     || '',
    email:         authUser?.email        || '',
    avatarInitial: (authUser?.display_name || authUser?.username || '?').charAt(0).toUpperCase(),
  }

  const updateProfile = async (updates: Partial<Pick<UserProfile, 'displayName' | 'username' | 'email'>>) => {
    await updateMe({
      display_name: updates.displayName,
      username:     updates.username,
      email:        updates.email,
    })
  }

  return (
    <UserContext.Provider value={{ user, isLoggedIn, updateProfile, login: () => {}, logout }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
