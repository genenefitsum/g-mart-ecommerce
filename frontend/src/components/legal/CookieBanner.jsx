import { useEffect, useState } from 'react'
import { Cookie, X } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  CONSENT_VERSION,
  getCookieConsent,
  saveCookieConsent,
} from '@/lib/cookieConsent'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [preferences, setPreferences] = useState(() => {
    const existing = getCookieConsent()
    if (existing) {
      return {
        essential: true,
        functional: Boolean(existing.functional),
        analytics: Boolean(existing.analytics),
      }
    }
    return {
      essential: true,
      functional: true,
      analytics: false,
    }
  })

  useEffect(() => {
    const existing = getCookieConsent()
    if (!existing || existing.version !== CONSENT_VERSION) {
      const timer = setTimeout(() => setVisible(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    const handleOpen = () => {
      const existing = getCookieConsent()
      if (existing) {
        setPreferences({
          essential: true,
          functional: Boolean(existing.functional),
          analytics: Boolean(existing.analytics),
        })
      }
      setShowPreferences(true)
      setVisible(true)
    }

    window.addEventListener('open-cookie-preferences', handleOpen)
    return () => window.removeEventListener('open-cookie-preferences', handleOpen)
  }, [])

  const handleSave = (updated) => {
    saveCookieConsent(updated)
    setVisible(false)
    setShowPreferences(false)
  }

  const handleAcceptAll = () => {
    handleSave({ essential: true, functional: true, analytics: true })
  }

  const handleRejectNonEssential = () => {
    handleSave({ essential: true, functional: false, analytics: false })
  }

  const handleSavePreferences = () => {
    handleSave(preferences)
  }

  if (!visible) return null

  return (
    <>
      {/* Preferences Modal */}
      {showPreferences ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5 text-lg font-bold text-slate-900 font-montserrat">
                <Cookie className="h-5 w-5 text-blue-600" />
                Cookie Preferences
              </div>
              <button
                type="button"
                onClick={() => setShowPreferences(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-600 font-montserrat">
              We respect your right to privacy. Customize which categories of cookies and local storage tokens you allow while shopping on G-mart.
            </p>

            <div className="mt-5 space-y-4 font-montserrat">
              {/* Essential */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">
                    Essential (Strictly Necessary)
                  </span>
                  <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                    Always Active
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Required for user authentication, security, cart persistence, and checkout completion. These cannot be disabled.
                </p>
              </div>

              {/* Functional */}
              <div className="rounded-2xl border border-slate-200 p-4">
                <label className="flex items-start justify-between cursor-pointer">
                  <div>
                    <span className="text-sm font-semibold text-slate-900">
                      Functional &amp; Preferences
                    </span>
                    <p className="mt-1 text-xs text-slate-500">
                      Remembers your storefront filters, preferred sorting, and view selections.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.functional}
                    onChange={(e) =>
                      setPreferences((p) => ({ ...p, functional: e.target.checked }))
                    }
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>

              {/* Analytics */}
              <div className="rounded-2xl border border-slate-200 p-4">
                <label className="flex items-start justify-between cursor-pointer">
                  <div>
                    <span className="text-sm font-semibold text-slate-900">
                      Analytics &amp; Performance
                    </span>
                    <p className="mt-1 text-xs text-slate-500">
                      Helps us understand aggregated platform traffic, identify system bottlenecks, and improve search relevance.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) =>
                      setPreferences((p) => ({ ...p, analytics: e.target.checked }))
                    }
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRejectNonEssential}
              >
                Reject Non-Essential
              </Button>
              <Button
                type="button"
                className="bg-blue-600 text-white hover:bg-blue-700"
                size="sm"
                onClick={handleSavePreferences}
              >
                Save Preferences
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Floating Bottom Banner */}
      {!showPreferences ? (
        <aside
          role="region"
          aria-label="Cookie consent banner"
          className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-4xl animate-in slide-in-from-bottom-5 duration-300"
        >
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-[0_15px_40px_rgba(15,23,42,0.12)] backdrop-blur-md sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3.5">
                <div className="flex-none rounded-2xl bg-blue-50 p-2.5 text-blue-600 border border-blue-100">
                  <Cookie className="h-5 w-5" />
                </div>
                <div className="text-xs leading-5 text-slate-600 font-montserrat">
                  <p className="font-semibold text-slate-900 text-sm">We value your privacy</p>
                  <p className="mt-0.5">
                    G-mart uses essential cookies to enable secure shopping and authentication. With your permission, we also use optional functional cookies to improve your marketplace experience. View our{' '}
                    <Link
                      to="/privacy#cookies"
                      className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700"
                    >
                      Privacy &amp; Cookie Policy
                    </Link>
                    .
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:flex-none">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreferences(true)}
                  className="text-xs text-slate-600 hover:bg-slate-100"
                >
                  Preferences
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRejectNonEssential}
                  className="text-xs"
                >
                  Essential Only
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAcceptAll}
                  className="bg-blue-600 text-xs text-white hover:bg-blue-700 shadow-sm"
                >
                  Accept All
                </Button>
              </div>
            </div>
          </div>
        </aside>
      ) : null}
    </>
  )
}
