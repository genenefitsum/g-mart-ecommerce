import { createContext, useContext, useEffect, useState } from 'react'
import {
  apiGoogleLogin,
  apiLogin,
  apiLogout,
  apiMe,
  apiRefresh,
  apiRegister,
  setAccessToken,
} from '@/lib/api'
import { toErrorMessage } from '@/lib/errors'

const AuthContext = createContext(null)
const AUTH_STORAGE_KEY = 'gmart_auth_v1'

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null

    const user = parsed.user && typeof parsed.user === 'object' ? parsed.user : null

    if (!user) return null
    return { user }
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [accessToken, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const setAccess = (token) => {
    setToken(token)
    setAccessToken(token)
  }

  const persistAuth = ({ user: nextUser }) => {
    if (!nextUser) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return
    }

    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        user: nextUser,
      }),
    )
  }

  const clearAuthState = () => {
    setUser(null)
    setAccess(null)
    localStorage.removeItem(AUTH_STORAGE_KEY)
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
      persistAuth({ user: me.user })
      return { ok: true }
    } catch {
      clearAuthState()
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

      if (data?.user) {
        setUser(data.user)
        persistAuth({ user: data.user })
        return { ok: true }
      }

      // Fallback: older servers may not return user.
      const me = await apiMe()
      if (!me?.ok) throw new Error('Failed to load user')
      setUser(me.user)
      persistAuth({ user: me.user })
      return { ok: true }
    } catch (err) {
      clearAuthState()
      setError(toErrorMessage(err, 'Login failed'))
      return { ok: false }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async ({ name, email, password, termsAndPrivacyAccepted }) => {
    setIsLoading(true)
    try {
      setError('')
      const data = await apiRegister({ name, email, password, termsAndPrivacyAccepted })
      if (!data?.ok || !data?.accessToken) {
        throw new Error(data?.error || 'Signup failed')
      }

      setAccess(data.accessToken)

      if (data?.user) {
        setUser(data.user)
        persistAuth({ user: data.user })
        return { ok: true }
      }

      const me = await apiMe()
      if (!me?.ok) throw new Error('Failed to load user')
      setUser(me.user)
      persistAuth({ user: me.user })
      return { ok: true }
    } catch (err) {
      clearAuthState()
      setError(toErrorMessage(err, 'Signup failed'))
      return { ok: false }
    } finally {
      setIsLoading(false)
    }
  }

  const googleLogin = async ({ credential, termsAndPrivacyAccepted }) => {
    setIsLoading(true)
    try {
      setError('')
      const data = await apiGoogleLogin({ credential, termsAndPrivacyAccepted })
      if (!data?.ok || !data?.accessToken) {
        throw new Error(data?.error || 'Google sign-in failed')
      }

      setAccess(data.accessToken)

      if (data?.user) {
        setUser(data.user)
        persistAuth({ user: data.user })
        return { ok: true }
      }

      const me = await apiMe()
      if (!me?.ok) throw new Error('Failed to load user')
      setUser(me.user)
      persistAuth({ user: me.user })
      return { ok: true }
    } catch (err) {
      clearAuthState()
      setError(toErrorMessage(err, 'Google sign-in failed'))
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
      clearAuthState()
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      setIsLoading(true)

      const storedAuth = readStoredAuth()
      if (storedAuth?.user) {
        setUser(storedAuth.user)
      }

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
        setUser,
        accessToken,
        isLoading,
        error,
        login,
        register,
        googleLogin,
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
