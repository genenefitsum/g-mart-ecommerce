import { createContext, useContext, useEffect, useState } from 'react'
import {
  apiLogin,
  apiLogout,
  apiMe,
  apiRefresh,
  apiRegister,
  setAccessToken,
} from '@/lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [accessToken, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const setAccess = (token) => {
    setToken(token)
    setAccessToken(token)
  }

  const refreshSession = async () => {
    try {
      setError('')
      const data = await apiRefresh()
      if (!data?.ok || !data?.accessToken) throw new Error('Refresh failed')

      setAccess(data.accessToken)

      const me = await apiMe()
      if (!me?.ok) throw new Error('Failed to load user')

      setUser(me.user)
      return { ok: true }
    } catch {
      setUser(null)
      setAccess(null)
      return { ok: false }
    }
  }

  const login = async ({ email, password }) => {
    setIsLoading(true)
    try {
      setError('')
      const data = await apiLogin({ email, password })
      if (!data?.ok || !data?.accessToken) {
        throw new Error(data?.error || 'Login failed')
      }

      setAccess(data.accessToken)

      const me = await apiMe()
      if (!me?.ok) throw new Error('Failed to load user')

      setUser(me.user)
      return { ok: true }
    } catch (err) {
      setUser(null)
      setAccess(null)
      const message =
        err?.response?.data?.error ||
        err?.message ||
        'Login failed'
      setError(message)
      return { ok: false }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async ({ name, email, password }) => {
    setIsLoading(true)
    try {
      setError('')
      const data = await apiRegister({ name, email, password })
      if (!data?.ok || !data?.accessToken) {
        throw new Error(data?.error || 'Signup failed')
      }

      setAccess(data.accessToken)

      const me = await apiMe()
      if (!me?.ok) throw new Error('Failed to load user')

      setUser(me.user)
      return { ok: true }
    } catch (err) {
      setUser(null)
      setAccess(null)
      const message =
        err?.response?.data?.error ||
        err?.message ||
        'Signup failed'
      setError(message)
      return { ok: false }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      setError('')
      await apiLogout().catch(() => {})
    } finally {
      setUser(null)
      setAccess(null)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      setIsLoading(true)
      const result = await refreshSession()
      if (cancelled) return
      setIsLoading(false)
      if (!result.ok) {
        setError('')
      }
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        error,
        login,
        register,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
