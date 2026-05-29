import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import PullToRefresh from 'react-simple-pull-to-refresh'
import ProductDetailsPage from './ProductDetailsPage'

export default function LandingPage({ user, onLogout }) {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [nextId, setNextId] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const observer = useRef()

  const [view, setView] = useState('list') // 'list' or 'create' or 'details'
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [formName, setFormName] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [formMessage, setFormMessage] = useState({ type: '', text: '' })
  const [formErrors, setFormErrors] = useState({ name: '', price: '', category: '' })

  const loadMoreProducts = useCallback(async (isRefresh = false) => {
    if (isLoading || (!isRefresh && !hasMore)) return
    setIsLoading(true)

    try {
      const login = user?.username || 'admin'
      const password = user?.password || 'admin'
      const apiKey = user?.apiKey || localStorage.getItem('api-key') || ''

      const API_URL = (Capacitor.isNativePlatform() || !import.meta.env.DEV)
        ? 'http://192.168.29.99:8019/send_request'
        : '/api/send_request'

      const currentNextId = isRefresh ? 1 : nextId
      // Fetch 10 IDs in parallel
      const idsToFetch = Array.from({ length: 10 }, (_, i) => currentNextId + i)

      const fetchPromises = idsToFetch.map(async (id) => {
        try {
          const url = `${API_URL}?model=product.template&Id=${id}&fields=name,list_price,categ_id`
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'login': login,
              'password': password,
              'api-key': apiKey,
              'lang': 'gu'
            }
          })

          if (response.status === 401 || response.status === 403) {
            // Session expired or unauthorized, trigger logout
            onLogout()
            return null
          }

          if (!response.ok) return null

          let data = {}
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            data = await response.json()
          } else {
            const text = await response.text()
            if (text) {
              try {
                data = JSON.parse(text)
              } catch (e) {
                data = { message: text }
              }
            }
          }

          let record = null
          if (data) {
            if (data.records && Array.isArray(data.records) && data.records.length > 0) {
              record = data.records[0]
            } else if (Array.isArray(data) && data.length > 0) {
              record = data[0]
            } else if (data.name || data.display_name) {
              record = data
            }
          }

          if (record && (record.name || record.display_name)) {
            let category = 'શ્રેણી વગરનું'
            let categoryId = 1
            if (Array.isArray(record.categ_id) && record.categ_id.length > 0) {
              category = record.categ_id[1] || 'શ્રેણી વગરનું'
              categoryId = record.categ_id[0] || 1
            } else if (typeof record.categ_id === 'string') {
              category = record.categ_id
            } else if (typeof record.categ_id === 'number') {
              categoryId = record.categ_id
            }

            return {
              id: record.id || id,
              name: record.name || record.display_name,
              price: record.list_price !== undefined ? record.list_price : 0,
              category: category,
              categoryId: categoryId
            }
          }

          return null
        } catch (e) {
          console.error(`Failed to fetch product with ID ${id}:`, e)
          return null
        }
      })

      const results = await Promise.all(fetchPromises)
      const validProducts = results.filter(p => p !== null)

      if (isRefresh) {
        setProducts(validProducts)
        setNextId(11)
        setHasMore(true)
      } else {
        if (validProducts.length > 0) {
          setProducts(prev => {
            const existingIds = new Set(prev.map(p => p.id))
            const uniqueNew = validProducts.filter(p => !existingIds.has(p.id))
            const merged = [...prev, ...uniqueNew]

            return merged
          })
        }
        setNextId(prev => prev + 10)
      }

      // Stop fetching if we check past the last found product ID and find no more products
      const currentProducts = isRefresh ? validProducts : products
      const maxLoadedId = currentProducts.length > 0 ? Math.max(...currentProducts.map(p => p.id)) : 0
      const checkLimit = Math.max(maxLoadedId + 20, 50)
      const currentNextIdAfterFetch = isRefresh ? 11 : (nextId + 10)
      if (validProducts.length === 0 && currentNextIdAfterFetch > checkLimit) {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error fetching products batch:', error)
    } finally {
      setIsLoading(false)
    }
  }, [nextId, isLoading, hasMore, user, onLogout, products])

  const handleCreateProduct = useCallback(async (e) => {
    e.preventDefault()

    let hasError = false
    const newErrors = { name: '', price: '', category: '' }

    // Name validation
    const trimmedName = formName.trim()
    if (!trimmedName) {
      newErrors.name = 'ઉત્પાદન નામ દાખલ કરવું જરૂરી છે.'
      hasError = true
    } else if (trimmedName.length < 2) {
      newErrors.name = 'નામ ઓછામાં ઓછું ૨ અક્ષરનું હોવું જોઈએ.'
      hasError = true
    }

    // Price validation
    const trimmedPrice = formPrice.trim()
    if (!trimmedPrice) {
      newErrors.price = 'કિંમત દાખલ કરવી જરૂરી છે.'
      hasError = true
    } else if (isNaN(trimmedPrice) || Number(trimmedPrice) <= 0) {
      newErrors.price = 'કૃપા કરીને યોગ્ય કિંમત દાખલ કરો.'
      hasError = true
    }

    // Category validation
    const trimmedCategory = formCategory.trim()
    if (!trimmedCategory) {
      newErrors.category = 'શ્રેણી ID દાખલ કરવું જરૂરી છે.'
      hasError = true
    } else if (isNaN(trimmedCategory) || !Number.isInteger(Number(trimmedCategory)) || Number(trimmedCategory) <= 0) {
      newErrors.category = 'કૃપા કરીને યોગ્ય શ્રેણી ID (પૂર્ણાંક) દાખલ કરો.'
      hasError = true
    }

    setFormErrors(newErrors)

    if (hasError) {
      setFormMessage({ type: 'error', text: 'કૃપા કરીને ફોર્મમાં રહેલી ભૂલો સુધારો.' })
      return
    }

    setIsSaving(true)
    setFormMessage({ type: '', text: '' })

    try {
      const login = user?.username || 'admin'
      const apiKey = user?.apiKey || localStorage.getItem('api-key') || ''

      const API_URL = (Capacitor.isNativePlatform() || !import.meta.env.DEV)
        ? 'http://192.168.29.99:8019/send_request'
        : '/api/send_request'

      const response = await fetch(`${API_URL}?model=product.template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'login': login,
          'api-key': apiKey,
          'lang': 'gu'
        },
        body: JSON.stringify({
          fields: ["name", "list_price", "categ_id"],
          values: {
            name: formName.trim(),
            list_price: Number(formPrice) || 0,
            categ_id: Number(formCategory) || 1
          }
        })
      })

      if (response.status === 401 || response.status === 403) {
        onLogout()
        return
      }

      let data = {}
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        const text = await response.text()
        if (text) {
          try {
            data = JSON.parse(text)
          } catch (err) {
            data = { message: text }
          }
        }
      }

      const isSuccess = response.ok && data && (data.status === 'success' || (!data.error && data.status !== 'error' && data.status !== 'failed'))

      if (isSuccess) {
        setFormMessage({ type: 'success', text: 'ઉત્પાદન સફળતાપૂર્વક ઉમેરવામાં આવ્યું!' })
        setFormName('')
        setFormPrice('')
        setFormCategory('')
        setFormErrors({ name: '', price: '', category: '' })

        await loadMoreProducts(true)

        setTimeout(() => {
          setView('list')
          setFormMessage({ type: '', text: '' })
        }, 1500)
      } else {
        const errorMsg = data.message || data.error || 'ઉત્પાદન ઉમેરવામાં નિષ્ફળતા મળી. કૃપા કરીને ફરી પ્રયાસ કરો.'
        setFormMessage({
          type: 'error',
          text: errorMsg
        })
      }
    } catch (error) {
      console.error('Error creating product:', error)
      let errorMessage = 'નેટવર્ક ભૂલ. કૃપા કરીને ફરી પ્રયાસ કરો.'

      if (!navigator.onLine) {
        errorMessage = 'ઇન્ટરનેટ કનેક્શન ઉપલબ્ધ નથી. કૃપા કરીને તમારું કનેક્શન તપાસો.'
      } else if (error.name === 'TypeError') {
        errorMessage = 'સર્વર સાથે કનેક્ટ થવામાં નિષ્ફળતા. કૃપા કરીને સર્વર ચાલુ છે કે નહીં તે તપાસો.'
      } else if (error.message) {
        errorMessage = `નેટવર્ક ભૂલ: ${error.message}`
      }

      setFormMessage({
        type: 'error',
        text: errorMessage
      })
    } finally {
      setIsSaving(false)
    }
  }, [formName, formPrice, formCategory, user, loadMoreProducts])

  const handleRefresh = useCallback(async () => {
    await loadMoreProducts(true)
  }, [loadMoreProducts])

  // Observer callback for scroll detection
  const lastProductElementRef = useCallback(node => {
    if (isLoading || !hasMore) return
    if (observer.current) observer.current.disconnect()

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        loadMoreProducts()
      }
    }, { threshold: 0.01 })

    if (node) observer.current.observe(node)
  }, [isLoading, hasMore, loadMoreProducts])

  // Initial load
  useEffect(() => {
    loadMoreProducts()
  }, [])

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
    const charCodeSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
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

  const mainContent = (
    <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 md:py-12 flex flex-col">
      {view === 'create' ? (
        <section className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 md:p-8 shadow-xl shadow-zinc-200/20 dark:shadow-none relative overflow-hidden transition-all duration-300">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 margin-0">
                  નવું ઉત્પાદન ઉમેરો
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">
                  Odoo માં નવું ઉત્પાદન ઉમેરવા માટે વિગતો ભરો.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setView('list')
                  setFormMessage({ type: '', text: '' })
                  setFormErrors({ name: '', price: '', category: '' })
                }}
                className="p-2 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                title="પાછા જાઓ"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </button>
            </div>

            {/* Notification Banner */}
            {formMessage.text && (
              <div className={`mb-6 p-4 rounded-xl text-sm border flex items-start gap-3 transition-all duration-300 ${formMessage.type === 'success'
                ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-300'
                }`}>
                {formMessage.type === 'success' ? (
                  <svg className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 flex-shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                )}
                <span>{formMessage.text}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateProduct} className="space-y-6 max-w-xl">
              <div>
                <label htmlFor="formName" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                  ઉત્પાદન નામ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="formName"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value)
                    if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }))
                  }}
                  placeholder="ઉત્પાદનનું નામ"
                  disabled={isSaving}
                  required
                  className={`w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border rounded-xl text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 disabled:opacity-50 transition-all font-medium text-sm ${formErrors.name
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-zinc-200 dark:border-zinc-800 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500/20'
                    }`}
                />
                {formErrors.name && (
                  <p className="text-rose-500 dark:text-rose-455 text-xs mt-1.5 font-medium">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="formPrice" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                  કિંમત <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  id="formPrice"
                  value={formPrice}
                  onChange={(e) => {
                    setFormPrice(e.target.value)
                    if (formErrors.price) setFormErrors(prev => ({ ...prev, price: '' }))
                  }}
                  placeholder="કિંમત (દા.ત. ૫૦૦)"
                  disabled={isSaving}
                  required
                  className={`w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border rounded-xl text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 disabled:opacity-50 transition-all font-medium text-sm ${formErrors.price
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-zinc-200 dark:border-zinc-800 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500/20'
                    }`}
                />
                {formErrors.price && (
                  <p className="text-rose-500 dark:text-rose-455 text-xs mt-1.5 font-medium">{formErrors.price}</p>
                )}
              </div>

              <div>
                <label htmlFor="formCategory" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                  શ્રેણી ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  id="formCategory"
                  value={formCategory}
                  onChange={(e) => {
                    setFormCategory(e.target.value)
                    if (formErrors.category) setFormErrors(prev => ({ ...prev, category: '' }))
                  }}
                  placeholder="શ્રેણી ID (દા.ત. ૫)"
                  disabled={isSaving}
                  required
                  className={`w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border rounded-xl text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 disabled:opacity-50 transition-all font-medium text-sm ${formErrors.category
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-zinc-200 dark:border-zinc-800 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500/20'
                    }`}
                />
                {formErrors.category && (
                  <p className="text-rose-500 dark:text-rose-455 text-xs mt-1.5 font-medium">{formErrors.category}</p>
                )}
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white font-medium rounded-xl transition-all shadow-md shadow-purple-500/10 hover:shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>સાચવી રહ્યું છે...</span>
                    </>
                  ) : (
                    <span>સાચવો</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setView('list')
                    setFormMessage({ type: '', text: '' })
                    setFormErrors({ name: '', price: '', category: '' })
                  }}
                  disabled={isSaving}
                  className="px-6 py-3 border border-red-600 text-red-600 bg-zinc-50 dark:border-red-600  dark:text-red-600 hover:bg-zinc-50 dark:hover:bg-zinc-850 dark:bg-zinc-800 font-bold rounded-xl transition-all text-sm cursor-pointer disabled:opacity-50"
                >
                  રદ કરો
                </button>
              </div>
            </form>
          </div>
        </section>
      ) : view === 'details' && selectedProduct ? (
        <ProductDetailsPage
          product={selectedProduct}
          onBack={() => {
            setView('list')
            setSelectedProduct(null)
          }}
          onRefreshList={() => loadMoreProducts(true)}
          onLogout={onLogout}
          user={user}
        />
      ) : (
        <>
          {/* Welcome Section */}
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 md:p-8 shadow-xl shadow-zinc-200/20 dark:shadow-none relative overflow-hidden transition-all duration-300 mb-10">
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
                  ડાયનામિક રીતે લોડ થયેલા Odoo ઉત્પાદનોની યાદી બ્રાઉઝ કરો.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFormName('')
                  setFormPrice('')
                  setFormCategory('')
                  setFormMessage({ type: '', text: '' })
                  setFormErrors({ name: '', price: '', category: '' })
                  setView('create')
                }}
                className="px-5 py-3 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded-2xl text-xs font-semibold shadow-md shadow-purple-500/10 hover:shadow-purple-500/20 transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>નવું ઉત્પાદન ઉમેરો</span>
              </button>
            </div>
          </section>

          {/* Products Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => {
              const isLast = index === products.length - 1
              return (
                <div
                  key={product.id}
                  ref={isLast ? lastProductElementRef : null}
                  onClick={() => {
                    setSelectedProduct(product)
                    setView('details')
                  }}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div className="flex items-center gap-4 mb-5">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getAvatarGradient(product.name)} flex items-center justify-center text-white font-bold text-lg shadow-inner`}>
                        {getInitials(product.name)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-zinc-950 dark:text-zinc-50 leading-snug">
                          {product.name}
                        </h3>
                        <span className="text-[10px] font-mono text-zinc-450 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 px-2 py-0.5 rounded-full">
                          ID: {product.id}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
                        {/* Package/Box icon for Category */}
                        <svg className="w-4 h-4 flex-shrink-0 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                        </svg>
                        <span className="text-xs truncate font-medium" title={product.category}>
                          {product.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
                        {/* Currency/Price icon */}
                        <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                          ₹
                        </span>
                        <span className="text-xs font-bold text-zinc-950 dark:text-zinc-50">
                          {Number(product.price).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Loading Skeletons */}
            {isLoading && Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 shadow-md flex flex-col justify-between animate-pulse"
              >
                <div>
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-200 dark:bg-zinc-800"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3"></div>
                      <div className="h-3 bg-zinc-250 dark:bg-zinc-850 rounded w-1/3"></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
                      <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4"></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
                      <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* End of results message */}
          {!hasMore && products.length > 0 && (
            <div className="text-center text-xs text-zinc-400 dark:text-zinc-550 mt-12 py-6 border-t border-zinc-200/60 dark:border-zinc-800/60">
              લોડ કરવા માટે વધુ ઉત્પાદનો ઉપલબ્ધ નથી. ડિરેક્ટરીના તમામ આઇટમ્સ લોડ થઈ ગયા છે.
            </div>
          )}

          {/* Empty State */}
          {!isLoading && products.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-20 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-8">
              <div className="w-16 h-16 bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/30 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">ઉત્પાદનો મળ્યા નથી</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1 max-w-[280px]">
                ડેટાબેઝમાંથી કોઈ ઉત્પાદન મેળવી શકાયા નથી. કૃપા કરીને તમારી Odoo API-Key અથવા નેટવર્ક કનેક્શન તપાસો.
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
    </div>
  )
}
