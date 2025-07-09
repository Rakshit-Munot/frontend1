'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not set in environment variables.')
}

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
  const [user, setUser] = useState<User | null>(null)

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
        // Optionally, show a notification to the user
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
    try {
      await fetch(`${API_URL}/api/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (err) {
      // Optionally, show a notification to the user
      console.error('Logout failed', err)
    }
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