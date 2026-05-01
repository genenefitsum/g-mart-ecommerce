import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { useAuth } from '@/context/AuthContext'
import {
  apiChangePassword,
  apiDeleteAccount,
  apiListMyProducts,
  apiListOrders,
  apiSetPassword,
  apiUpdateMe,
} from '@/lib/api'
import { toErrorMessage } from '@/lib/errors'
import { formatBirr } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString()
}

function getProductId(value) {
  const raw = value?._id
  if (typeof raw === 'string') return raw.trim()
  if (raw && typeof raw === 'object' && typeof raw.$oid === 'string') return raw.$oid.trim()
  if (raw && typeof raw?.toString === 'function') {
    const text = String(raw.toString()).trim()
    if (text && text !== '[object Object]') return text
  }
  return ''
}

export default function Account({ onRequireAuth }) {
  const navigate = useNavigate()
  const { user, logout, setUser } = useAuth()

  const [name, setName] = useState(user?.name ?? '')
  const [profileStatus, setProfileStatus] = useState('')
  const [profileError, setProfileError] = useState('')
  const [profileSubmitting, setProfileSubmitting] = useState(false)

  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState('')

  const [myProducts, setMyProducts] = useState([])
  const [myProductsLoading, setMyProductsLoading] = useState(false)
  const [myProductsError, setMyProductsError] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)
  const [passwordStatus, setPasswordStatus] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const [deletePassword, setDeletePassword] = useState('')
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    setName(user?.name ?? '')
  }, [user?.name])

  const hasLocalPassword = Array.isArray(user?.authMethods)
    ? user.authMethods.includes('local')
    : true

  useEffect(() => {
    if (!user && typeof onRequireAuth === 'function') {
      onRequireAuth()
    }
  }, [onRequireAuth, user])

  useEffect(() => {
    let cancelled = false

    if (user) {
      setOrdersError('')
      setOrdersLoading(true)

      ;(async () => {
        try {
          const data = await apiListOrders()
          if (!data?.ok) throw new Error(data?.error || 'Failed to load orders')

          if (!cancelled) {
            setOrders(Array.isArray(data.orders) ? data.orders : [])
          }
        } catch (err) {
          if (!cancelled) {
            setOrdersError(toErrorMessage(err, 'Failed to load orders'))
          }
        } finally {
          if (!cancelled) {
            setOrdersLoading(false)
          }
        }
      })()
    }

    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    let cancelled = false

    if (user) {
      setMyProductsError('')
      setMyProductsLoading(true)

      ;(async () => {
        try {
          const data = await apiListMyProducts()
          if (!data?.ok) throw new Error(data?.error || 'Failed to load your products')

          if (!cancelled) {
            setMyProducts(Array.isArray(data.products) ? data.products : [])
          }
        } catch (err) {
          if (!cancelled) {
            setMyProductsError(toErrorMessage(err, 'Failed to load your products'))
          }
        } finally {
          if (!cancelled) {
            setMyProductsLoading(false)
          }
        }
      })()
    }

    return () => {
      cancelled = true
    }
  }, [user])

  const onSaveProfile = async (e) => {
    e.preventDefault()
    setProfileError('')
    setProfileStatus('')

    if (!user) {
      setProfileError('Please sign in to update your profile.')
      return
    }

    const trimmed = String(name ?? '').trim()
    if (trimmed.length < 2) {
      setProfileError('Name is too short.')
      return
    }

    setProfileSubmitting(true)
    try {
      const data = await apiUpdateMe({ name: trimmed })
      if (!data?.ok || !data?.user) throw new Error(data?.error || 'Failed to update profile')

      setUser(data.user)
      setProfileStatus('Profile updated.')
    } catch (err) {
      setProfileError(toErrorMessage(err, 'Failed to update profile'))
    } finally {
      setProfileSubmitting(false)
    }
  }

  const onChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordStatus('')

    if (!user) {
      setPasswordError('Please sign in to change password.')
      return
    }

    if (String(newPassword).length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }

    if (hasLocalPassword && !currentPassword) {
      setPasswordError('Please enter your current password.')
      return
    }

    setPasswordSubmitting(true)
    try {
      const data = hasLocalPassword
        ? await apiChangePassword({ currentPassword, newPassword })
        : await apiSetPassword({ newPassword })

      if (!data?.ok) throw new Error(data?.error || 'Failed to change password')

      if (data?.user) {
        setUser(data.user)
      }

      setPasswordStatus(
        hasLocalPassword
          ? 'Password changed. Please sign in again.'
          : 'Password set. You can now sign in with email and password.',
      )
      setCurrentPassword('')
      setNewPassword('')

      if (hasLocalPassword) {
        await logout()
        navigate('/')
      }
    } catch (err) {
      setPasswordError(toErrorMessage(err, 'Failed to change password'))
    } finally {
      setPasswordSubmitting(false)
    }
  }

  const onDeleteAccount = async (e) => {
    e.preventDefault()
    setDeleteError('')

    if (!user) {
      setDeleteError('Please sign in first.')
      return
    }

    if (!deletePassword) {
      setDeleteError('Password is required to delete your account.')
      return
    }

    const ok = window.confirm('Delete your account permanently? This cannot be undone.')
    if (!ok) return

    setDeleteSubmitting(true)
    try {
      const data = await apiDeleteAccount({ password: deletePassword })
      if (!data?.ok) throw new Error(data?.error || 'Failed to delete account')

      await logout()
      navigate('/')
    } catch (err) {
      setDeleteError(toErrorMessage(err, 'Failed to delete account'))
    } finally {
      setDeleteSubmitting(false)
    }
  }

  const onSignOut = async () => {
    await logout()
    navigate('/')
  }

  const onBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate('/')
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="mb-4">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft />
            Back
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Account</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to view your account and orders.</p>
        </div>

        <Card className="rounded-2xl border border-gray-200 p-5">
          <div className="text-sm text-gray-700">You’re not signed in.</div>
          <div className="mt-4">
            <Button
              type="button"
              onClick={() => {
                if (typeof onRequireAuth === 'function') onRequireAuth()
              }}
            >
              Sign in
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-4">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft />
          Back
        </Button>
      </div>

      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Account</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your profile and view your orders.</p>
        </div>
        <div className="flex items-center gap-2">
          {user?.role === 'admin' ? (
            <Button type="button" variant="outline" onClick={() => navigate('/admin')}>
              Admin
            </Button>
          ) : null}

          <Button type="button" variant="outline" onClick={onSignOut}>
            Sign out
          </Button>
        </div>
      </div>

      <div className="grid gap-5">
        <Card className="rounded-2xl border border-gray-200 p-5">
          <div className="text-base font-semibold text-gray-900">Profile</div>

          <div className="mt-3 text-sm text-gray-700">
            <div>
              <span className="text-gray-500">Email:</span> {user.email}
            </div>
          </div>

          <form onSubmit={onSaveProfile} className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="acc-name">Name</Label>
              <Input
                id="acc-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div className="sm:col-span-1 flex items-end">
              <Button type="submit" disabled={profileSubmitting}>
                {profileSubmitting ? 'Saving…' : 'Save'}
              </Button>
            </div>

            {profileError ? (
              <div className="sm:col-span-2 text-sm text-red-600">{profileError}</div>
            ) : null}
            {profileStatus ? (
              <div className="sm:col-span-2 text-sm text-green-700">{profileStatus}</div>
            ) : null}
          </form>
        </Card>

        <Card className="rounded-2xl border border-gray-200 p-5">
          <div className="text-base font-semibold text-gray-900">My Products</div>

          {myProductsLoading ? (
            <div className="mt-3 text-sm text-gray-600">Loading your products…</div>
          ) : myProductsError ? (
            <div className="mt-3 text-sm text-red-600">{myProductsError}</div>
          ) : myProducts.length === 0 ? (
            <div className="mt-3 text-sm text-gray-600">You haven’t added any products yet.</div>
          ) : (
            <div className="mt-4 grid gap-3">
              {myProducts.map((product) => (
                <div key={getProductId(product) || product.name} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-gray-900">{product.name}</div>
                    <div className="text-xs text-gray-500">{formatDate(product.createdAt)}</div>
                  </div>

                  <div className="mt-2 grid gap-1 text-sm text-gray-700">
                    <div>
                      <span className="text-gray-500">Product ID:</span> {getProductId(product) || 'N/A'}
                    </div>
                    <div>
                      <span className="text-gray-500">Category:</span> {product.category}
                    </div>
                    <div>
                      <span className="text-gray-500">Price:</span> {formatBirr(product.price ?? 0)}
                    </div>
                  </div>

                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!getProductId(product)}
                      onClick={() => navigate(`/product/${getProductId(product)}`)}
                    >
                      View product
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="rounded-2xl border border-gray-200 p-5">
          <div className="text-base font-semibold text-gray-900">Order History</div>

          {ordersLoading ? (
            <div className="mt-3 text-sm text-gray-600">Loading orders…</div>
          ) : ordersError ? (
            <div className="mt-3 text-sm text-red-600">{ordersError}</div>
          ) : orders.length === 0 ? (
            <div className="mt-3 text-sm text-gray-600">No orders yet.</div>
          ) : (
            <div className="mt-4 grid gap-3">
              {orders.map((o) => (
                <div key={o._id} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-gray-900">Order #{String(o._id).slice(-6)}</div>
                    <div className="text-xs text-gray-500">{formatDate(o.createdAt)}</div>
                  </div>

                  <div className="mt-2 grid gap-1 text-sm text-gray-700">
                    <div>
                      <span className="text-gray-500">Status:</span> {o.status}
                    </div>
                    <div>
                      <span className="text-gray-500">Items:</span> {Array.isArray(o.items) ? o.items.length : 0}
                    </div>
                    <div>
                      <span className="text-gray-500">Total:</span> {formatBirr(o.subtotal ?? 0)}
                    </div>
                    {o.payment?.method ? (
                      <div>
                        <span className="text-gray-500">Payment:</span> {o.payment.method}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="rounded-2xl border border-gray-200 p-5">
          <div className="text-base font-semibold text-gray-900">
            {hasLocalPassword ? 'Change Password' : 'Set Password'}
          </div>
          {!hasLocalPassword ? (
            <p className="mt-2 text-sm text-gray-600">
              You signed in with Google. Set a local password here so you can also sign in with email and password.
            </p>
          ) : null}
          <form onSubmit={onChangePassword} className="mt-4 grid gap-4 sm:grid-cols-2">
            {hasLocalPassword ? (
              <div className="space-y-2">
                <Label htmlFor="acc-current">Current password</Label>
                <Input
                  id="acc-current"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="acc-new">{hasLocalPassword ? 'New password' : 'Password'}</Label>
              <Input
                id="acc-new"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <Button type="submit" disabled={passwordSubmitting}>
                {passwordSubmitting
                  ? 'Updating…'
                  : hasLocalPassword
                    ? 'Update password'
                    : 'Set password'}
              </Button>
            </div>

            {passwordError ? (
              <div className="sm:col-span-2 text-sm text-red-600">{passwordError}</div>
            ) : null}
            {passwordStatus ? (
              <div className="sm:col-span-2 text-sm text-green-700">{passwordStatus}</div>
            ) : null}
          </form>
        </Card>

        <Card className="rounded-2xl border border-gray-200 p-5">
          <div className="text-base font-semibold text-gray-900">Delete Account</div>
          <p className="mt-2 text-sm text-gray-600">This permanently deletes your account.</p>

          <form onSubmit={onDeleteAccount} className="mt-4 grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="acc-del-pass">Password</Label>
              <Input
                id="acc-del-pass"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
            </div>

            <div>
              <Button type="submit" variant="destructive" disabled={deleteSubmitting}>
                {deleteSubmitting ? 'Deleting…' : 'Delete account'}
              </Button>
            </div>

            {deleteError ? <div className="text-sm text-red-600">{deleteError}</div> : null}
          </form>
        </Card>
      </div>
    </div>
  )
}
