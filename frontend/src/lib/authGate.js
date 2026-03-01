const AUTH_REQUIRED_EVENT = 'gmart:auth-required'

export function requestSignIn(options = {}) {
  if (typeof window === 'undefined') return

  const detail = {
    redirectTo: typeof options?.redirectTo === 'string' ? options.redirectTo : '',
  }

  window.dispatchEvent(new CustomEvent(AUTH_REQUIRED_EVENT, { detail }))
}

export function onAuthRequired(handler) {
  if (typeof window === 'undefined' || typeof handler !== 'function') {
    return () => {}
  }

  const listener = (event) => {
    handler(event?.detail ?? {})
  }

  window.addEventListener(AUTH_REQUIRED_EVENT, listener)

  return () => {
    window.removeEventListener(AUTH_REQUIRED_EVENT, listener)
  }
}
