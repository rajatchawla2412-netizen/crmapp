import { useState, useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import LandingPage from './pages/LandingPage'
import CategoriesPage from './pages/CategoriesPage'
import ProductsPage from './pages/ProductsPage'
import CartPage from './pages/CartPage'
import OrdersPage from './pages/OrdersPage'
import './App.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        return JSON.parse(savedCart)
      } catch (e) {
        console.error('Error parsing cart from localStorage:', e)
        return []
      }
    }
    return []
  })

  // Load user session from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        setUser(parsedUser)
        setIsLoggedIn(true)
      } catch (e) {
        localStorage.removeItem('user')
        localStorage.removeItem('api-key')
      }
    }
  }, [])

  // Persist cart to localStorage on changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])

  const handleLoginSuccess = (userData) => {
    setUser(userData)
    setIsLoggedIn(true)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('api-key')
    localStorage.removeItem('cart')
    setCart([])
  }

  const handleAddToCart = (product, quantity) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.id === product.id)
      if (existingIdx > -1) {
        const updated = [...prev]
        updated[existingIdx].quantity += quantity
        return updated
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: quantity,
        categoryId: product.categoryId,
        category: product.category,
        image: product.image
      }]
    })
  }

  const handleUpdateQuantity = (productId, newQty) => {
    setCart(prev => prev.map(item =>
      item.id === productId ? { ...item, quantity: newQty } : item
    ))
  }

  const handleRemoveItem = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId))
  }

  const handleEmptyCart = () => {
    setCart([])
  }

  return (
    <HashRouter>
      <Routes>
        {/* Unauthenticated Route */}
        <Route 
          path="/login" 
          element={!isLoggedIn ? <LoginPage onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/" replace />} 
        />

        {/* Authenticated Routes with Shared Layout */}
        <Route 
          path="/" 
          element={isLoggedIn ? <LandingPage user={user} onLogout={handleLogout} cart={cart} /> : <Navigate to="/login" replace />}
        >
          <Route index element={<CategoriesPage user={user} onLogout={handleLogout} />} />
          <Route 
            path="products/:categoryId" 
            element={
              <ProductsPage 
                user={user} 
                onLogout={handleLogout} 
                cart={cart} 
                onAddToCart={handleAddToCart} 
                onUpdateQuantity={handleUpdateQuantity} 
                onRemoveItem={handleRemoveItem} 
              />
            } 
          />
          <Route 
            path="cart" 
            element={
              <CartPage 
                cart={cart} 
                onUpdateQuantity={handleUpdateQuantity} 
                onRemoveItem={handleRemoveItem} 
                onEmptyCart={handleEmptyCart} 
                user={user} 
                onLogout={handleLogout} 
              />
            } 
          />
          <Route 
            path="orders" 
            element={<OrdersPage user={user} onLogout={handleLogout} />} 
          />
        </Route>

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}

export default App
