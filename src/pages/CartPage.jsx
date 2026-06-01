import React, { useState } from 'react'
import { Capacitor } from '@capacitor/core'

export default function CartPage({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onEmptyCart,
  onBack,
  onLogout,
  user
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [showOrderConfirm, setShowOrderConfirm] = useState(false)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Calculations
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const handlePlaceOrder = async () => {
    if (isPlacingOrder) return
    setIsPlacingOrder(true)
    setErrorMsg('')

    try {
      const login = user?.username || 'admin'
      const apiKey = user?.apiKey || localStorage.getItem('api-key') || ''
      const partnerId = Number(user?.partner_id || 9)

      const API_URL = (Capacitor.isNativePlatform() || !import.meta.env.DEV)
        ? 'http://192.168.29.99:8019/create_order'
        : '/api/create_order'

      const orderLines = cart.map(item => ({
        product_id: Number(item.id),
        product_uom_qty: Number(item.quantity),
        price_unit: Number(item.price)
      }))

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'login': login,
          'api-key': apiKey,
          'lang': 'gu'
        },
        body: JSON.stringify({
          partner_id: partnerId,
          order_lines: orderLines
        })
      })

      if (response.status === 401 || response.status === 403) {
        onLogout()
        return
      }

      let responseData = {}
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json()
      } else {
        const text = await response.text()
        console.error('Non-JSON response:', text)
        const cleanText = text.replace(/<[^>]*>/g, '').trim().substring(0, 300)
        throw new Error(cleanText || 'સર્વર તરફથી અમાન્ય પ્રતિસાદ મળ્યો (Non-JSON).')
      }

      if (response.ok && responseData.status === 'success') {
        setShowOrderConfirm(true)
      } else {
        throw new Error(responseData.message || 'ઓર્ડર મોકલવામાં સમસ્યા આવી.')
      }
    } catch (err) {
      console.error('Error placing order:', err)
      setErrorMsg(err.message || 'ઓર્ડર મોકલવામાં નિષ્ફળતા. કૃપા કરીને ફરી પ્રયાસ કરો.')
    } finally {
      setIsPlacingOrder(false)
    }
  }

  const handleCloseConfirm = () => {
    setShowOrderConfirm(false)
    onEmptyCart()
    onBack()
  }

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

  return (
    <section className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 md:p-8 shadow-xl shadow-zinc-200/20 dark:shadow-none relative overflow-hidden transition-all duration-300">
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 margin-0">
              તમારું કાર્ટ
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">
              તમારા પસંદ કરેલા ઉત્પાદનો અને વિગતો.
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

        {cart.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center text-center py-20 bg-zinc-50 dark:bg-zinc-950/20 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-8">
            <div className="w-16 h-16 bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/30 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">કાર્ટ ખાલી છે</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1 max-w-[280px]">
              કૃપા કરીને ખરીદી શરૂ કરવા માટે ઉત્પાદનો ઉમેરો.
            </p>
            <button
              type="button"
              onClick={onBack}
              className="mt-6 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded-2xl text-xs font-semibold shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              ઉત્પાદનો બ્રાઉઝ કરો
            </button>
          </div>
        ) : (
          /* Cart content */
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className={`px-4 py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${isEditing
                    ? 'border-purple-600 text-purple-650 bg-purple-50/50 dark:border-purple-500/30 dark:text-purple-400 dark:bg-purple-950/20'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850'
                  }`}
              >
                {isEditing ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span>પૂર્ણ (Done)</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                    </svg>
                    <span>કાર્ટ સુધારો (Edit)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onEmptyCart}
                className="px-4 py-2 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50/40 dark:hover:bg-rose-950/10 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                <span>કાર્ટ ખાલી કરો</span>
              </button>
            </div>

            {/* Cart Items List */}
            <div className="space-y-4">
              {cart.map(item => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-2xl gap-4 transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarGradient(item.name)} flex items-center justify-center text-white font-bold text-sm shadow-inner`}>
                      {getInitials(item.name)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-zinc-950 dark:text-zinc-50 leading-snug truncate max-w-[180px]" title={item.name}>
                        {item.name}
                      </h4>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {item.category} (ID: {item.id})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                    {/* Item Price and Quantity info */}
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] text-zinc-400 font-medium">કિંમત</p>
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
                        ₹ {Number(item.price).toFixed(2)}
                      </p>
                    </div>

                    {isEditing ? (
                      /* Quantity controls in edit mode */
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-1.5 rounded-xl">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="w-6 h-6 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-50 px-2 min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="p-2 border border-rose-100 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                          title="આઇટમ કાઢી નાખો"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      /* Display quantity & total in read-only mode */
                      <div className="flex gap-6 items-center">
                        <div className="text-center">
                          <p className="text-[10px] text-zinc-400 font-medium">જથ્થો</p>
                          <p className="text-xs font-semibold text-zinc-950 dark:text-zinc-50">
                            {item.quantity}
                          </p>
                        </div>
                        <div className="text-right min-w-[70px]">
                          <p className="text-[10px] text-zinc-400 font-medium">પેટા સરવાળો</p>
                          <p className="text-xs font-extrabold text-purple-650 dark:text-purple-400">
                            ₹ {Number(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-4 rounded-xl text-sm border flex items-start gap-3 transition-all duration-300 bg-rose-50/60 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-850 dark:text-rose-350">
                <svg className="w-5 h-5 flex-shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Cart Summary Card */}
            <div className="p-6 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-3xl mt-8 space-y-4">
              <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 text-xs">
                <span>કુલ આઇટમ્સ</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">{totalItems}</span>
              </div>
              <div className="flex items-center justify-between text-sm pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">કુલ કિંમત</span>
                <span className="font-extrabold text-purple-650 dark:text-purple-450 text-base">
                  ₹ {totalPrice.toFixed(2)}
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white font-semibold rounded-2xl shadow-md shadow-purple-500/10 hover:shadow-purple-500/20 transition-all text-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPlacingOrder ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>ઓર્ડર મોકલાઈ રહ્યો છે...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>ઓર્ડર આપો (Place Order)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Place Order Success Modal Overlay */}
      {showOrderConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative animate-scale-up text-center">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-455 mb-4 mx-auto animate-bounce">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50 mb-2">
              ઓર્ડર સફળતાપૂર્વક મળ્યો છે!
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-6 leading-relaxed">
              તમારો ઓર્ડર સિસ્ટમમાં સેવ કરવામાં આવ્યો છે. ઓર્ડર પ્રક્રિયા ટૂંક સમયમાં શરૂ કરવામાં આવશે.
            </p>

            <button
              type="button"
              onClick={handleCloseConfirm}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl text-xs transition-all shadow-md shadow-purple-500/10 hover:shadow-purple-500/20 cursor-pointer"
            >
              ઓકે
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
