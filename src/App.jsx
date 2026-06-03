import { useState, useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import i18n from './i18n'
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
  const [editingOrder, setEditingOrder] = useState(() => {
    const saved = localStorage.getItem('editingOrder')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Error parsing editingOrder from localStorage:', e)
        return null
      }
    }
    return null
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

  // Persist editingOrder to localStorage on changes
  useEffect(() => {
    if (editingOrder) {
      localStorage.setItem('editingOrder', JSON.stringify(editingOrder))
    } else {
      localStorage.removeItem('editingOrder')
    }
  }, [editingOrder])

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
    localStorage.removeItem('editingOrder')
    setCart([])
    setEditingOrder(null)
  }

  const startEditingOrder = (order) => {
    setEditingOrder(order)
    const mappedCart = (order.order_lines || []).map(line => {
      const displayName = (line.display_name || line.product_name || '').replace(/\[[^\]]*\]/g, '');
      return {
        id: line.product_id,
        lineId: line.id,
        name: line.product_name,
        display_name: displayName,
        price: line.price_unit,
        quantity: line.qty,
        category: line.uom || 'Units',
        image: line.image
      }
    })
    setCart(mappedCart)
  }

  const discardEditingOrder = () => {
    setEditingOrder(null)
    setCart([])
  }

  const handleSaveEditedOrder = async () => {
    if (!editingOrder) return

    const login = user?.username || 'admin'
    const apiKey = user?.apiKey || localStorage.getItem('api-key') || ''
    const partnerId = Number(user?.partner_id || editingOrder.partner_id || editingOrder.customer_id || 9)
    const API_BASE = (Capacitor.isNativePlatform() || !import.meta.env.DEV)
      ? 'http://192.168.29.99:8019'
      : '/api'

    const url = `${API_BASE}/edit_order`

    // Determine deleted line IDs: lines in the original order that are NOT in the current cart
    const originalLineIds = (editingOrder.order_lines || []).map(l => l.id).filter(Boolean)
    const currentCartLineIds = cart.map(item => item.lineId).filter(Boolean)
    const delete_line_ids = originalLineIds.filter(id => !currentCartLineIds.includes(id))

    // Formulate the order lines parameter
    const order_lines = cart.map(item => {
      if (item.lineId) {
        // Changing an existing line
        return {
          line_id: item.lineId,
          product_uom_qty: Number(item.quantity),
          price_unit: Number(item.price),
          product_uom_id: 1
        }
      } else {
        // Adding a new product
        return {
          product_id: Number(item.id),
          product_uom_qty: Number(item.quantity),
          price_unit: Number(item.price),
          product_uom_id: 1
        }
      }
    })

    const payload = {
      order_id: Number(editingOrder.order_id),
      partner_id: partnerId,
      order_lines,
      delete_line_ids
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'login': login,
        'api-key': apiKey,
        'lang': i18n.language === 'gu' ? 'gu' : 'en'
      },
      body: JSON.stringify(payload)
    })

    if (response.status === 401 || response.status === 403) {
      handleLogout()
      throw new Error('Unauthorized')
    }

    let responseData = {}
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json()
    } else {
      const text = await response.text()
      console.error('Non-JSON response:', text)
      throw new Error('Invalid server response')
    }

    if (response.ok && responseData.status === 'success') {
      setEditingOrder(null)
      setCart([])
      return responseData
    } else {
      throw new Error(responseData.message || 'Failed to update order')
    }
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
        display_name: product.display_name,
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
          element={isLoggedIn ? (
            <LandingPage
              user={user}
              onLogout={handleLogout}
              cart={cart}
              editingOrder={editingOrder}
              startEditingOrder={startEditingOrder}
              discardEditingOrder={discardEditingOrder}
              onSaveEditedOrder={handleSaveEditedOrder}
              onDiscardEditedOrder={discardEditingOrder}
            />
          ) : <Navigate to="/login" replace />}
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
