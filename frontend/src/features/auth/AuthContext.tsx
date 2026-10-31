import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { apiClient } from '@/services/api'
import type { AuthResponse, UserDto, ApiResponse } from '@/types/auth'

interface AuthContextType {
  user: UserDto | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

interface RegisterData {
  email: string
  password: string
  displayName: string
  collegeSlug: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = async () => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', { email, password })
    const { token: newToken, user: newUser } = response.data.data
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
  }

  const register = async (data: RegisterData) => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data)
    const { token: newToken, user: newUser } = response.data.data
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete apiClient.defaults.headers.common['Authorization']
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}