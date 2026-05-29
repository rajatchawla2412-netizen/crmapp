import React, { useState, useEffect, useCallback } from 'react'
import { Capacitor } from '@capacitor/core'
import PullToRefresh from 'react-simple-pull-to-refresh'
import CartPage from './CartPage'

// ProductCard sub-component to manage its own local quantity selector
function ProductCard({ product, onAddToCart, getAvatarGradient, getInitials }) {
  const [quantity, setQuantity] = useState(1)

  const handleIncrement = (e) => {
    e.stopPropagation()
    setQuantity(q => q + 1)
  }

  const handleDecrement = (e) => {
    e.stopPropagation()
    setQuantity(q => Math.max(1, q - 1))
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-zinc-50/65 dark:bg-zinc-950/20 border border-zinc-200/50 dark:border-zinc-850/40 rounded-2xl gap-3 hover:shadow-sm hover:border-purple-300/40 dark:hover:border-purple-900/30 transition-all duration-300 w-full select-none">
      <div className="flex items-center gap-3">
        <div className={`w-8.5 h-8.5 rounded-lg bg-gradient-to-br ${getAvatarGradient(product.name)} flex items-center justify-center text-white font-bold text-xs shadow-inner`}>
          {getInitials(product.name)}
        </div>
        <div>
          <h4 className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 leading-snug truncate max-w-[200px]" title={product.name}>
            {product.name}
          </h4>
          <span className="text-[8px] font-mono text-zinc-400 bg-white dark:bg-zinc-950 border border-zinc-150/50 dark:border-zinc-850 px-1.5 py-0.5 rounded-full inline-block mt-0.5">
            ID: {product.id}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto">
        <div className="flex items-center gap-1 min-w-[65px]">
          <span className="text-xs font-semibold text-purple-650 dark:text-purple-400">
            ₹
          </span>
          <span className="text-xs font-bold text-zinc-950 dark:text-zinc-50">
            {Number(product.price).toFixed(2)}
          </span>
        </div>

        {/* Quantity Controls and Add to Cart Button */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-850 p-1 rounded-lg">
            <button
              type="button"
              onClick={handleDecrement}
              className="w-6 h-6 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              -
            </button>
            <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-50 px-1.5 min-w-[14px] text-center">
              {quantity}
            </span>
            <button
              type="button"
              onClick={handleIncrement}
              className="w-6 h-6 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onAddToCart(product, quantity)
              setQuantity(1) // Reset local counter
            }}
            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
            <span>ઉમેરો</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage({ user, onLogout }) {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState({})
  const [errorMsg, setErrorMsg] = useState('')
  const [cart, setCart] = useState([])
  const [view, setView] = useState('list') // 'list' or 'cart'
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const loadData = useCallback(async () => {
    if (isLoading) return
    setIsLoading(true)
    setErrorMsg('')

    try {
      const login = user?.username || 'admin'
      const password = user?.password || 'admin'
      const apiKey = user?.apiKey || localStorage.getItem('api-key') || ''

      const API_URL = (Capacitor.isNativePlatform() || !import.meta.env.DEV)
        ? 'http://192.168.29.99:8019/send_request'
        : '/api/send_request'

      // 1. Fetch Categories
      const categoriesUrl = `${API_URL}?model=product.category`
      const catResponse = await fetch(categoriesUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'login': login,
          'password': password,
          'api-key': apiKey,
          'lang': 'gu'
        }
      })

      if (catResponse.status === 401 || catResponse.status === 403) {
        onLogout()
        return
      }

      if (!catResponse.ok) {
        throw new Error('શ્રેણીઓ મેળવવામાં નિષ્ફળતા મળી.')
      }

      const catData = await catResponse.json()
      let fetchedCategories = []
      if (catData && catData.records && Array.isArray(catData.records)) {
        fetchedCategories = catData.records
      } else if (Array.isArray(catData)) {
        fetchedCategories = catData
      }

      // 2. Fetch Products
      const productsUrl = `${API_URL}?model=product.template&fields=name,list_price,categ_id`
      const prodResponse = await fetch(productsUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'login': login,
          'password': password,
          'api-key': apiKey,
          'lang': 'gu'
        }
      })

      if (prodResponse.status === 401 || prodResponse.status === 403) {
        onLogout()
        return
      }

      if (!prodResponse.ok) {
        throw new Error('ઉત્પાદનો મેળવવામાં નિષ્ફળતા મળી.')
      }

      const prodData = await prodResponse.json()
      let fetchedProducts = []
      if (prodData && prodData.records && Array.isArray(prodData.records)) {
        fetchedProducts = prodData.records
      } else if (Array.isArray(prodData)) {
        fetchedProducts = prodData
      }

      // Format products
      const formattedProducts = fetchedProducts.map(record => {
        let categoryName = 'શ્રેણી વગરનું'
        let categoryId = 'uncategorized'
        if (Array.isArray(record.categ_id) && record.categ_id.length > 0) {
          categoryId = record.categ_id[0]
          categoryName = record.categ_id[1] || 'શ્રેણી વગરનું'
        } else if (typeof record.categ_id === 'number') {
          categoryId = record.categ_id
        } else if (typeof record.categ_id === 'string') {
          categoryName = record.categ_id
        }

        return {
          id: record.id,
          name: record.name,
          price: record.list_price !== undefined ? record.list_price : 0,
          categoryId: categoryId,
          category: categoryName
        }
      })

      setCategories(fetchedCategories)
      setProducts(formattedProducts)

      // Initialize all categories as collapsed (unexpanded) by default
      const initialExpanded = {}
      fetchedCategories.forEach(cat => {
        initialExpanded[cat.id] = false
      })
      initialExpanded['uncategorized'] = false
      setExpandedCategories(initialExpanded)

    } catch (error) {
      console.error('Error fetching categories & products:', error)
      let msg = 'નેટવર્ક ભૂલ. કૃપા કરીને ફરી પ્રયાસ કરો.'

      if (!navigator.onLine) {
        msg = 'ઇન્ટરનેટ કનેક્શન ઉપલબ્ધ નથી. કૃપા કરીને તમારું કનેક્શન તપાસો.'
      } else if (error.name === 'TypeError') {
        msg = 'સર્વર સાથે કનેક્ટ થવામાં નિષ્ફળતા. કૃપા કરીને સર્વર ચાલુ છે કે નહીં તે તપાસો.'
      } else if (error.message) {
        msg = `ભૂલ: ${error.message}`
      }

      setErrorMsg(msg)
    } finally {
      setIsLoading(false)
    }
  }, [user, onLogout, isLoading])

  // Initial load
  useEffect(() => {
    loadData()
  }, [])

  const handleRefresh = useCallback(async () => {
    await loadData()
  }, [loadData])

  // Toggle Category Expansion
  const toggleCategory = (catId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }))
  }

  // Cart Operations
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
        category: product.category
      }]
    })
    addToast(`"${product.name}" (${quantity} નંગ) કાર્ટમાં ઉમેરવામાં આવ્યું.`, 'success')
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

  // Group products by category ID
  const productsByCategory = React.useMemo(() => {
    const groups = {}
    
    // Initialize groups for fetched categories
    categories.forEach(cat => {
      groups[cat.id] = []
    })
    
    // Always have an uncategorized group
    groups['uncategorized'] = []

    // Populate groups
    products.forEach(prod => {
      const catId = prod.categoryId
      if (groups[catId]) {
        groups[catId].push(prod)
      } else {
        groups['uncategorized'].push(prod)
      }
    })

    return groups
  }, [categories, products])

  // Helper to generate initials avatar color class
  const getAvatarGradient = (name) => {
    const gradients = [
      'from-purple-500 to-indigo-500',
      'from-blue-500 to-cyan-500',
      'from-emerald-500 to-teal-500',
      'from-pink-500 to-rose-500',
      'from-amber-500 to-orange-500',
      'from-violet-500 to-fuchsia-500'
    ]
    const charCodeSum = (name || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
    return gradients[charCodeSum % gradients.length]
  }

  // Helper to get initials
  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  // Total Quantity in Cart for Badge
  const totalCartQty = cart.reduce((sum, item) => sum + item.quantity, 0)

  const renderCategoryAccordion = (catId, catName) => {
    const catProducts = productsByCategory[catId] || []
    const isExpanded = expandedCategories[catId]

    return (
      <div key={catId} className="space-y-4">
        {/* Accordion Header */}
        <div
          onClick={() => toggleCategory(catId)}
          className="flex items-center justify-between p-5 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl cursor-pointer hover:shadow-md hover:border-purple-300 dark:hover:border-purple-900/40 transition-all duration-300 select-none"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18a2.25 2.25 0 012.25 2.25v4.5A2.25 2.25 0 0118 21H6a2.25 2.25 0 01-2.25-2.25V15.75a2.25 2.25 0 012.25-2.25zm0-4.5h18a2.25 2.25 0 012.25 2.25v6.75a2.25 2.25 0 01-2.25 2.25H3.75a2.25 2.25 0 01-2.25-2.25V11.25a2.25 2.25 0 012.25-2.25z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-950 dark:text-zinc-50 leading-snug">
                {catName}
              </h3>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800/80 px-2 py-0.5 rounded-full inline-block mt-1">
                {catProducts.length} ઉત્પાદનો
              </span>
            </div>
          </div>

          <div className={`transform transition-transform duration-300 text-zinc-500 dark:text-zinc-400 ${isExpanded ? 'rotate-180' : ''}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>

        {/* Collapsible Content - Vertical List */}
        {isExpanded && (
          <div className="pl-6 md:pl-10 pr-2 border-l-2 border-zinc-150 dark:border-zinc-800/80 ml-5 md:ml-6 mt-2 animate-fade-in duration-200">
            {catProducts.length === 0 ? (
              <div className="p-8 bg-zinc-50/50 dark:bg-zinc-900/20 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl text-center text-xs text-zinc-450 dark:text-zinc-500 font-medium">
                આ શ્રેણીમાં કોઈ ઉત્પાદન નથી.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {catProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    getAvatarGradient={getAvatarGradient}
                    getInitials={getInitials}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const mainContent = (
    <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 md:py-12 flex flex-col gap-8">
      {view === 'cart' ? (
        <CartPage
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onEmptyCart={handleEmptyCart}
          onBack={() => setView('list')}
          onLogout={onLogout}
          user={user}
        />
      ) : (
        <>
          {/* Welcome Section */}
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 md:p-8 shadow-xl shadow-zinc-200/20 dark:shadow-none relative overflow-hidden transition-all duration-300">
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/20 rounded-full text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mb-4 tracking-wide uppercase">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  કનેક્ટ થયેલ: {user?.firstName || 'ઓપરેટર'}
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 margin-0">
                  ઉત્પાદનોની યાદી
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2 max-w-xl leading-relaxed">
                  શ્રેણી પર ક્લિક કરી તેને ખોલો અને ઉત્પાદનો કાર્ટમાં ઉમેરો.
                </p>
              </div>
            </div>
          </section>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-4 rounded-xl text-sm border flex items-start gap-3 transition-all duration-300 bg-rose-50/60 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-850 dark:text-rose-350">
              <svg className="w-5 h-5 flex-shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Loading Skeletons */}
          {isLoading && (
            <section className="space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-5 shadow-sm animate-pulse flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24"></div>
                      <div className="h-3 bg-zinc-250 dark:bg-zinc-850 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="w-5 h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
                </div>
              ))}
            </section>
          )}

          {/* Categories Accordion Group */}
          {!isLoading && (categories.length > 0 || (productsByCategory['uncategorized'] && productsByCategory['uncategorized'].length > 0)) && (
            <section className="space-y-6">
              {categories.map(cat => renderCategoryAccordion(cat.id, cat.name))}
              
              {/* Uncategorized group if not empty */}
              {productsByCategory['uncategorized'] && productsByCategory['uncategorized'].length > 0 && 
                renderCategoryAccordion('uncategorized', 'અન્ય (શ્રેણી વગરનું)')
              }
            </section>
          )}

          {/* Empty State */}
          {!isLoading && categories.length === 0 && products.length === 0 && !errorMsg && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-20 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-8">
              <div className="w-16 h-16 bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/30 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">ઉત્પાદનો અથવા શ્રેણીઓ મળ્યા નથી</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1 max-w-[280px]">
                ડેટાબેઝમાંથી કોઈ વિગતો મેળવી શકાયા નથી. કૃપા કરીને તમારી Odoo API-Key અથવા નેટવર્ક કનેક્શન તપાસો.
              </p>
            </div>
          )}
        </>
      )}
    </main>
  )

  return (
    <div className="flex-1 min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300 flex flex-col">
      {/* Top Navigation */}
      <nav className="w-full bg-white dark:bg-zinc-900 border-b border-zinc-200/60 dark:border-zinc-800/60 px-6 py-4 flex items-center justify-between sticky top-0 z-50 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-purple-600 dark:bg-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-purple-500/10">
            C
          </div>
          <span className="font-semibold text-lg tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-zinc-100 dark:to-zinc-400 bg-clip-text text-transparent">
            crmapp
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Cart Icon Button with Quantity Badge */}
          <button
            type="button"
            onClick={() => setView(view === 'cart' ? 'list' : 'cart')}
            className={`relative p-2.5 border rounded-xl transition-all cursor-pointer flex items-center justify-center ${
              view === 'cart'
                ? 'border-purple-600 text-purple-650 bg-purple-50/50 dark:border-purple-500/30 dark:text-purple-400 dark:bg-purple-950/20'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850'
            }`}
            title="કાર્ટ જુઓ"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
            {totalCartQty > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-purple-600 text-white text-[9px] font-bold flex items-center justify-center animate-pulse shadow-sm">
                {totalCartQty}
              </span>
            )}
          </button>

          <div className="flex items-center gap-3 pl-3 border-l border-zinc-200 dark:border-zinc-800">
            {user?.image && (
              <img
                src={user.image}
                alt={user.username}
                className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800"
              />
            )}
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                {user ? `${user.firstName} ${user.lastName}` : 'Operator'}
              </p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-550 font-mono">
                @{user?.username || 'user'}
              </p>
            </div>
            <button
              onClick={onLogout}
              className="px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-900/30 hover:bg-rose-50/40 dark:hover:bg-rose-950/10 rounded-xl text-xs font-medium transition-all flex items-center gap-2"
              title="Log out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              <span>લોગઆઉટ</span>
            </button>
          </div>
        </div>
      </nav>

      {Capacitor.isNativePlatform() ? (
        <PullToRefresh onRefresh={handleRefresh}>
          {mainContent}
        </PullToRefresh>
      ) : (
        mainContent
      )}

      {/* Footer */}
      <footer className="w-full py-6 bg-white dark:bg-zinc-900 border-t border-zinc-200/60 dark:border-zinc-800/60 text-center text-xs text-zinc-450 dark:text-zinc-550 transition-colors duration-300 mt-auto">
        <p>&copy; {new Date().getFullYear()} crmapp. તમામ અધિકારો સુરક્ષિત છે..</p>
      </footer>

      {/* Toast Notifications Container */}
      <div className="fixed bottom-6 left-6 right-6 sm:left-auto sm:right-6 z-[100] flex flex-col gap-3 max-w-none sm:max-w-sm pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-zinc-950/90 dark:bg-zinc-900/90 text-zinc-50 border border-zinc-800/80 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-3 animate-slide-in backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <p className="text-xs font-semibold leading-relaxed">
                {toast.message}
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-zinc-500 hover:text-zinc-350 transition-colors p-1 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes toastSlideIn {
          from {
            transform: translateY(1rem);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: toastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  )
}
