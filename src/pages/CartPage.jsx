import React, { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { useTranslation } from 'react-i18next'

// CartProductImage sub-component to handle images with fallback initials gracefully
function CartProductImage({ src, name }) {
  const [hasError, setHasError] = useState(false)
  const getInitials = (n) => {
    if (!n) return '?'
    const parts = n.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return n.slice(0, 2).toUpperCase()
  }

  const formatImageSrc = (img) => {
    if (!img) return null;
    if (img.startsWith('data:') || img.startsWith('http://') || img.startsWith('https://') || img.startsWith('/') || img.startsWith('blob:')) {
      return img;
    }

    let cleanImg = img.trim().replace(/\s/g, '');

    // Strip Python byte string wrapper b'...'
    if (cleanImg.startsWith("b'") && cleanImg.endsWith("'")) {
      cleanImg = cleanImg.slice(2, -1);
    }

    // Check for double base64 encoding
    try {
      const decodedOnce = atob(cleanImg);
      const cleanDecoded = decodedOnce.trim().replace(/\s/g, '');
      if (/^[A-Za-z0-9+/=]+$/.test(cleanDecoded) && cleanDecoded.length > 0) {
        cleanImg = cleanDecoded;
      }
    } catch (e) {
      // Keep single-encoded image
    }

    let mimeType = 'png';
    if (cleanImg.startsWith('/9j/')) {
      mimeType = 'jpeg';
    } else if (cleanImg.startsWith('iVBORw0KGgo')) {
      mimeType = 'png';
    } else if (cleanImg.startsWith('R0lGOD')) {
      mimeType = 'gif';
    } else if (cleanImg.startsWith('UklGR')) {
      mimeType = 'webp';
    } else if (cleanImg.startsWith('PHN2Zy')) {
      mimeType = 'svg+xml';
    }
    return `data:image/${mimeType};base64,${cleanImg}`;
  }

  const imageSrc = formatImageSrc(src);

  if (!imageSrc || hasError) {
    return (
      <div className="w-10 h-10 rounded-lg bg-zinc-150 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-400 font-bold text-xs select-none shadow-inner">
        {getInitials(name)}
      </div>
    )
  }

  return (
    <img
      src={imageSrc}
      alt={name}
      onError={() => setHasError(true)}
      className="w-10 h-10 object-contain rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-850"
    />
  )
}

export default function CartPage({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onEmptyCart,
  onLogout,
  user
}) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { addToast, editingOrder, saveEditedOrder } = useOutletContext()

  const [isEditing, setIsEditing] = useState(false)
  const [showOrderConfirm, setShowOrderConfirm] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
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

      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const seconds = String(now.getSeconds()).padStart(2, '0')
      const dateOrder = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'login': login,
          'api-key': apiKey,
          'lang': i18n.language === 'gu' ? 'gu' : 'en'
        },
        body: JSON.stringify({
          partner_id: partnerId,
          date_order: dateOrder,
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
        throw new Error(cleanText || t('non_json_response'))
      }

      if (response.ok && responseData.status === 'success') {
        setShowOrderConfirm(true)
        setOrderNumber(responseData.records[0].name)
      } else {
        throw new Error(responseData.message || t('order_error_default'))
      }
    } catch (err) {
      console.error('Error placing order:', err)
      setErrorMsg(err.message || t('order_error_default'))
    } finally {
      setIsPlacingOrder(false)
    }
  }

  const handleSaveEdit = async () => {
    if (isSavingEdit) return
    setIsSavingEdit(true)
    setErrorMsg('')
    try {
      await saveEditedOrder()
      addToast(t('order_updated_success'), 'success')
      navigate('/orders')
    } catch (err) {
      console.error('Error saving order edits:', err)
      setErrorMsg(err.message || t('order_error_default'))
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleCloseConfirm = () => {
    setShowOrderConfirm(false)
    onEmptyCart()
    navigate('/')
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
    <div className="w-full transition-all duration-300">
      <div className="flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="text-left">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 margin-0">
              {t('your_cart')}
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">
              {t('your_cart_subtext')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-2.5 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-450 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl transition-all cursor-pointer flex items-center justify-center"
            title={t('go_back')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
        </div>

        {editingOrder && (
          <div className="p-4 rounded-xl text-xs border flex items-start gap-3 transition-all duration-300 bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 text-left">
            <svg className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span>{t('editing_order_cart_notice', { orderNumber: editingOrder.order_number })}</span>
          </div>
        )}

        {cart.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center text-center py-20 bg-zinc-50 dark:bg-zinc-900/20 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-8">
            <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-700 rounded-xl flex items-center justify-center text-zinc-500 dark:text-zinc-450 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{t('cart_empty')}</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1 max-w-[280px]">
              {t('cart_empty_subtext')}
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="mt-6 px-5 py-2.5 bg-[#6941c6] hover:bg-[#5b37ad] text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              {t('browse_products')}
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
                  ? 'border-purple-600 text-[#6941c6] bg-purple-50/50 dark:border-purple-500/30 dark:text-purple-400 dark:bg-purple-950/20'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                  }`}
              >
                {isEditing ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span>{t('done_btn')}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                    </svg>
                    <span>{t('edit_cart')}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  onEmptyCart()
                  addToast(t('cart_emptied_toast'), 'success')
                }}
                className="px-4 py-2 border border-rose-250 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50/40 dark:hover:bg-rose-955/10 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                <span>{t('empty_cart_btn')}</span>
              </button>
            </div>

            {/* Cart Items List - Clean Flat Border Rows */}
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {cart.map(item => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4 transition-all duration-300"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <CartProductImage src={item.image} name={item.name} />
                    <div className="text-left flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 leading-snug truncate" title={item.display_name || item.name}>
                        {item.display_name || item.name || ''}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                    {/* Item Price and Quantity info */}
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-medium">{t('price_label')}</p>
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
                        ₹ {Number(item.price).toFixed(2)}
                      </p>
                    </div>

                    {isEditing ? (
                      /* Quantity controls in edit mode */
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 p-1.5 rounded-xl">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="w-6 h-6 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-50 px-2 min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onRemoveItem(item.id)
                            addToast(t('item_removed_toast'), 'success')
                          }}
                          className="p-2 border border-rose-100 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-955/20 text-rose-605 dark:text-rose-400 hover:bg-rose-100 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                          title="Remove item"
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
                          <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-medium">{t('quantity_label')}</p>
                          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                            {item.quantity}
                          </p>
                        </div>
                        <div className="text-right min-w-[70px]">
                          <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-medium">{t('subtotal_label')}</p>
                          <p className="text-xs font-extrabold text-[#6941c6] dark:text-purple-400">
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
              <div className="p-4 rounded-xl text-sm border flex items-start gap-3 transition-all duration-300 bg-rose-50/60 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-350 text-left">
                <svg className="w-5 h-5 flex-shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Cart Summary Card - Sleek Flat Container */}
            <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl mt-8 space-y-4 w-full text-left shadow-sm">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs">
                <span>{t('total_items')}</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">{totalItems}</span>
              </div>
              <div className="flex items-center justify-between text-sm pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">{t('total_price')}</span>
                <span className="font-extrabold text-[#6941c6] dark:text-purple-400 text-base">
                  ₹ {totalPrice.toFixed(2)}
                </span>
              </div>

              <div className="pt-2">
                {editingOrder ? (
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={isSavingEdit}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md text-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingEdit ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>{t('saving_changes')}</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{t('save_changes')}</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder}
                    className="w-full py-3 bg-[#6941c6] hover:bg-[#5b37ad] text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md text-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPlacingOrder ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>{t('placing_order')}</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{t('place_order')}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Place Order Success Modal Overlay */}
      {showOrderConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative animate-scale-up text-center">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 mx-auto animate-bounce">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              {t('order_success_title')}
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-6 leading-relaxed">
              {t('order_success_subtext', { orderNumber: orderNumber })}
            </p>

            <button
              type="button"
              onClick={handleCloseConfirm}
              className="w-full py-3 bg-[#6941c6] hover:bg-[#5b37ad] text-white font-medium rounded-xl text-xs transition-all shadow-sm hover:shadow-md cursor-pointer"
            >
              {t('ok_btn')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
