import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShoppingBag } from 'lucide-react'

export default function AuthScreen() {
  const { login, register, isLoading, error } = useAuth()
  const [mode, setMode] = useState('login')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()

    if (mode === 'login') {
      await login({ email, password })
      return
    }

    await register({ name, email, password })
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[520px] flex-col items-center justify-center px-6 py-10">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center gap-2 text-2xl font-extrabold tracking-tight text-foreground">
            <ShoppingBag className="h-5 w-5 text-blue-600" />
            G-mart
          </div>
          <div className="mt-2 text-sm text-muted-foreground">Welcome back! Please sign in to continue.</div>
        </div>

        <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="text-center">
            <div className="text-base font-semibold text-card-foreground">Account Access</div>
            <div className="mt-1 text-xs text-muted-foreground">Sign in or create an account to get started</div>
          </div>

          <div className="mt-5 flex gap-2 rounded-xl bg-muted p-1">
            <button
              type="button"
              className={
                "flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition " +
                (mode === 'login' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')
              }
              onClick={() => setMode('login')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={
                "flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition " +
                (mode === 'signup' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')
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

            {error ? <div className="text-sm text-destructive">{error}</div> : null}

            <Button
              type="submit"
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Sign Up'}
            </Button>

            <div className="pt-2">
              <div className="text-center text-[11px] uppercase tracking-wide text-muted-foreground">
                Or continue with
              </div>
              <Button type="button" variant="outline" className="mt-2 w-full" disabled>
                Continue with Google
              </Button>
            </div>
          </form>
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </div>
      </div>
    </div>
  )
}
