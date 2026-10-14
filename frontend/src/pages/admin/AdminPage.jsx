import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, NavLink, Outlet, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  ChevronRight,
  Clock3,
  LayoutDashboard,
  Package,
  RefreshCcw,
  Settings,
  ShoppingCart,
  Users,
} from 'lucide-react'

import { useAuth } from '@/context/AuthContext'
import {
  apiDeleteProduct,
  apiAdminGetOrder,
  apiAdminGetSettings,
  apiAdminGetSummary,
  apiAdminListProducts,
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
const ADMIN_NAV_ITEMS = [
  { to: '', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: 'users', label: 'Users', icon: Users },
  { to: 'orders', label: 'Orders', icon: ShoppingCart },
  { to: 'products', label: 'Products', icon: Package },
  { to: 'settings', label: 'Settings', icon: Settings },
]

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}

function formatPlainNumber(value) {
  const number = Number(value ?? 0)
  if (!Number.isFinite(number)) return '0'
  return new Intl.NumberFormat().format(number)
}

function humanizeStatus(value) {
  return String(value ?? '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
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
    legal: {
      companyName: String(settings.legal?.companyName ?? 'G-mart E-Commerce PLC').trim() || 'G-mart E-Commerce PLC',
      registeredAddress: String(settings.legal?.registeredAddress ?? 'Bole Sub-City, Addis Ababa, Ethiopia').trim() || 'Bole Sub-City, Addis Ababa, Ethiopia',
      registrationNumber: String(settings.legal?.registrationNumber ?? 'ET-MTR-2024-00918').trim(),
      taxId: String(settings.legal?.taxId ?? 'TIN-008291823').trim(),
      legalEmail: String(settings.legal?.legalEmail ?? 'gmartofficial@gmail.com').trim() || 'gmartofficial@gmail.com',
      effectiveDate: String(settings.legal?.effectiveDate ?? 'October 14, 2026').trim() || 'October 14, 2026',
      termsVersion: String(settings.legal?.termsVersion ?? '1.0').trim() || '1.0',
      privacyVersion: String(settings.legal?.privacyVersion ?? '1.0').trim() || '1.0',
      returnWindowDays: Number.isFinite(Number(settings.legal?.returnWindowDays)) ? Number(settings.legal.returnWindowDays) : 7,
    },
  }
}

function isAdminUser(user) {
  return String(user?.role ?? '').toLowerCase() === 'admin' || Boolean(user?.isPermanentAdmin)
}

function statusTone(status) {
  switch (String(status ?? '').toLowerCase()) {
    case 'pending_payment':
      return 'border-amber-200 bg-amber-50 text-amber-800'
    case 'payment_submitted':
      return 'border-sky-200 bg-sky-50 text-sky-800'
    case 'processing':
      return 'border-orange-200 bg-orange-50 text-orange-800'
    case 'completed':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800'
    case 'cancelled':
      return 'border-rose-200 bg-rose-50 text-rose-800'
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700'
  }
}

function roleTone(role) {
  switch (String(role ?? '').toLowerCase()) {
    case 'admin':
      return 'border-violet-200 bg-violet-50 text-violet-800'
    case 'seller':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800'
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700'
  }
}

function metricTone(index) {
  const tones = [
    'from-slate-950 to-slate-700',
    'from-amber-500 to-orange-500',
    'from-sky-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-violet-500 to-fuchsia-500',
  ]
  return tones[index % tones.length]
}

