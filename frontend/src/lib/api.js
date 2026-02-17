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

export async function apiListProducts({ category, q } = {}) {
  const params = {}
  if (category) params.category = category
  if (q) params.q = q
  const res = await api.get('/products', { params })
  return res.data
}

export async function apiCreateProduct(formData) {
  const res = await api.post('/products', formData)
  return res.data
}

export async function apiGetProduct(productId) {
  const res = await api.get(`/products/${productId}`)
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
