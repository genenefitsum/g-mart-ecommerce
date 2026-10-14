export const COOKIE_STORAGE_KEY = 'gmart_cookie_consent'
export const CONSENT_VERSION = '1.0'

export function getCookieConsent() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(COOKIE_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveCookieConsent(record) {
  if (typeof window === 'undefined') return
  try {
    const payload = {
      essential: true,
      functional: Boolean(record.functional),
      analytics: Boolean(record.analytics),
      version: CONSENT_VERSION,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Ignore storage quota errors
  }
}

export function openCookiePreferences() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-cookie-preferences'))
  }
}
