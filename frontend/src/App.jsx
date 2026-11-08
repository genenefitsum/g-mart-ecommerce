import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Header from './components/layouts/Header.jsx'
import HeroSection from './components/store/Hero.jsx'
import CategoriesSection from './components/store/Categories.jsx'
import Products from './components/store/Products.jsx'
import CartSideBar from './components/store/CartSideBar.jsx'
import WishlistSideBar from './components/store/WishlistSideBar.jsx'
import SellProduct from './components/store/SellProduct.jsx'
import About from './components/store/About.jsx'
import Footer from './components/layouts/Footer.jsx'
import AuthScreen from './components/store/AuthScreen.jsx'
import CookieBanner from './components/legal/CookieBanner.jsx'

// Lazy-loaded routes to minimize initial bundle size
const CategoryProductsPage = lazy(() => import('./components/store/CategoryProductsPage.jsx'))
const Checkout = lazy(() => import('./pages/Checkout.jsx'))
const ProductDetails = lazy(() => import('./pages/ProductDetails.jsx'))
const Account = lazy(() => import('./pages/Account.jsx'))
const Admin = lazy(() => import('./pages/Admin.jsx'))
const Terms = lazy(() => import('./pages/Terms.jsx'))
const Privacy = lazy(() => import('./pages/Privacy.jsx'))
const RefundPolicy = lazy(() => import('./pages/RefundPolicy.jsx'))
const ShippingPolicy = lazy(() => import('./pages/ShippingPolicy.jsx'))
const SellerTerms = lazy(() => import('./pages/SellerTerms.jsx'))

function RouteFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
    </div>
  )
}

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { api } from '@/lib/api'
import { onAuthRequired, requestSignIn } from '@/lib/authGate'

import { useAuth } from '@/context/AuthContext'
import { WishlistProvider } from '@/context/WishlistContext'
import './index.css'

function isAdminUser(user) {
  return String(user?.role ?? '').toLowerCase() === 'admin' || Boolean(user?.isPermanentAdmin)
}

function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAuth, setShowAuth] = useState(false)
  const [authRedirectTo, setAuthRedirectTo] = useState('')
  const [productsRefreshKey, setProductsRefreshKey] = useState(0)
  const { user, isLoading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const showGlobalHeader = !location.pathname.startsWith('/admin')
  const showGlobalFooter = !location.pathname.startsWith('/admin')
  const openAuth = useCallback((redirectTo = '') => {
    requestSignIn({ redirectTo })
  }, [])

  const requireAuthThen = (path) => {
    if (user) {
      navigate(path)
      return
    }

    setAuthRedirectTo(path)
    setShowAuth(true)
  }

  useEffect(() => {
    return onAuthRequired(({ redirectTo }) => {
      if (user) return

      const fallbackPath = `${location.pathname}${location.search}${location.hash}`
      const nextPath = String(redirectTo ?? '').trim() || fallbackPath

      setAuthRedirectTo(nextPath)
      setShowAuth(true)
    })
  }, [location.hash, location.pathname, location.search, user])

  useEffect(() => {
    api.get('/healthz', { timeout: 45000 }).catch(() => {})
  }, [])

  useEffect(() => {
    if (location.hash) {
      // Ensure we don't start the section-scroll from a stale scroll position
      // (e.g. coming from a shorter/longer page can leave you at the bottom).
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })

      const id = location.hash.replace('#', '')
      let attempts = 0
      const tryScroll = () => {
        const el = document.getElementById(id)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          return
        }

        attempts += 1
        if (attempts < 20) {
          window.requestAnimationFrame(tryScroll)
        }
      }

      tryScroll()
      return
    }

    // Default route changes: no animated scrolling.
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname, location.hash])

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-white flex items-center justify-center">
        <div className="text-sm text-gray-600">Loading…</div>
      </div>
    )
  }

  return (
    
    <>
      <WishlistProvider onRequireAuth={openAuth}>
        {showGlobalHeader ? (
          <Header
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            onAuthOpen={openAuth}
            onProductCreated={() => setProductsRefreshKey((k) => k + 1)}
          />
        ) : null}

        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <HeroSection />
                  <CategoriesSection searchQuery={searchQuery} />
                  <Products
                    searchQuery={searchQuery}
                    refreshKey={productsRefreshKey}
                  />

                  <SellProduct
                    onCreated={() => setProductsRefreshKey((k) => k + 1)}
                    onRequireAuth={openAuth}
                  />
                  <About />
                </>
              }
            />
            <Route
              path="/category/:categoryId"
              element={<CategoryProductsPage searchQuery={searchQuery} />}
            />
            <Route path="/product/:productId" element={<ProductDetails />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/returns" element={<RefundPolicy />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/shipping" element={<ShippingPolicy />} />
            <Route path="/shipping-policy" element={<ShippingPolicy />} />
            <Route path="/seller-terms" element={<SellerTerms />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route
              path="/account"
              element={<Account onRequireAuth={openAuth} />}
            />
            <Route
              path="/admin/*"
              element={
                isAdminUser(user) ? (
                  <Admin />
                ) : (
                  <Navigate to="/account" replace />
                )
              }
            />
          </Routes>
        </Suspense>

        <WishlistSideBar />
        <CartSideBar onCheckout={() => requireAuthThen('/checkout')} />

      </WishlistProvider>

      <Dialog
        open={Boolean(showAuth && !user)}
        onOpenChange={(open) => {
          setShowAuth(open)
        }}
      >
        <DialogContent
          className="w-[min(92vw,520px)] max-w-none rounded-3xl border border-gray-200 bg-white p-6 sm:p-7"
          overlayClassName="bg-black/30 backdrop-blur-sm"
        >
          <DialogTitle className="sr-only">Sign In to G-mart</DialogTitle>
          <DialogDescription className="sr-only">Access your account or sign up</DialogDescription>
          <AuthScreen
            onSuccess={() => {
              setShowAuth(false)

              if (authRedirectTo) {
                navigate(authRedirectTo)
                setAuthRedirectTo('')
              }
            }}
          />
        </DialogContent>
      </Dialog>

      {showGlobalFooter ? <Footer /> : null}
      <CookieBanner />

    </>

    
  )
}

export default App;