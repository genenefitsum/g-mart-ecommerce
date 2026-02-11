import { useState } from 'react'
import { ShoppingBag } from 'lucide-react'

import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AuthScreen({ onSuccess }) {
  const { login, register, isLoading, error } = useAuth()
  const [mode, setMode] = useState('login')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()

    const result =
      mode === 'login'
        ? await login({ email, password })
        : await register({ name, email, password })

    if (result?.ok && typeof onSuccess === 'function') {
      onSuccess()
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
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={8}
            />
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700" disabled={isLoading}>
            {isLoading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Sign Up'}
          </Button>

          <div className="pt-2">
            <div className="text-center text-[11px] uppercase tracking-wide text-gray-400">
              Or continue with
            </div>
            <Button type="button" variant="outline" className="mt-2 w-full" disabled>
              Continue with Google
            </Button>
          </div>
        </form>
      </div>

      <div className="mt-5 text-center text-xs text-gray-500">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </div>
    </div>
  )
}
