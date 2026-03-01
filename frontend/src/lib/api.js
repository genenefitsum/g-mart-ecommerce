import axios from 'axios'

function normalizeApiBaseUrl(raw) {
  if (!raw) return null
  let url = String(raw).trim()
  if (!url) return null

  // If the user forgets the protocol (common in Vercel env vars), axios treats it as relative.
  // Normalize to an absolute URL.
  if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) {
    if (/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(url)) {
      url = `http://${url}`
    } else {
      url = `https://${url}`
    }
  }

  url = url.replace(/\/+$/, '')
  if (!/\/api\/v1$/.test(url)) url += '/api/v1'
  return url
}

const baseURL =
  normalizeApiBaseUrl(import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL) ??
  (import.meta.env.PROD
    ? 'https://g-mart-ecommerce-1.onrender.com/api/v1'
    : 'http://localhost:4000/api/v1')

const apiOrigin = (() => {
  try {
    return new URL(baseURL).origin
  } catch {
    if (typeof window !== 'undefined') return window.location.origin
    return ''
  }
})()

export const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 10000,
})

export function resolveAssetUrl(rawUrl) {
  const value = String(rawUrl ?? '').trim()
  if (!value) return ''

  if (/^(?:data:|blob:|https?:\/\/)/i.test(value)) return value

  if (value.startsWith('/')) {
    return apiOrigin ? `${apiOrigin}${value}` : value
  }

  return value
}

let refreshInFlight = null

async function refreshAccessTokenOnce() {
  if (!refreshInFlight) {
    refreshInFlight = api
      .post('/auth/refresh', null, { __skipAuthRefresh: true })
      .then((res) => res.data)
      .finally(() => {
        refreshInFlight = null
      })
  }
  return refreshInFlight
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status
    const config = error?.config

    // If we can't inspect the request, just fail.
    if (!config) return Promise.reject(error)

    // Don't try to refresh for auth endpoints or explicitly skipped requests.
    const url = String(config.url ?? '')
    const isAuthCall = url.startsWith('/auth')
    if (config.__skipAuthRefresh || isAuthCall) {
      return Promise.reject(error)
    }

    // Retry once after refreshing token.
    if (status === 401 && !config.__retried) {
      config.__retried = true

      try {
        const data = await refreshAccessTokenOnce()
        if (data?.ok && data?.accessToken) {
          setAccessToken(data.accessToken)
          return api.request(config)
        }
      } catch {
        // fall through
      }
    }

    return Promise.reject(error)
  },
)

export function setAccessToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common.Authorization
  }
}

export async function apiLogin({ email, password }) {
  const res = await api.post('/auth/login', { email, password })
  return res.data
}

export async function apiRegister({ name, email, password }) {
  const res = await api.post('/auth/register', { name, email, password })
  return res.data
}

export async function apiGoogleLogin({ credential }) {
  const res = await api.post('/auth/google', { credential })
  return res.data
}

export async function apiRefresh() {
  const res = await api.post('/auth/refresh')
  return res.data
}

export async function apiMe() {
  const res = await api.get('/auth/me')
  return res.data
}

export async function apiUpdateMe({ name }) {
  const res = await api.patch('/auth/me', { name })
  return res.data
}

export async function apiChangePassword({ currentPassword, newPassword }) {
  const res = await api.post('/auth/change-password', { currentPassword, newPassword })
  return res.data
}

export async function apiDeleteAccount({ password }) {
  const res = await api.delete('/auth/account', { data: { password } })
  return res.data
}

export async function apiLogout() {
  const res = await api.post('/auth/logout')
  return res.data
}

export async function apiListProducts({ category, q, limit, timeoutMs } = {}) {
  const params = {}
  if (category) params.category = category
  if (q) params.q = q
  if (Number.isFinite(Number(limit)) && Number(limit) > 0) {
    params.limit = Math.floor(Number(limit))
  }

  const config = { params }
  if (Number.isFinite(Number(timeoutMs)) && Number(timeoutMs) > 0) {
    config.timeout = Math.floor(Number(timeoutMs))
  }

  const res = await api.get('/products', config)
  return res.data
}

