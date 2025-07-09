'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface User {
  id: number
  username: string
  email: string
  role: string
}

interface AuthContextType {
  isAuthenticated: boolean
  setIsAuthenticated: (value: boolean) => void
  user: User | null
  setUser: (user: User | null) => void
  logout: () => void
}

// ✅ FIX: Add full default values in createContext
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  setIsAuthenticated: () => {},
  user: null,
  setUser: () => {},
  logout: () => {},
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null) // ✅ FIX: Add user state

  // ✅ Check session and load user
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/auth/check', {
          credentials: 'include',
        })
        const data = await res.json()
        setIsAuthenticated(data.authenticated)
        setUser(data.user || null)
      } catch (err) {
        console.error('Auth check failed', err)
        setIsAuthenticated(false)
        setUser(null)
      }
    }

    checkSession()

    const sync = (e: StorageEvent) => {
      if (e.key === 'auth-event') {
        checkSession()
      }
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  const logout = async () => {
    await fetch('http://localhost:8000/api/logout', {
      method: 'POST',
      credentials: 'include',
    })
    setIsAuthenticated(false)
    setUser(null)
    localStorage.setItem('auth-event', `logout-${Date.now()}`)
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, setIsAuthenticated, user, setUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}
