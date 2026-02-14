// import './App.css';
import { useEffect, useState } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
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
import CategoryProductsPage from './components/store/CategoryProductsPage.jsx'
import Checkout from './pages/Checkout.jsx'

import { Dialog, DialogContent } from '@/components/ui/dialog'

import { useAuth } from '@/context/AuthContext'
import { WishlistProvider } from '@/context/WishlistContext'
import './index.css'

function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAuth, setShowAuth] = useState(false)
  const [authRedirectTo, setAuthRedirectTo] = useState('')
  const [productsRefreshKey, setProductsRefreshKey] = useState(0)
  const { user, isLoading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const requireAuthThen = (path) => {
    if (user) {
      navigate(path)
      return
    }

    setAuthRedirectTo(path)
    setShowAuth(true)
  }

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
      <WishlistProvider onRequireAuth={() => setShowAuth(true)}>
        <Header
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          onAuthOpen={() => setShowAuth(true)}
        />

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
              </>
            }
          />
          <Route
            path="/category/:categoryId"
            element={<CategoryProductsPage searchQuery={searchQuery} />}
          />
          <Route path="/checkout" element={<Checkout />} />
        </Routes>

        <WishlistSideBar />
        <CartSideBar onCheckout={() => requireAuthThen('/checkout')} />

        <SellProduct
          onCreated={() => setProductsRefreshKey((k) => k + 1)}
          onRequireAuth={() => setShowAuth(true)}
        />
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

      <About />
      <Footer />

    </>

    
  )
}

export default App;