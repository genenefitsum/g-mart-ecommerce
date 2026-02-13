import axios from 'axios'

const baseURL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.PROD ? '/api/v1' : 'http://localhost:4000/api/v1')

export const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 10000,
})

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
