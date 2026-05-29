import React, { useState, useCallback } from 'react'
import { Capacitor } from '@capacitor/core'

export default function ProductDetailsPage({ product, onBack, onRefreshList, onLogout, user }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(product.name || '')
  const [editPrice, setEditPrice] = useState(product.price !== undefined ? String(product.price) : '')
  const [editCategory, setEditCategory] = useState(product.categoryId !== undefined ? String(product.categoryId) : '1')
  
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const [formErrors, setFormErrors] = useState({ name: '', price: '', category: '' })
  const [formMessage, setFormMessage] = useState({ type: '', text: '' })

  const handleUpdate = useCallback(async (e) => {
    e.preventDefault()
    
    let hasError = false
    const newErrors = { name: '', price: '', category: '' }

    // Name validation
    const trimmedName = editName.trim()
    if (!trimmedName) {
      newErrors.name = 'ઉત્પાદન નામ દાખલ કરવું જરૂરી છે.'
      hasError = true
    } else if (trimmedName.length < 2) {
      newErrors.name = 'નામ ઓછામાં ઓછું ૨ અક્ષરનું હોવું જોઈએ.'
      hasError = true
    }

    // Price validation
    const trimmedPrice = editPrice.trim()
    if (!trimmedPrice) {
      newErrors.price = 'કિંમત દાખલ કરવી જરૂરી છે.'
      hasError = true
    } else if (isNaN(trimmedPrice) || Number(trimmedPrice) <= 0) {
      newErrors.price = 'કૃપા કરીને યોગ્ય કિંમત દાખલ કરો.'
      hasError = true
    }

    // Category validation
    const trimmedCategory = editCategory.trim()
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

      const response = await fetch(`${API_URL}?model=product.template&Id=${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'login': login,
          'api-key': apiKey,
          'lang': 'gu'
        },
        body: JSON.stringify({
          fields: ["name", "list_price", "categ_id"],
          values: {
            name: editName.trim(),
            list_price: Number(editPrice),
            categ_id: Number(editCategory)
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
        setFormMessage({ type: 'success', text: 'ઉત્પાદન સફળતાપૂર્વક અપડેટ કરવામાં આવ્યું!' })
        setFormErrors({ name: '', price: '', category: '' })
        
        // Refresh details with updated values
        product.name = editName.trim()
        product.price = Number(editPrice)
        product.categoryId = Number(editCategory)
        if (data.records && data.records[0] && Array.isArray(data.records[0].categ_id)) {
          product.category = data.records[0].categ_id[1]
        }

        setTimeout(() => {
          setIsEditing(false)
          setFormMessage({ type: '', text: '' })
          onRefreshList()
        }, 1500)
      } else {
        const errorMsg = data.message || data.error || 'ઉત્પાદન અપડેટ કરવામાં નિષ્ફળતા મળી. કૃપા કરીને ફરી પ્રયાસ કરો.'
        setFormMessage({
          type: 'error',
          text: errorMsg
        })
      }
    } catch (error) {
      console.error('Error updating product:', error)
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
  }, [editName, editPrice, editCategory, product, user, onLogout, onRefreshList])

  const handleDelete = useCallback(async () => {
    setIsDeleting(true)
    setFormMessage({ type: '', text: '' })

    try {
      const login = user?.username || 'admin'
      const apiKey = user?.apiKey || localStorage.getItem('api-key') || ''

      const API_URL = (Capacitor.isNativePlatform() || !import.meta.env.DEV)
        ? 'http://192.168.29.99:8019/send_request'
        : '/api/send_request'

      const response = await fetch(`${API_URL}?model=product.template&Id=${product.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'login': login,
          'api-key': apiKey,
          'lang': 'gu'
        }
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
        setShowDeleteConfirm(false)
        setFormMessage({ type: 'success', text: 'ઉત્પાદન સફળતાપૂર્વક કાઢી નાખવામાં આવ્યું!' })
        
        setTimeout(() => {
          onRefreshList()
          onBack()
        }, 1500)
      } else {
        const errorMsg = data.message || data.error || 'ઉત્પાદન કાઢી નાખવામાં નિષ્ફળતા મળી. કૃપા કરીને ફરી પ્રયાસ કરો.'
        setFormMessage({
          type: 'error',
          text: errorMsg
        })
        setShowDeleteConfirm(false)
      }
    } catch (error) {
      console.error('Error deleting product:', error)
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
      setShowDeleteConfirm(false)
    } finally {
      setIsDeleting(false)
    }
  }, [product, user, onLogout, onRefreshList, onBack])

  return (
    <section className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 md:p-8 shadow-xl shadow-zinc-200/20 dark:shadow-none relative overflow-hidden transition-all duration-300">
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 margin-0">
              {isEditing ? 'ઉત્પાદનની વિગતો સુધારો' : 'ઉત્પાદનની વિગતો'}
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">
              {isEditing ? 'ઉત્પાદનની વિગતો અપડેટ કરવા માટે ફોર્મ ભરો.' : `ઉત્પાદન ID: ${product.id}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="p-2 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850 rounded-xl transition-all cursor-pointer flex items-center justify-center"
            title="પાછા જાઓ"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
        </div>

        {/* Feedback Banners */}
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

        {isEditing ? (
          /* EDIT MODE FORM */
          <form onSubmit={handleUpdate} className="space-y-6 max-w-xl">
            <div>
              <label htmlFor="editName" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                ઉત્પાદન નામ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="editName"
                value={editName}
                onChange={(e) => {
                  setEditName(e.target.value)
                  if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }))
                }}
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
              <label htmlFor="editPrice" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                કિંમત <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                id="editPrice"
                value={editPrice}
                onChange={(e) => {
                  setEditPrice(e.target.value)
                  if (formErrors.price) setFormErrors(prev => ({ ...prev, price: '' }))
                }}
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
              <label htmlFor="editCategory" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                શ્રેણી ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                id="editCategory"
                value={editCategory}
                onChange={(e) => {
                  setEditCategory(e.target.value)
                  if (formErrors.category) setFormErrors(prev => ({ ...prev, category: '' }))
                }}
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
                  <span>અપડેટ કરો</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  setEditName(product.name || '')
                  setEditPrice(product.price !== undefined ? String(product.price) : '')
                  setEditCategory(product.categoryId !== undefined ? String(product.categoryId) : '1')
                  setFormErrors({ name: '', price: '', category: '' })
                  setFormMessage({ type: '', text: '' })
                }}
                disabled={isSaving}
                className="px-6 py-3 border border-red-600 text-red-600 bg-zinc-50 dark:border-red-600 dark:text-red-600 hover:bg-zinc-50 dark:hover:bg-zinc-850 dark:bg-zinc-800 font-bold rounded-xl transition-all text-sm cursor-pointer disabled:opacity-50"
              >
                રદ કરો
              </button>
            </div>
          </form>
        ) : (
          /* READ MODE VIEWER */
          <div className="space-y-8 max-w-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Info Fields */}
              <div className="bg-zinc-50 dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-850">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block mb-1">
                  ઉત્પાદન નામ
                </span>
                <p className="text-zinc-900 dark:text-zinc-50 font-semibold text-lg">
                  {product.name}
                </p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-850">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block mb-1">
                  કિંમત
                </span>
                <p className="text-purple-600 dark:text-purple-400 font-bold text-lg">
                  ₹ {Number(product.price).toFixed(2)}
                </p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-850">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block mb-1">
                  શ્રેણી
                </span>
                <p className="text-zinc-900 dark:text-zinc-50 font-semibold text-sm">
                  {product.category}
                </p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-850">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block mb-1">
                  શ્રેણી ID
                </span>
                <p className="text-zinc-900 dark:text-zinc-50 font-semibold text-sm">
                  {product.categoryId}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white font-medium rounded-xl transition-all shadow-md shadow-purple-500/10 hover:shadow-purple-500/20 flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                </svg>
                <span>વિગતો સુધારો (Edit)</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-3 border border-rose-200 text-rose-600 dark:border-rose-900/30 dark:text-rose-400 hover:bg-rose-50/40 dark:hover:bg-rose-950/10 font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                <span>કાઢી નાખો (Delete)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CUSTOM CONFIRMATION OVERLAY (GLASSMORPHIC DIALOGUE) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative animate-scale-up">
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-455 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            
            <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50 mb-2">
              શું તમે ખરેખર ઉત્પાદન કાઢી નાખવા માંગો છો?
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-6">
              આ ક્રિયા કાયમી છે અને "{product.name}" ને ડેટાબેઝમાંથી કાયમ માટે દૂર કરશે.
            </p>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl text-xs transition-all shadow-md shadow-red-500/10 hover:shadow-red-500/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>કાઢી નાખવામાં આવી રહ્યું છે...</span>
                  </>
                ) : (
                  <span>હા, કાઢી નાખો</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850 font-medium rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50 text-center"
              >
                ના, રદ કરો
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
