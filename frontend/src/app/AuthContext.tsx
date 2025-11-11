'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { User as DashboardUser, UserRole } from './Equipments/types/dashboard'

const API_URL = process.env.NEXT_PUBLIC_API_URL

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not set in environment variables.')
}

interface User extends Omit<DashboardUser, 'role'> {
  role: UserRole
}

interface AuthContextType {
  isAuthenticated: boolean
  loader: boolean
  user: User | null
  setUser: (user: User | null) => void
  setIsAuthenticated: (value: boolean) => void
  // FIX: Replaced 'any' with a safe and specific type
  login: (credentials: Record<string, string>) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  loader: true,
  user: null,
  setUser: () => {},
  setIsAuthenticated: () => {},
  login: async () => false,
  logout: () => {},
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loader, setLoader] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/check`, {
          credentials: 'include',
        })
        if (res.ok) {
          const data: { authenticated: boolean; user: User | null } = await res.json()
          setIsAuthenticated(data.authenticated)
          setUser(data.user || null)
        } else {
          setIsAuthenticated(false)
          setUser(null)
        }
      } catch (err) {
        console.error('Auth check failed', err)
        setIsAuthenticated(false)
        setUser(null)
      } finally {
        setLoader(false)
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

  // ✅ Login function that updates context immediately
  // FIX: Replaced 'any' with a safe and specific type
  const login = async (credentials: Record<string, string>): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      })

      if (!res.ok) return false

      const data: { user: User } = await res.json()
      setUser(data.user)          // immediate update
      setIsAuthenticated(true)      // immediate update
      localStorage.setItem('auth-event', `login-${Date.now()}`)
      return true
    } catch (err) {
      console.error('Login failed', err)
      return false
    }
  }

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (err) {
      console.error('Logout failed', err)
    }
    setIsAuthenticated(false)
    setUser(null)
    localStorage.setItem('auth-event', `logout-${Date.now()}`)
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, loader, user, setUser, setIsAuthenticated, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}