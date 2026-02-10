// import './App.css';
import { useState } from 'react'
import Header from './components/layouts/Header.jsx'
import HeroSection from './components/store/Hero.jsx'
import CategoriesSection from './components/store/Categories.jsx'
import Products from './components/store/Products.jsx'
import CartSideBar from './components/store/CartSideBar.jsx'
import SellProduct from './components/store/SellProduct.jsx'
import About from './components/store/About.jsx'
import Footer from './components/layouts/Footer.jsx'
import AuthScreen from './pages/AuthScreen.jsx'

import { useAuth } from '@/context/AuthContext'
import './index.css'

function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAuth, setShowAuth] = useState(false)
  const [productsRefreshKey, setProductsRefreshKey] = useState(0)
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-white flex items-center justify-center">
        <div className="text-sm text-gray-600">Loading…</div>
      </div>
    )
  }

  if (showAuth && !user) {
    return <AuthScreen />
  }

  return (
    
    <>
      <Header searchQuery={searchQuery} onSearch={setSearchQuery} />
      <HeroSection />
      <CategoriesSection searchQuery={searchQuery} />
      <Products searchQuery={searchQuery} refreshKey={productsRefreshKey} />
      <CartSideBar />
      <SellProduct
        onCreated={() => setProductsRefreshKey((k) => k + 1)}
        onRequireAuth={() => setShowAuth(true)}
      />
      <About />
      <Footer />

    </>

    
  )
}

export default App;