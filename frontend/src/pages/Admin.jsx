import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { useAuth } from '@/context/AuthContext'
import {
  apiAdminGetSettings,
  apiAdminListOrders,
  apiAdminListUsers,
  apiAdminUpdateOrderStatus,
  apiAdminUpdateSettings,
  apiAdminUpdateUserRole,
} from '@/lib/api'
import { toErrorMessage } from '@/lib/errors'
import { formatBirr } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const USER_ROLES = ['buyer', 'seller', 'admin']
const ORDER_STATUSES = ['pending_payment', 'payment_submitted', 'processing', 'completed', 'cancelled']

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString()
}

function normalizeSettings(data) {
  const settings = data && typeof data === 'object' ? data : {}
  const paymentRecipient = settings.paymentRecipient && typeof settings.paymentRecipient === 'object'
    ? settings.paymentRecipient
    : {}
  const content = settings.content && typeof settings.content === 'object'
    ? settings.content
    : {}

  return {
    paymentRecipient: {
      telebirrPhone: String(paymentRecipient.telebirrPhone ?? '').trim(),
      bankName: String(paymentRecipient.bankName ?? '').trim(),
      bankAccountNumber: String(paymentRecipient.bankAccountNumber ?? '').trim(),
      bankAccountName: String(paymentRecipient.bankAccountName ?? '').trim(),
    },
    content: {
      storeName: String(content.storeName ?? 'G-mart').trim() || 'G-mart',
      supportEmail: String(content.supportEmail ?? '').trim(),
      supportPhone: String(content.supportPhone ?? '').trim(),
      bannerMessage: String(content.bannerMessage ?? '').trim(),
    },
  }
}

