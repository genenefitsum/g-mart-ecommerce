import { useState } from 'react'
import { Eye, EyeOff, ShoppingBag } from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'
import { Link } from 'react-router-dom'

import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toErrorMessage } from '@/lib/errors'

export default function AuthScreen({ onSuccess }) {
  const { login, register, googleLogin, isLoading, error } = useAuth()
  const [mode, setMode] = useState('login')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [googleError, setGoogleError] = useState('')
  const [consentAccepted, setConsentAccepted] = useState(false)
  const [consentError, setConsentError] = useState('')

  const GOOGLE_SCRIPT_URL = 'https://accounts.google.com/gsi/client'
  const googleClientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim()

  const onSubmit = async (e) => {
    e.preventDefault()
    setConsentError('')

    if (mode === 'signup' && !consentAccepted) {
      setConsentError('Please agree to the Terms and Privacy Policy before creating an account.')
      return
    }

    const result =
      mode === 'login'
        ? await login({ email, password })
        : await register({ name, email, password, termsAndPrivacyAccepted: consentAccepted })

    if (result?.ok && typeof onSuccess === 'function') {
      onSuccess()
    }
  }

  const loadGoogleScript = () =>
    new Promise((resolve, reject) => {
      if (window.google?.accounts?.id) {
        resolve(window.google)
        return
      }

      const existing = document.querySelector('script[data-google-gsi="true"]')
      if (existing) {
        existing.addEventListener('load', () => resolve(window.google), { once: true })
        existing.addEventListener('error', () => reject(new Error('Failed to load Google Sign-In')), {
          once: true,
        })
        return
      }

      const script = document.createElement('script')
      script.src = GOOGLE_SCRIPT_URL
      script.async = true
      script.defer = true
      script.dataset.googleGsi = 'true'
      script.onload = () => resolve(window.google)
      script.onerror = () => reject(new Error('Failed to load Google Sign-In'))
      document.head.appendChild(script)
    })

  const onGoogleSignIn = async () => {
    setGoogleError('')

    if (mode === 'signup' && !consentAccepted) {
      setGoogleError('Please agree to the Terms and Privacy Policy before creating an account.')
      return
    }

    if (!googleClientId) {
      setGoogleError('Google sign-in is not configured for this app.')
      return
    }

    try {
      const google = await loadGoogleScript()

      if (!google?.accounts?.id) {
        setGoogleError('Google sign-in is currently unavailable.')
        return
      }

      google.accounts.id.cancel()
      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          const credential = String(response?.credential ?? '').trim()
          if (!credential) {
            setGoogleError('Google sign-in was cancelled.')
            return
          }

          const result = await googleLogin({
            credential,
            termsAndPrivacyAccepted: true,
          })
          if (result?.ok && typeof onSuccess === 'function') {
            onSuccess()
            return
          }

          setGoogleError('Google sign-in failed. Please try again.')
        },
        ux_mode: 'popup',
      })

      google.accounts.id.prompt((notification) => {
        if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
          setGoogleError('Google sign-in popup was blocked or unavailable. Please try again.')
        }
      })
    } catch {
      setGoogleError('Unable to start Google sign-in. Please try again.')
    }
  }

  return (
    <div className="w-full">
      <div className="text-center">
        <div className="inline-flex items-center justify-center gap-2 text-2xl font-extrabold tracking-tight text-gray-900">
          <ShoppingBag className="h-5 w-5 text-blue-600" />
          G-mart
        </div>
        <div className="mt-2 text-sm text-gray-500">
          {mode === 'login'
            ? 'Welcome back! Please sign in to continue.'
            : 'Create your account to start shopping.'}
        </div>
      </div>

      <div className="mt-6 w-full rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="text-center">
          <div className="text-base font-semibold text-gray-900">Account Access</div>
          <div className="mt-1 text-xs text-gray-500">Sign in or create an account to get started</div>
        </div>

        <div className="mt-5 flex gap-2 rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            className={
              'flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ' +
              (mode === 'login'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900')
            }
            onClick={() => setMode('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={
              'flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ' +
              (mode === 'signup'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900')
            }
            onClick={() => setMode('signup')}
          >
            Sign Up
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          {mode === 'signup' ? (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                required
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'login' ? 'Enter your password' : 'Create a password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={8}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-0 top-0 inline-flex h-9 w-9 items-center justify-center text-gray-500 transition hover:text-gray-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {mode === 'signup' ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <label className="flex items-start gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={(e) => {
                    setConsentAccepted(e.target.checked)
                    if (consentError) setConsentError('')
                  }}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="leading-6">
                  I agree to the{' '}
                  <Link to="/terms" target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:underline">
                    Terms and Conditions
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
            </div>
          ) : null}

          {consentError ? <div className="text-sm text-red-600">{consentError}</div> : null}
          {error ? <div className="text-sm text-red-600">{toErrorMessage(error, '')}</div> : null}
          {googleError ? <div className="text-sm text-red-600">{googleError}</div> : null}

          <Button
            type="submit"
            className="w-full bg-blue-600 text-white hover:bg-blue-700"
            disabled={isLoading || (mode === 'signup' && !consentAccepted)}
          >
            {isLoading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>

          <div className="pt-2">
            <div className="text-center text-[11px] uppercase tracking-wide text-gray-400">
              Or continue with
            </div>
            <Button
              type="button"
              variant="outline"
              className="mt-2 w-full"
              onClick={onGoogleSignIn}
              disabled={isLoading || (mode === 'signup' && !consentAccepted)}
            >
              <FcGoogle className="h-4 w-4" />
              Continue with Google
            </Button>
          </div>
        </form>
      </div>

      <div className="mt-5 text-center text-xs text-gray-500">
        By continuing, you agree to our{' '}
        <Link to="/terms" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-gray-700">
          Terms and Conditions
        </Link>{' '}
        and{' '}
        <Link to="/privacy" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-gray-700">
          Privacy Policy
        </Link>
        .
      </div>
    </div>
  )
}