export async function apiCreateProduct(formData) {
  const res = await api.post('/products', formData)
  return res.data
}

export async function apiUpdateProduct(productId, formData) {
  const res = await api.patch(`/products/${productId}`, formData)
  return res.data
}

export async function apiDeleteProduct(productId) {
  try {
    const res = await api.delete(`/products/${productId}`)
    return res.data
  } catch (err) {
    const status = err?.response?.status
    if (status !== 404) throw err

    const fallback = await api.post(`/products/${productId}/delete`)
    return fallback.data
  }
}

export async function apiGetProduct(productId) {
  const res = await api.get(`/products/${productId}`)
  return res.data
}

export async function apiListMyProducts() {
  const res = await api.get('/products/mine')
  return res.data
}

export async function apiCreateProductInterest(productId, payload) {
  const res = await api.post(`/products/${productId}/interest`, payload)
  return res.data
}

export async function apiListMyProductInterests() {
  const res = await api.get('/products/interests/mine')
  return res.data
}

export async function apiMarkMyProductInterestsRead(interestIds = []) {
  const payload = {
    interestIds: Array.isArray(interestIds) ? interestIds : [],
  }
  const res = await api.post('/products/interests/mark-read', payload)
  return res.data
}

export async function apiUpsertProductRating(productId, stars) {
  const res = await api.put(`/ratings/products/${productId}`, { stars })
  return res.data
}

export async function apiGetMyProductRating(productId) {
  const res = await api.get(`/ratings/products/${productId}/me`)
  return res.data
}

export async function apiGetProductRatingSummary(productId) {
  const res = await api.get(`/ratings/products/${productId}/summary`)
  return res.data
}

export async function apiUpsertSellerRating(sellerUserId, stars) {
  const res = await api.put(`/ratings/sellers/${sellerUserId}`, { stars })
  return res.data
}

export async function apiGetMySellerRating(sellerUserId) {
  const res = await api.get(`/ratings/sellers/${sellerUserId}/me`)
  return res.data
}

export async function apiGetSellerRatingSummary(sellerUserId) {
  const res = await api.get(`/ratings/sellers/${sellerUserId}/summary`)
  return res.data
}

export async function apiGetWishlist() {
  const res = await api.get('/wishlist')
  return res.data
}

export async function apiAddToWishlist(productId) {
  const res = await api.post(`/wishlist/${productId}`)
  return res.data
}

export async function apiRemoveFromWishlist(productId) {
  const res = await api.delete(`/wishlist/${productId}`)
  return res.data
}

export async function apiCreateOrder(payload) {
  const res = await api.post('/orders', payload)
  return res.data
}

export async function apiGetOrderPaymentRecipient() {
  const res = await api.get('/orders/payment-recipient')
  return res.data
}

export async function apiUploadOrderPaymentProof(orderId, formData) {
  const res = await api.post(`/orders/${orderId}/payment-proof`, formData)
  return res.data
}

export async function apiListOrders() {
  const res = await api.get('/orders')
  return res.data
}

export async function apiGetOrder(orderId) {
  const res = await api.get(`/orders/${orderId}`)
  return res.data
}

export async function apiAdminListUsers({ q, role, limit } = {}) {
  const params = {}
  if (q) params.q = q
  if (role) params.role = role
  if (limit) params.limit = limit

  const res = await api.get('/admin/users', { params })
  return res.data
}

export async function apiAdminUpdateUserRole(userId, role) {
  const res = await api.patch(`/admin/users/${userId}/role`, { role })
  return res.data
}

export async function apiAdminListOrders({ status, limit } = {}) {
  const params = {}
  if (status) params.status = status
  if (limit) params.limit = limit

  const res = await api.get('/admin/orders', { params })
  return res.data
}

export async function apiAdminUpdateOrderStatus(orderId, status) {
  const res = await api.patch(`/admin/orders/${orderId}/status`, { status })
  return res.data
}

export async function apiAdminGetSettings() {
  const res = await api.get('/admin/settings')
  return res.data
}

export async function apiAdminUpdateSettings(payload) {
  const res = await api.patch('/admin/settings', payload)
  return res.data
}