export default function Admin() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [appliedUserSearch, setAppliedUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('')
  const [pendingUserRoles, setPendingUserRoles] = useState({})
  const [savingUserId, setSavingUserId] = useState('')

  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('')
  const [pendingOrderStatuses, setPendingOrderStatuses] = useState({})
  const [savingOrderId, setSavingOrderId] = useState('')

  const [settings, setSettings] = useState(() => normalizeSettings())
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsError, setSettingsError] = useState('')
  const [settingsStatus, setSettingsStatus] = useState('')
  const [settingsSaving, setSettingsSaving] = useState(false)

  const isAdmin = String(user?.role ?? '').toLowerCase() === 'admin'

  const onBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/')
  }

  const loadUsers = useCallback(async () => {
    setUsersLoading(true)
    setUsersError('')

    try {
      const data = await apiAdminListUsers({
        q: appliedUserSearch || undefined,
        role: userRoleFilter || undefined,
      })

      if (!data?.ok) {
        throw new Error(data?.error || 'Failed to load users')
      }

      const list = Array.isArray(data.users) ? data.users : []
      setUsers(list)
      setPendingUserRoles(
        Object.fromEntries(list.map((item) => [item.id, String(item.role ?? 'buyer')])),
      )
    } catch (err) {
      setUsersError(toErrorMessage(err, 'Failed to load users'))
    } finally {
      setUsersLoading(false)
    }
  }, [appliedUserSearch, userRoleFilter])

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true)
    setOrdersError('')

    try {
      const data = await apiAdminListOrders({
        status: orderStatusFilter || undefined,
      })

      if (!data?.ok) {
        throw new Error(data?.error || 'Failed to load orders')
      }

      const list = Array.isArray(data.orders) ? data.orders : []
      setOrders(list)
      setPendingOrderStatuses(
        Object.fromEntries(list.map((item) => [String(item._id), String(item.status ?? 'pending_payment')])),
      )
    } catch (err) {
      setOrdersError(toErrorMessage(err, 'Failed to load orders'))
    } finally {
      setOrdersLoading(false)
    }
  }, [orderStatusFilter])

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true)
    setSettingsError('')

    try {
      const data = await apiAdminGetSettings()
      if (!data?.ok) throw new Error(data?.error || 'Failed to load settings')
      setSettings(normalizeSettings(data.settings))
    } catch (err) {
      setSettingsError(toErrorMessage(err, 'Failed to load settings'))
    } finally {
      setSettingsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    loadUsers()
  }, [isAdmin, loadUsers])

  useEffect(() => {
    if (!isAdmin) return
    loadOrders()
  }, [isAdmin, loadOrders])

  useEffect(() => {
    if (!isAdmin) return
    loadSettings()
  }, [isAdmin, loadSettings])

  const usersCount = useMemo(() => users.length, [users.length])
  const ordersCount = useMemo(() => orders.length, [orders.length])

  const onSearchUsers = async (e) => {
    e.preventDefault()

    const nextSearch = userSearch.trim()
    if (nextSearch !== appliedUserSearch) {
      setAppliedUserSearch(nextSearch)
      return
    }

    await loadUsers()
  }

  const onSaveUserRole = async (targetUserId) => {
    const nextRole = String(pendingUserRoles[targetUserId] ?? '').trim().toLowerCase()
    if (!USER_ROLES.includes(nextRole)) {
      setUsersError('Please select a valid user role.')
      return
    }

    setSavingUserId(targetUserId)
    setUsersError('')
    try {
      const data = await apiAdminUpdateUserRole(targetUserId, nextRole)
      if (!data?.ok) throw new Error(data?.error || 'Failed to update user role')
      await loadUsers()
    } catch (err) {
      setUsersError(toErrorMessage(err, 'Failed to update user role'))
    } finally {
      setSavingUserId('')
    }
  }

  const onSaveOrderStatus = async (orderId) => {
    const nextStatus = String(pendingOrderStatuses[orderId] ?? '').trim().toLowerCase()
    if (!ORDER_STATUSES.includes(nextStatus)) {
      setOrdersError('Please select a valid order status.')
      return
    }

    setSavingOrderId(orderId)
    setOrdersError('')
    try {
      const data = await apiAdminUpdateOrderStatus(orderId, nextStatus)
      if (!data?.ok) throw new Error(data?.error || 'Failed to update order status')
      await loadOrders()
    } catch (err) {
      setOrdersError(toErrorMessage(err, 'Failed to update order status'))
    } finally {
      setSavingOrderId('')
    }
  }

  const onSaveSettings = async (e) => {
    e.preventDefault()
    setSettingsError('')
    setSettingsStatus('')
    setSettingsSaving(true)

    try {
      const data = await apiAdminUpdateSettings({
        paymentRecipient: settings.paymentRecipient,
        content: settings.content,
      })

      if (!data?.ok) throw new Error(data?.error || 'Failed to update settings')

      setSettings(normalizeSettings(data.settings))
      setSettingsStatus('Settings updated.')
    } catch (err) {
      setSettingsError(toErrorMessage(err, 'Failed to update settings'))
    } finally {
      setSettingsSaving(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="mb-4">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft />
            Back
          </Button>
        </div>

        <Card className="rounded-2xl border border-gray-200 p-5">
          <div className="text-base font-semibold text-gray-900">Admin Access Required</div>
          <p className="mt-2 text-sm text-gray-600">
            This page is only available to administrator accounts.
          </p>
          <div className="mt-4">
            <Button type="button" onClick={() => navigate('/account')}>
              Go to account
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-4">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft />
          Back
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Admin</h1>
        <p className="mt-1 text-sm text-gray-500">Manage users, orders, and site settings.</p>
      </div>

      <div className="grid gap-5">
        <Card className="rounded-2xl border border-gray-200 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-gray-900">Users</div>
              <div className="text-sm text-gray-500">Total loaded: {usersCount}</div>
            </div>
          </div>

          <form onSubmit={onSearchUsers} className="mt-4 grid gap-3 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <Input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name or email"
              />
            </div>
            <div>
              <select
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
              >
                <option value="">All roles</option>
                {USER_ROLES.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div>
              <Button type="submit" className="w-full" disabled={usersLoading}>
                {usersLoading ? 'Loading…' : 'Refresh'}
              </Button>
            </div>
          </form>

          {usersError ? <div className="mt-3 text-sm text-red-600">{usersError}</div> : null}

          {!usersLoading && users.length === 0 ? (
            <div className="mt-4 text-sm text-gray-600">No users found.</div>
          ) : (
            <div className="mt-4 grid gap-3">
              {users.map((item) => {
                const itemId = String(item.id)
                const pendingRole = String(pendingUserRoles[itemId] ?? item.role ?? 'buyer')
                const isSaving = savingUserId === itemId

                return (
                  <div key={itemId} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.email}</div>
                      </div>
                      <div className="text-xs text-gray-500">{formatDate(item.createdAt)}</div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <select
                        className="h-9 min-w-[130px] rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={pendingRole}
                        onChange={(e) => {
                          const value = e.target.value
                          setPendingUserRoles((current) => ({ ...current, [itemId]: value }))
                        }}
                      >
                        {USER_ROLES.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isSaving || pendingRole === item.role}
                        onClick={() => onSaveUserRole(itemId)}
                      >
                        {isSaving ? 'Saving…' : 'Save role'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card className="rounded-2xl border border-gray-200 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-gray-900">Orders</div>
              <div className="text-sm text-gray-500">Total loaded: {ordersCount}</div>
            </div>
            <div className="w-full sm:w-auto">
              <select
                className="h-9 w-full min-w-[180px] rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
              >
                <option value="">All statuses</option>
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          {ordersError ? <div className="mt-3 text-sm text-red-600">{ordersError}</div> : null}

          {ordersLoading ? (
            <div className="mt-4 text-sm text-gray-600">Loading orders…</div>
          ) : orders.length === 0 ? (
            <div className="mt-4 text-sm text-gray-600">No orders found.</div>
          ) : (
            <div className="mt-4 grid gap-3">
              {orders.map((item) => {
                const itemId = String(item._id)
                const pendingStatus = String(pendingOrderStatuses[itemId] ?? item.status ?? 'pending_payment')
                const isSaving = savingOrderId === itemId

                return (
                  <div key={itemId} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-gray-900">Order #{itemId.slice(-6)}</div>
                      <div className="text-xs text-gray-500">{formatDate(item.createdAt)}</div>
                    </div>

                    <div className="mt-2 grid gap-1 text-sm text-gray-700">
                      <div>
                        <span className="text-gray-500">Buyer:</span> {String(item.userId ?? '').slice(-8)}
                      </div>
                      <div>
                        <span className="text-gray-500">Items:</span> {Array.isArray(item.items) ? item.items.length : 0}
                      </div>
                      <div>
                        <span className="text-gray-500">Total:</span> {formatBirr(item.subtotal ?? 0)}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <select
                        className="h-9 min-w-[220px] rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={pendingStatus}
                        onChange={(e) => {
                          const value = e.target.value
                          setPendingOrderStatuses((current) => ({ ...current, [itemId]: value }))
                        }}
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isSaving || pendingStatus === item.status}
                        onClick={() => onSaveOrderStatus(itemId)}
                      >
                        {isSaving ? 'Saving…' : 'Save status'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card className="rounded-2xl border border-gray-200 p-5">
          <div className="text-base font-semibold text-gray-900">Site Settings</div>
          <p className="mt-1 text-sm text-gray-500">Update checkout recipient and basic store content.</p>

          {settingsLoading ? (
            <div className="mt-4 text-sm text-gray-600">Loading settings…</div>
          ) : (
            <form onSubmit={onSaveSettings} className="mt-4 grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="admin-telebirr">Telebirr Phone</Label>
                  <Input
                    id="admin-telebirr"
                    value={settings.paymentRecipient.telebirrPhone}
                    onChange={(e) => {
                      const value = e.target.value
                      setSettings((current) => ({
                        ...current,
                        paymentRecipient: { ...current.paymentRecipient, telebirrPhone: value },
                      }))
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-bank-name">Bank Name</Label>
                  <Input
                    id="admin-bank-name"
                    value={settings.paymentRecipient.bankName}
                    onChange={(e) => {
                      const value = e.target.value
                      setSettings((current) => ({
                        ...current,
                        paymentRecipient: { ...current.paymentRecipient, bankName: value },
                      }))
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-bank-number">Bank Account Number</Label>
                  <Input
                    id="admin-bank-number"
                    value={settings.paymentRecipient.bankAccountNumber}
                    onChange={(e) => {
                      const value = e.target.value
                      setSettings((current) => ({
                        ...current,
                        paymentRecipient: { ...current.paymentRecipient, bankAccountNumber: value },
                      }))
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-bank-account-name">Bank Account Name</Label>
                  <Input
                    id="admin-bank-account-name"
                    value={settings.paymentRecipient.bankAccountName}
                    onChange={(e) => {
                      const value = e.target.value
                      setSettings((current) => ({
                        ...current,
                        paymentRecipient: { ...current.paymentRecipient, bankAccountName: value },
                      }))
                    }}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="admin-store-name">Store Name</Label>
                  <Input
                    id="admin-store-name"
                    value={settings.content.storeName}
                    onChange={(e) => {
                      const value = e.target.value
                      setSettings((current) => ({
                        ...current,
                        content: { ...current.content, storeName: value },
                      }))
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-support-email">Support Email</Label>
                  <Input
                    id="admin-support-email"
                    value={settings.content.supportEmail}
                    onChange={(e) => {
                      const value = e.target.value
                      setSettings((current) => ({
                        ...current,
                        content: { ...current.content, supportEmail: value },
                      }))
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-support-phone">Support Phone</Label>
                  <Input
                    id="admin-support-phone"
                    value={settings.content.supportPhone}
                    onChange={(e) => {
                      const value = e.target.value
                      setSettings((current) => ({
                        ...current,
                        content: { ...current.content, supportPhone: value },
                      }))
                    }}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="admin-banner">Banner Message</Label>
                  <Input
                    id="admin-banner"
                    value={settings.content.bannerMessage}
                    onChange={(e) => {
                      const value = e.target.value
                      setSettings((current) => ({
                        ...current,
                        content: { ...current.content, bannerMessage: value },
                      }))
                    }}
                  />
                </div>
              </div>

              {settingsError ? <div className="text-sm text-red-600">{settingsError}</div> : null}
              {settingsStatus ? <div className="text-sm text-green-700">{settingsStatus}</div> : null}

              <div>
                <Button type="submit" disabled={settingsSaving}>
                  {settingsSaving ? 'Saving…' : 'Save settings'}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
