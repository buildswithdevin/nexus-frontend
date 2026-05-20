'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export interface UserProfile {
  displayName: string
  username: string
  email: string
  avatarInitial: string
}

interface UserContextValue {
  user: UserProfile
  isLoggedIn: boolean
  updateProfile: (updates: Partial<UserProfile>) => void
  login: (name: string, email: string) => void
  logout: () => void
}

const DEFAULT_USER: UserProfile = {
  displayName: 'Demo User',
  username: 'demouser',
  email: 'demo@nexus.app',
  avatarInitial: 'D',
}

const UserContext = createContext<UserContextValue>({
  user: DEFAULT_USER,
  isLoggedIn: false,
  updateProfile: () => {},
  login: () => {},
  logout: () => {},
})

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('nexus-user')
    const loggedIn = localStorage.getItem('nexus-logged-in')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {}
    }
    if (loggedIn === 'true') setIsLoggedIn(true)
  }, [])

  const updateProfile = (updates: Partial<UserProfile>) => {
    const next = { ...user, ...updates }
    if (updates.displayName) {
      next.avatarInitial = updates.displayName.charAt(0).toUpperCase()
    }
    setUser(next)
    localStorage.setItem('nexus-user', JSON.stringify(next))
  }

  const login = (name: string, email: string) => {
    const next: UserProfile = {
      displayName: name,
      username: name.toLowerCase().replace(/\s+/g, ''),
      email,
      avatarInitial: name.charAt(0).toUpperCase(),
    }
    setUser(next)
    setIsLoggedIn(true)
    localStorage.setItem('nexus-user', JSON.stringify(next))
    localStorage.setItem('nexus-logged-in', 'true')
  }

  const logout = () => {
    setUser(DEFAULT_USER)
    setIsLoggedIn(false)
    localStorage.removeItem('nexus-user')
    localStorage.removeItem('nexus-logged-in')
  }

  return (
    <UserContext.Provider value={{ user, isLoggedIn, updateProfile, login, logout }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