function AdminShell() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-slate-100/40" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1720px] flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/78 backdrop-blur-xl shadow-[0_1px_0_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Admin control center</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Operational dashboard</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" onClick={() => navigate('/')} className="rounded-full">
                Back to store
              </Button>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
                {user?.name || user?.email || 'Admin'}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200/70 px-4 py-3 sm:px-6 lg:hidden">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {ADMIN_NAV_ITEMS.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to || 'overview-mobile'}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => [
                      'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition',
                      isActive
                        ? 'border-slate-950 bg-slate-950 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
                    ].join(' ')}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </NavLink>
                )
              })}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function SectionHeader({ title, description, actions }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

function MetricCard({ label, value, note, icon: Icon, index = 0 }) {
  return (
    <Card className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className={`h-1.5 bg-gradient-to-r ${metricTone(index)}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-slate-500">{label}</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</div>
          </div>
          {Icon ? (
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
              <Icon className="h-5 w-5" />
            </div>
          ) : null}
        </div>
        {note ? <div className="mt-4 text-sm text-slate-500">{note}</div> : null}
      </div>
    </Card>
  )
}

function EmptyState({ title, description, icon: Icon }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
      {Icon ? (
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
      <div className="mt-4 text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-500">{description}</div>
    </div>
  )
}

function AdminOverviewPage() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadSummary = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await apiAdminGetSummary()
      if (!data?.ok) throw new Error(data?.error || 'Failed to load admin summary')
      setSummary(data.summary ?? null)
    } catch (err) {
      setError(toErrorMessage(err, 'Failed to load admin summary'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  const counts = summary?.counts ?? {}
  const recentOrders = Array.isArray(summary?.recentOrders) ? summary.recentOrders : []
  const recentProducts = Array.isArray(summary?.recentProducts) ? summary.recentProducts : []

  const attentionItems = [
    {
      label: 'Pending payments',
      value: counts.pendingPayment ?? 0,
      action: () => navigate('orders'),
    },
    {
      label: 'Submitted proofs',
      value: counts.paymentSubmitted ?? 0,
      action: () => navigate('orders'),
    },
    {
      label: 'Processing orders',
      value: counts.processing ?? 0,
      action: () => navigate('orders'),
    },
    {
      label: 'Seller products',
      value: counts.sellerProducts ?? 0,
      action: () => navigate('products'),
    },
  ]

  return (
    <div className="grid gap-6 xl:gap-8">
      <SectionHeader
        title="Overview"
        description="Track the health of the store, jump into active work, and spot what needs attention next."
        actions={(
          <>
            <Button type="button" variant="outline" onClick={loadSummary} disabled={loading}>
              <RefreshCcw className="h-4 w-4" />
              {loading ? 'Refreshing…' : 'Refresh'}
            </Button>
            <Button type="button" onClick={() => navigate('orders')}>
              Review orders
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      />

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Revenue" value={formatBirr(counts.revenueTotal ?? 0)} note="Total order value" icon={BarChart3} index={0} />
        <MetricCard label="Orders" value={formatPlainNumber(counts.orders ?? 0)} note="All tracked orders" icon={ShoppingCart} index={1} />
        <MetricCard label="Users" value={formatPlainNumber(counts.users ?? 0)} note="Registered accounts" icon={Users} index={2} />
        <MetricCard label="Products" value={formatPlainNumber(counts.products ?? 0)} note="Catalog size" icon={Package} index={3} />
        <MetricCard label="Pending proofs" value={formatPlainNumber(counts.paymentSubmitted ?? 0)} note="Manual review queue" icon={Clock3} index={4} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-slate-950">Attention queue</div>
                <div className="mt-1 text-sm text-slate-500">High-priority items for the next admin pass.</div>
              </div>
            </div>
          </div>
          <div className="grid gap-3 p-6 sm:grid-cols-2">
            {attentionItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
              >
                <div className="text-sm text-slate-500">{item.label}</div>
                <div className="mt-2 text-2xl font-semibold text-slate-950">{formatPlainNumber(item.value)}</div>
                <div className="mt-2 flex items-center gap-1 text-sm font-medium text-slate-600 group-hover:text-slate-950">
                  Open section
                  <ChevronRight className="h-4 w-4" />
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <div className="text-base font-semibold text-slate-950">Quick links</div>
            <div className="mt-1 text-sm text-slate-500">Move directly to the work you need most often.</div>
          </div>
          <div className="grid gap-2 p-6">
            {[
              { label: 'Users', to: 'users' },
              { label: 'Orders', to: 'orders' },
              { label: 'Products', to: 'products' },
              { label: 'Settings', to: 'settings' },
            ].map((item) => (
              <Button key={item.label} type="button" variant="outline" className="justify-between rounded-2xl" onClick={() => navigate(item.to)}>
                <span>{item.label}</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <div className="text-base font-semibold text-slate-950">Recent orders</div>
            <div className="mt-1 text-sm text-slate-500">Latest order activity with direct entry into the review flow.</div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-sm text-slate-500">Loading overview…</div>
            ) : recentOrders.length === 0 ? (
              <EmptyState
                title="No recent orders"
                description="When new orders arrive, they will appear here."
                icon={ShoppingCart}
              />
            ) : (
              <div className="grid gap-3">
                {recentOrders.map((order) => {
                  const buyerName = String(order?.buyer?.name ?? '').trim() || 'Unknown buyer'
                  const buyerEmail = String(order?.buyer?.email ?? '').trim()
                  return (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => navigate(`orders/${order.id}`)}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300 hover:bg-white"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold text-slate-950">Order #{String(order.id).slice(-6)}</div>
                          <div className="mt-1 text-xs text-slate-500">{buyerName}{buyerEmail ? ` • ${buyerEmail}` : ''}</div>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusTone(order.status)}`}>
                          {humanizeStatus(order.status)}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                        <span>{formatPlainNumber(order.itemCount ?? 0)} items</span>
                        <span>{formatBirr(order.subtotal ?? 0)}</span>
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </Card>

        <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <div className="text-base font-semibold text-slate-950">Recent products</div>
            <div className="mt-1 text-sm text-slate-500">Newest catalog items visible to the admin team.</div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-sm text-slate-500">Loading overview…</div>
            ) : recentProducts.length === 0 ? (
              <EmptyState
                title="No recent products"
                description="New product submissions will appear here."
                icon={Package}
              />
            ) : (
              <div className="grid gap-3">
                {recentProducts.map((product) => {
                  const sellerName = String(product?.seller?.name ?? '').trim() || 'Unknown seller'
                  const sellerEmail = String(product?.seller?.email ?? '').trim()
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => navigate('products')}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300 hover:bg-white"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold text-slate-950">{product.name}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {product.category} • {sellerName}{sellerEmail ? ` • ${sellerEmail}` : ''}
                          </div>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${product.isAdminProduct ? 'border-slate-200 bg-slate-100 text-slate-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
                          {product.isAdminProduct ? 'Admin product' : 'Seller product'}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                        <span>{formatBirr(product.price ?? 0)}</span>
                        <span>{formatDate(product.createdAt)}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [appliedUserSearch, setAppliedUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('')
  const [pendingUserRoles, setPendingUserRoles] = useState({})
  const [savingUserId, setSavingUserId] = useState('')

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
      setPendingUserRoles(Object.fromEntries(list.map((item) => [item.id, String(item.role ?? 'buyer')])))
    } catch (err) {
      setUsersError(toErrorMessage(err, 'Failed to load users'))
    } finally {
      setUsersLoading(false)
    }
  }, [appliedUserSearch, userRoleFilter])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const onSearchUsers = async (event) => {
    event.preventDefault()

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

  return (
    <div className="grid gap-6">
      <SectionHeader
        title="Users"
        description="Search accounts, update roles, and keep access aligned with the team structure."
        actions={(
          <Button type="button" variant="outline" onClick={loadUsers} disabled={usersLoading}>
            <RefreshCcw className="h-4 w-4" />
            {usersLoading ? 'Refreshing…' : 'Refresh'}
          </Button>
        )}
      />

      <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="text-base font-semibold text-slate-950">User directory</div>
          <div className="mt-1 text-sm text-slate-500">Accounts loaded: {formatPlainNumber(users.length)}</div>
        </div>

        <form onSubmit={onSearchUsers} className="grid gap-3 border-b border-slate-100 p-6 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Search</label>
            <Input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search by name or email"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Role</label>
            <select
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
            >
              <option value="">All roles</option>
              {USER_ROLES.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full" disabled={usersLoading}>
              {usersLoading ? 'Loading…' : 'Refresh'}
            </Button>
          </div>
        </form>

        {usersError ? <div className="px-6 pt-4 text-sm text-rose-600">{usersError}</div> : null}

        <div className="p-6">
          {!usersLoading && users.length === 0 ? (
            <EmptyState
              title="No users found"
              description="Adjust the search or role filter to reveal more accounts."
              icon={Users}
            />
          ) : (
            <div className="grid gap-3">
              {users.map((item) => {
                const itemId = String(item.id)
                const pendingRole = String(pendingUserRoles[itemId] ?? item.role ?? 'buyer')
                const isSaving = savingUserId === itemId

                return (
                  <div key={itemId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-semibold text-slate-950">{item.name}</div>
                          {item.isPermanentAdmin ? (
                            <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-800">
                              Permanent admin
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">{item.email}</div>
                      </div>
                      <div className="text-xs text-slate-500">Joined {formatDate(item.createdAt)}</div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <select
                        className="h-10 min-w-[160px] rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
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
                      <span className={`rounded-full border px-3 py-1 text-xs font-medium ${roleTone(item.role)}`}>
                        {item.role}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

function AdminOrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('')
  const [pendingOrderStatuses, setPendingOrderStatuses] = useState({})
  const [savingOrderId, setSavingOrderId] = useState('')

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
      setPendingOrderStatuses(Object.fromEntries(list.map((item) => [String(item._id), String(item.status ?? 'pending_payment')])))
    } catch (err) {
      setOrdersError(toErrorMessage(err, 'Failed to load orders'))
    } finally {
      setOrdersLoading(false)
    }
  }, [orderStatusFilter])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

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

  return (
    <div className="grid gap-6">
      <SectionHeader
        title="Orders"
        description="Review the queue, change statuses, and open the detail view when a manual check is needed."
        actions={(
          <Button type="button" variant="outline" onClick={loadOrders} disabled={ordersLoading}>
            <RefreshCcw className="h-4 w-4" />
            {ordersLoading ? 'Refreshing…' : 'Refresh'}
          </Button>
        )}
      />

      <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-slate-950">Order queue</div>
              <div className="mt-1 text-sm text-slate-500">Loaded orders: {formatPlainNumber(orders.length)}</div>
            </div>
            <div className="w-full sm:w-auto">
              <select
                className="h-10 w-full min-w-[220px] rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
              >
                <option value="">All statuses</option>
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>{humanizeStatus(status)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {ordersError ? <div className="px-6 pt-4 text-sm text-rose-600">{ordersError}</div> : null}

        <div className="p-6">
          {ordersLoading ? (
            <div className="text-sm text-slate-500">Loading orders…</div>
          ) : orders.length === 0 ? (
            <EmptyState
              title="No orders found"
              description="Try a different status filter or wait for new activity."
              icon={ShoppingCart}
            />
          ) : (
            <div className="grid gap-3">
              {orders.map((item) => {
                const itemId = String(item._id)
                const pendingStatus = String(pendingOrderStatuses[itemId] ?? item.status ?? 'pending_payment')
                const isSaving = savingOrderId === itemId

                return (
                  <div key={itemId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-950">Order #{itemId.slice(-6)}</div>
                        <div className="mt-1 text-xs text-slate-500">Buyer {String(item.userId ?? '').slice(-8)}</div>
                      </div>
                      <div className="text-xs text-slate-500">{formatDate(item.createdAt)}</div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                      <span>{formatPlainNumber(Array.isArray(item.items) ? item.items.length : 0)} items</span>
                      <span>{formatBirr(item.subtotal ?? 0)}</span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusTone(item.status)}`}>
                        {humanizeStatus(item.status)}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <select
                        className="h-10 min-w-[220px] rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
                        value={pendingStatus}
                        onChange={(e) => {
                          const value = e.target.value
                          setPendingOrderStatuses((current) => ({ ...current, [itemId]: value }))
                        }}
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>{humanizeStatus(status)}</option>
                        ))}
                      </select>
                      <Button type="button" variant="outline" disabled={isSaving || pendingStatus === item.status} onClick={() => onSaveOrderStatus(itemId)}>
                        {isSaving ? 'Saving…' : 'Save status'}
                      </Button>
                      <Button type="button" onClick={() => navigate(itemId)}>
                        Review order
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

function AdminOrderDetailPage() {
  const navigate = useNavigate()
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [pendingStatus, setPendingStatus] = useState('')

  const loadOrder = useCallback(async () => {
    if (!orderId) return

    setLoading(true)
    setError('')

    try {
      const data = await apiAdminGetOrder(orderId)
      if (!data?.ok) throw new Error(data?.error || 'Failed to load order')
      setOrder(data.order ?? null)
      setPendingStatus(String(data.order?.status ?? 'pending_payment'))
    } catch (err) {
      setError(toErrorMessage(err, 'Failed to load order'))
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    loadOrder()
  }, [loadOrder])

  const onSaveStatus = async () => {
    if (!orderId) return

    const nextStatus = String(pendingStatus ?? '').trim().toLowerCase()
    if (!ORDER_STATUSES.includes(nextStatus)) {
      setError('Please select a valid order status.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const data = await apiAdminUpdateOrderStatus(orderId, nextStatus)
      if (!data?.ok) throw new Error(data?.error || 'Failed to update order status')
      await loadOrder()
    } catch (err) {
      setError(toErrorMessage(err, 'Failed to update order status'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        Loading order details…
      </div>
    )
  }

  if (error && !order) {
    return (
      <div className="grid gap-4">
        <Button type="button" variant="outline" onClick={() => navigate('/admin/orders')} className="w-fit rounded-full">
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Button>
        <Card className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3 text-rose-700">
            <AlertTriangle className="mt-0.5 h-5 w-5" />
            <div>
              <div className="text-base font-semibold text-slate-950">Order unavailable</div>
              <div className="mt-1 text-sm text-slate-600">{error}</div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (!order) {
    return null
  }

  return (
    <div className="grid gap-6">
      <SectionHeader
        title={`Order #${String(order.id).slice(-6)}`}
        description={`Detailed review for the order placed by ${order?.buyer?.name || 'the buyer'}.`}
        actions={(
          <Button type="button" variant="outline" onClick={() => navigate('/admin/orders')}>
            <ArrowLeft className="h-4 w-4" />
            Back to orders
          </Button>
        )}
      />

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Subtotal" value={formatBirr(order.subtotal ?? 0)} note="Order value" icon={BarChart3} index={0} />
        <MetricCard label="Items" value={formatPlainNumber(order.itemCount ?? 0)} note="Line items in the order" icon={Package} index={1} />
        <MetricCard label="Status" value={humanizeStatus(order.status)} note="Current workflow state" icon={Clock3} index={2} />
        <MetricCard label="Buyer" value={order?.buyer?.name || 'Unknown'} note={order?.buyer?.email || 'No buyer email'} icon={Users} index={3} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <div className="text-base font-semibold text-slate-950">Items</div>
            <div className="mt-1 text-sm text-slate-500">Each purchased product with the recorded quantity and unit price.</div>
          </div>
          <div className="p-6">
            <div className="grid gap-3">
              {(Array.isArray(order.items) ? order.items : []).map((item, index) => (
                <div key={`${item.productId || item.name || index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-950">{item.name}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {formatPlainNumber(item.quantity)} x {formatBirr(item.unitPrice ?? 0)}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {formatBirr((item.unitPrice ?? 0) * (item.quantity ?? 0))}
                    </div>
                  </div>
                  {item.product ? (
                    <div className="mt-3 text-xs text-slate-500">
                      Product record: {item.product.name} • {item.product.category}
                      {item.product.isAdminProduct ? ' • admin catalog' : ''}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <div className="text-base font-semibold text-slate-950">Status and delivery</div>
            <div className="mt-1 text-sm text-slate-500">Update the order status and inspect the shipping details.</div>
          </div>
          <div className="space-y-6 p-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-950">Update status</div>
              <div className="mt-3 grid gap-3">
                <select
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
                  value={pendingStatus}
                  onChange={(e) => setPendingStatus(e.target.value)}
                >
                  {ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>{humanizeStatus(status)}</option>
                  ))}
                </select>
                <Button type="button" onClick={onSaveStatus} disabled={saving}>
                  {saving ? 'Saving…' : 'Save status'}
                </Button>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-slate-950">Buyer</div>
              <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <div className="font-medium text-slate-900">{order?.buyer?.name || 'Unknown buyer'}</div>
                <div className="mt-1">{order?.buyer?.email || 'No email'}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{order?.buyer?.role || 'buyer'}</div>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-slate-950">Shipping</div>
              <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <div>{order?.shipping?.name || 'No shipping name'}</div>
                <div className="mt-1">{order?.shipping?.phone || 'No phone'}</div>
                <div className="mt-1">{order?.shipping?.addressLine1 || 'No address'}</div>
                <div className="mt-1">{[order?.shipping?.city, order?.shipping?.notes].filter(Boolean).join(' • ') || 'No extra shipping notes'}</div>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-slate-950">Payment</div>
              <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <div className="capitalize">Method: {order?.payment?.method || 'unknown'}</div>
                <div className="mt-1">Reference: {order?.payment?.transactionRef || 'No transaction reference'}</div>
                <div className="mt-1">Submitted: {formatDate(order?.payment?.submittedAt)}</div>
                {order?.payment?.proofImageUrl ? (
                  <a href={order.payment.proofImageUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-medium text-slate-950 underline underline-offset-4">
                    View payment proof
                  </a>
                ) : null}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-slate-950">Payment recipient</div>
              <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <div>Telebirr: {order?.recipient?.telebirrPhone || 'N/A'}</div>
                <div className="mt-1">Bank: {order?.recipient?.bankName || 'N/A'}</div>
                <div className="mt-1">Account: {order?.recipient?.bankAccountName || 'N/A'}</div>
                <div className="mt-1">Number: {order?.recipient?.bankAccountNumber || 'N/A'}</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productsError, setProductsError] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [appliedProductSearch, setAppliedProductSearch] = useState('')
  const [productCategoryFilter, setProductCategoryFilter] = useState('')
  const [productSellerFilter, setProductSellerFilter] = useState('')
  const [deletingProductId, setDeletingProductId] = useState('')

  const loadProducts = useCallback(async () => {
    setProductsLoading(true)
    setProductsError('')

    try {
      const data = await apiAdminListProducts({
        q: appliedProductSearch || undefined,
        category: productCategoryFilter || undefined,
        sellerId: productSellerFilter || undefined,
      })

      if (!data?.ok) {
        throw new Error(data?.error || 'Failed to load products')
      }

      const list = Array.isArray(data.products) ? data.products : []
      setProducts(list)
    } catch (err) {
      setProductsError(toErrorMessage(err, 'Failed to load products'))
    } finally {
      setProductsLoading(false)
    }
  }, [appliedProductSearch, productCategoryFilter, productSellerFilter])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const sellerOptions = useMemo(() => {
    const byId = new Map()

    for (const item of products) {
      const sellerId = String(item?.seller?.id ?? '').trim()
      if (!sellerId || byId.has(sellerId)) continue

      const name = String(item?.seller?.name ?? '').trim() || 'Unknown seller'
      const email = String(item?.seller?.email ?? '').trim()
      byId.set(sellerId, {
        id: sellerId,
        label: email ? `${name} (${email})` : name,
      })
    }

    return Array.from(byId.values())
  }, [products])

  const onSearchProducts = async (event) => {
    event.preventDefault()

    const nextSearch = productSearch.trim()
    if (nextSearch !== appliedProductSearch) {
      setAppliedProductSearch(nextSearch)
      return
    }

    await loadProducts()
  }

  const onDeleteProduct = async (productId, productName) => {
    const safeName = String(productName ?? '').trim() || 'this product'
    const confirmed = window.confirm(`Delete "${safeName}"? This action cannot be undone.`)
    if (!confirmed) return

    setDeletingProductId(productId)
    setProductsError('')

    try {
      const data = await apiDeleteProduct(productId)
      if (!data?.ok) throw new Error(data?.error || 'Failed to delete product')
      await loadProducts()
    } catch (err) {
      setProductsError(toErrorMessage(err, 'Failed to delete product'))
    } finally {
      setDeletingProductId('')
    }
  }

  return (
    <div className="grid gap-6">
      <SectionHeader
        title="Products"
        description="Scan the catalog, filter by seller or category, and remove anything that should no longer stay live."
        actions={(
          <Button type="button" variant="outline" onClick={loadProducts} disabled={productsLoading}>
            <RefreshCcw className="h-4 w-4" />
            {productsLoading ? 'Refreshing…' : 'Refresh'}
          </Button>
        )}
      />

      <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-slate-950">Catalog review</div>
              <div className="mt-1 text-sm text-slate-500">Loaded products: {formatPlainNumber(products.length)}</div>
            </div>
          </div>
        </div>

        <form onSubmit={onSearchProducts} className="grid gap-3 border-b border-slate-100 p-6 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Search</label>
            <Input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search by product name, category, description"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
            <Input
              value={productCategoryFilter}
              onChange={(e) => setProductCategoryFilter(e.target.value)}
              placeholder="Filter category"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full" disabled={productsLoading}>
              {productsLoading ? 'Loading…' : 'Refresh'}
            </Button>
          </div>

          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Seller</label>
            <select
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
              value={productSellerFilter}
              onChange={(e) => setProductSellerFilter(e.target.value)}
            >
              <option value="">All sellers</option>
              {sellerOptions.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </div>
        </form>

        {productsError ? <div className="px-6 pt-4 text-sm text-rose-600">{productsError}</div> : null}

        <div className="p-6">
          {productsLoading ? (
            <div className="text-sm text-slate-500">Loading products…</div>
          ) : products.length === 0 ? (
            <EmptyState
              title="No products found"
              description="Adjust the search, category, or seller filters to reveal more items."
              icon={Package}
            />
          ) : (
            <div className="grid gap-3">
              {products.map((item) => {
                const itemId = String(item.id)
                const isDeleting = deletingProductId === itemId
                const sellerName = String(item?.seller?.name ?? '').trim() || 'Unknown seller'
                const sellerEmail = String(item?.seller?.email ?? '').trim()

                return (
                  <div key={itemId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-semibold text-slate-950">{item.name}</div>
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${item.isAdminProduct ? 'border-slate-200 bg-slate-100 text-slate-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
                            {item.isAdminProduct ? 'Admin product' : 'Seller product'}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {item.category} • {formatBirr(item.price ?? 0)}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {sellerName}{sellerEmail ? ` • ${sellerEmail}` : ''}
                        </div>
                      </div>

                      <div className="text-xs text-slate-500">Uploaded {formatDate(item.createdAt)}</div>
                    </div>

                    {item.description ? <p className="mt-3 line-clamp-2 text-sm text-slate-600">{item.description}</p> : null}

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm font-medium text-slate-900">{formatPlainNumber(Array.isArray(item.images) ? item.images.length : 0)} images</div>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-rose-200 text-rose-700 hover:bg-rose-50"
                        disabled={isDeleting}
                        onClick={() => onDeleteProduct(itemId, item.name)}
                      >
                        {isDeleting ? 'Deleting…' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

function AdminSettingsPage() {
  const [settings, setSettings] = useState(() => normalizeSettings())
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsError, setSettingsError] = useState('')
  const [settingsStatus, setSettingsStatus] = useState('')
  const [settingsSaving, setSettingsSaving] = useState(false)

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
    loadSettings()
  }, [loadSettings])

  const onSaveSettings = async (event) => {
    event.preventDefault()
    setSettingsError('')
    setSettingsStatus('')
    setSettingsSaving(true)

    try {
      const data = await apiAdminUpdateSettings({
        paymentRecipient: settings.paymentRecipient,
        content: settings.content,
        legal: settings.legal,
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

  return (
    <div className="grid gap-6">
      <SectionHeader
        title="Settings"
        description="Update the payment recipient and the storefront content that the rest of the app reads from."
        actions={(
          <Button type="button" variant="outline" onClick={loadSettings} disabled={settingsLoading}>
            <RefreshCcw className="h-4 w-4" />
            {settingsLoading ? 'Refreshing…' : 'Refresh'}
          </Button>
        )}
      />

      <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="text-base font-semibold text-slate-950">Store settings</div>
          <div className="mt-1 text-sm text-slate-500">Changes here affect checkout payment details and storefront copy.</div>
        </div>

        {settingsLoading ? (
          <div className="p-6 text-sm text-slate-500">Loading settings…</div>
        ) : (
          <form onSubmit={onSaveSettings} className="grid gap-6 p-6">
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="text-sm font-semibold text-slate-950">Payment recipient</div>
                <div className="mt-1 text-sm text-slate-500">Used at checkout for Telebirr and bank transfers.</div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
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
                  <div className="space-y-2 sm:col-span-2">
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
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="text-sm font-semibold text-slate-950">Content</div>
                <div className="mt-1 text-sm text-slate-500">Used for the store name, support contacts, and banner text.</div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
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
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 xl:col-span-2">
                <div className="text-sm font-semibold text-slate-950">Legal &amp; Compliance</div>
                <div className="mt-1 text-sm text-slate-500">Official company entity, trade license, policy versions, and customer return window.</div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="admin-legal-name">Legal Entity Name</Label>
                    <Input
                      id="admin-legal-name"
                      value={settings.legal.companyName}
                      onChange={(e) => {
                        const value = e.target.value
                        setSettings((current) => ({
                          ...current,
                          legal: { ...current.legal, companyName: value },
                        }))
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-legal-address">Registered Office Address</Label>
                    <Input
                      id="admin-legal-address"
                      value={settings.legal.registeredAddress}
                      onChange={(e) => {
                        const value = e.target.value
                        setSettings((current) => ({
                          ...current,
                          legal: { ...current.legal, registeredAddress: value },
                        }))
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-legal-email">Legal / DPO Email</Label>
                    <Input
                      id="admin-legal-email"
                      value={settings.legal.legalEmail}
                      onChange={(e) => {
                        const value = e.target.value
                        setSettings((current) => ({
                          ...current,
                          legal: { ...current.legal, legalEmail: value },
                        }))
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-legal-reg">Business License / Reg #</Label>
                    <Input
                      id="admin-legal-reg"
                      value={settings.legal.registrationNumber}
                      onChange={(e) => {
                        const value = e.target.value
                        setSettings((current) => ({
                          ...current,
                          legal: { ...current.legal, registrationNumber: value },
                        }))
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-legal-tin">Tax ID / TIN</Label>
                    <Input
                      id="admin-legal-tin"
                      value={settings.legal.taxId}
                      onChange={(e) => {
                        const value = e.target.value
                        setSettings((current) => ({
                          ...current,
                          legal: { ...current.legal, taxId: value },
                        }))
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-legal-date">Policy Effective Date</Label>
                    <Input
                      id="admin-legal-date"
                      value={settings.legal.effectiveDate}
                      onChange={(e) => {
                        const value = e.target.value
                        setSettings((current) => ({
                          ...current,
                          legal: { ...current.legal, effectiveDate: value },
                        }))
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-legal-terms-ver">Terms Version</Label>
                    <Input
                      id="admin-legal-terms-ver"
                      value={settings.legal.termsVersion}
                      onChange={(e) => {
                        const value = e.target.value
                        setSettings((current) => ({
                          ...current,
                          legal: { ...current.legal, termsVersion: value },
                        }))
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-legal-privacy-ver">Privacy Version</Label>
                    <Input
                      id="admin-legal-privacy-ver"
                      value={settings.legal.privacyVersion}
                      onChange={(e) => {
                        const value = e.target.value
                        setSettings((current) => ({
                          ...current,
                          legal: { ...current.legal, privacyVersion: value },
                        }))
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-legal-returns">Return Window (Days)</Label>
                    <Input
                      id="admin-legal-returns"
                      type="number"
                      min="0"
                      max="365"
                      value={settings.legal.returnWindowDays}
                      onChange={(e) => {
                        const value = Number(e.target.value)
                        setSettings((current) => ({
                          ...current,
                          legal: { ...current.legal, returnWindowDays: value },
                        }))
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {settingsError ? <div className="text-sm text-rose-600">{settingsError}</div> : null}
            {settingsStatus ? <div className="text-sm text-emerald-700">{settingsStatus}</div> : null}

            <div className="flex justify-end">
              <Button type="submit" disabled={settingsSaving}>
                {settingsSaving ? 'Saving…' : 'Save settings'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}

function AdminAccessDenied() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-4 py-8">
      <Card className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-base font-semibold text-slate-950">Admin access required</div>
            <p className="mt-2 text-sm text-slate-600">This page is only available to administrator accounts.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => navigate('/account')}>
            Go to account
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default function AdminPage() {
  const { user } = useAuth()

  if (!isAdminUser(user)) {
    return <AdminAccessDenied />
  }

  return (
    <Routes>
      <Route element={<AdminShell />}>
        <Route index element={<AdminOverviewPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="orders/:orderId" element={<AdminOrderDetailPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Route>
    </Routes>
  )
}
