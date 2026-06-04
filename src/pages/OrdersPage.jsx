import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { useTranslation } from 'react-i18next'
import PullToRefresh from 'react-simple-pull-to-refresh'

// Minimalist Pull to Refresh components
const PullingIndicator = () => (
  <div className="flex items-center justify-center py-4 text-zinc-400 dark:text-zinc-500">
    <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
    </svg>
  </div>
)

const RefreshingIndicator = () => (
  <div className="flex items-center justify-center py-4">
    <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-700 border-t-purple-650 dark:border-t-purple-400 rounded-full animate-spin"></div>
  </div>
)

// Small sub-component for product line images with fallback initials
function OrderProductImage({ src, name }) {
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
      <div className="w-8.5 h-8.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 font-bold text-[10px] select-none">
        {getInitials(name)}
      </div>
    )
  }

  return (
    <img
      src={imageSrc}
      alt={name}
      onError={() => setHasError(true)}
      className="w-8.5 h-8.5 object-contain rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800"
    />
  )
}

export default function OrdersPage({ user, onLogout }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { addToast, editingOrder, startEditingOrder, discardEditingOrder, setPageLoading } = useOutletContext()
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (setPageLoading) {
      setPageLoading('orders', isLoading)
    }
    return () => {
      if (setPageLoading) {
        setPageLoading('orders', false)
      }
    }
  }, [isLoading, setPageLoading])
  const [confirmCancelOrderId, setConfirmCancelOrderId] = useState(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [pendingEditOrder, setPendingEditOrder] = useState(null)

  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(String(dateString).replace(' ', 'T'));
    if (isNaN(date.getTime())) return dateString;

    const datePart = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).replace(',', '');

    const timePart = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return `${datePart}, ${timePart}`;
  }

  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    setErrorMsg('')

    try {
      const login = user?.username || 'admin'
      const apiKey = user?.apiKey || localStorage.getItem('api-key') || ''
      const API_BASE = (Capacitor.isNativePlatform() || !import.meta.env.DEV)
        ? 'http://192.168.29.99:8019'
        : '/api'

      const url = `${API_BASE}/order_list`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'login': login,
          'api-key': apiKey,
          'lang': i18n.language === 'gu' ? 'gu' : 'en'
        }
      })

      if (response.status === 401 || response.status === 403) {
        onLogout()
        return
      }

      if (!response.ok) {
        throw new Error(t('orders_error'))
      }

      const data = await response.json()
      let fetchedOrders = []
      if (data && data.records && Array.isArray(data.records)) {
        fetchedOrders = data.records
      } else if (Array.isArray(data)) {
        fetchedOrders = data
      }


      setOrders(fetchedOrders)
    } catch (err) {
      console.error('Error fetching orders:', err)
      let msg = t('orders_error')
      if (!navigator.onLine) {
        msg = t('no_internet_connection')
      } else if (err.name === 'TypeError') {
        msg = t('server_connection_failed')
      } else if (err.message) {
        msg = err.message
      }
      setErrorMsg(msg)
    } finally {
      setIsLoading(false)
    }
  }, [user, onLogout, t, i18n.language])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleRefresh = async () => {
    await fetchOrders()
  }

  const isDraft = (state) => {
    const s = String(state || '').toLowerCase()
    return s.includes('draft') || s.includes('ડ્રાફ્ટ')
  }

  const handleCancelOrder = async (orderId) => {
    setIsCancelling(true)
    try {
      const login = user?.username || 'admin'
      const apiKey = user?.apiKey || localStorage.getItem('api-key') || ''
      const API_BASE = (Capacitor.isNativePlatform() || !import.meta.env.DEV)
        ? 'http://192.168.29.99:8019'
        : '/api'

      const url = `${API_BASE}/cancel_order`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'login': login,
          'api-key': apiKey,
          'lang': i18n.language === 'gu' ? 'gu' : 'en'
        },
        body: JSON.stringify({
          order_id: Number(orderId)
        })
      })

      const data = await response.json()
      if (response.ok && data.status === 'success') {
        addToast(t('order_cancelled'), 'success')
        fetchOrders()
      } else {
        const errorText = data.message || t('cancel_failed')
        addToast(errorText, 'error')
      }
    } catch (err) {
      console.error('Error cancelling order:', err)
      addToast(t('cancel_failed'), 'error')
    } finally {
      setIsCancelling(false)
      setConfirmCancelOrderId(null)
    }
  }

  const handleEditClick = (order) => {
    if (editingOrder && editingOrder.order_id !== order.order_id) {
      setPendingEditOrder(order)
    } else {
      startEditingOrder(order)
      addToast(t('edit_order_banner', { orderNumber: order.order_number }), 'success')
      navigate('/cart')
    }
  }

  const handleConfirmConflict = () => {
    if (pendingEditOrder) {
      discardEditingOrder()
      startEditingOrder(pendingEditOrder)
      addToast(t('edit_order_banner', { orderNumber: pendingEditOrder.order_number }), 'success')
      setPendingEditOrder(null)
      navigate('/cart')
    }
  }

  // Get status color styles
  const getStateBadgeClass = (state) => {
    const s = String(state || '').toLowerCase()
    if (s.includes('draft') || s.includes('ડ્રાફ્ટ')) {
      return 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-350'
    }
    if (s.includes('cancel') || s.includes('રદ') || s.includes('કૅન્સલ')) {
      return 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-350'
    }
    if (s.includes('sale') || s.includes('વેચાણ') || s.includes('done') || s.includes('પૂર્ણ') || s.includes('સફળ')) {
      return 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-350'
    }
    // Default standard warning status badge (e.g. pending, quotation sent)
    return 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-350'
  }

  const ordersContent = (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="p-2.5 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-450 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl transition-all cursor-pointer flex items-center justify-center"
          title={t('back_to_landing')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 margin-0">
            {t('order_history')}
          </h2>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 rounded-xl text-sm border flex items-start gap-3 transition-all duration-300 bg-rose-50/60 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-350">
          <svg className="w-5 h-5 flex-shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`order-skeleton-${i}`}
              className="bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 animate-pulse space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24"></div>
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-36"></div>
                </div>
                <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-16"></div>
              </div>
              <div className="border-t border-zinc-200 dark:border-zinc-850 pt-4 space-y-3">
                <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3"></div>
                <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && orders.length === 0 && !errorMsg && (
        <div className="p-12 bg-zinc-50/50 dark:bg-zinc-900/20 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center text-sm text-zinc-500 font-medium">
          <p className="font-semibold text-zinc-900 dark:text-zinc-50 text-base">{t('no_orders')}</p>
          <p className="text-zinc-550 dark:text-zinc-400 text-xs mt-1">{t('no_orders_subtext')}</p>
        </div>
      )}

      {/* Orders List */}
      {!isLoading && orders.length > 0 && (
        <div className="space-y-6">
          {orders.map(order => (
            <div
              key={order.order_id}
              className="bg-zinc-50/60 dark:bg-zinc-900/10 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 relative text-left"
            >
              {/* Order Header info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider">{t('order_number')}</span>
                    <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 font-mono">
                      {order.order_number}
                    </h4>
                  </div>
                  <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-medium">
                    {t('order_date')}: <span className="font-mono text-zinc-800 dark:text-zinc-300">{formatDate(order.date_order)}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className={`px-2.5 py-0.5 border text-[16px] font-bold rounded-full ${getStateBadgeClass(order.state)}`}>
                    {order.state}
                  </span>
                </div>
              </div>

              {/* Order Lines items */}
              {Array.isArray(order.order_lines) && order.order_lines.length > 0 && (
                <div className="py-4 space-y-3">
                  <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider mb-2">
                    {t('order_details')}
                  </p>

                  <div className="divide-y divide-zinc-150 dark:divide-zinc-850">
                    {order.order_lines.map((line, idx) => (
                      <div
                        key={`${order.order_id}-line-${idx}`}
                        className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <OrderProductImage src={line.image} name={line.product_name} />
                          <div className="text-left">
                            <h5 className="font-semibold text-xs text-zinc-900 dark:text-white leading-snug line-clamp-1">
                              {(line.display_name || line.product_name || '').replace(/\[[^\]]*\]/g, '')}
                            </h5>
                            <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-0.5">
                              {line.qty} {line.uom || 'Units'} &times; ₹{Number(line.price_unit).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <div className="text-right min-w-[70px]">
                          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                            ₹{Number(line.subtotal).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Footer Total & Actions */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-500 dark:text-zinc-450">
                    {t('total_price')}
                  </span>
                  <span className="font-extrabold text-[#6941c6] dark:text-purple-400 text-sm">
                    ₹{Number(order.amount_total).toFixed(2)}
                  </span>
                </div>

                {isDraft(order.state) && (
                  <div className="flex items-center justify-end gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => handleEditClick(order)}
                      className="px-3.5 py-1.5 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-850 rounded-lg text-[11px] dark:hover:text-black font-bold transition-all cursor-pointer"
                    >
                      {t('edit_btn')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmCancelOrderId(order.order_id)}
                      className="px-3.5 py-1.5 border border-rose-250 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-955/10 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                    >
                      {t('cancel_btn')}
                    </button>
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <>
      {Capacitor.isNativePlatform() ? (
        <PullToRefresh
          onRefresh={handleRefresh}
          resistance={2.5}
          pullDownThreshold={95}
          maxPullDownDistance={140}
          pullingContent={<PullingIndicator />}
          refreshingContent={<RefreshingIndicator />}
        >
          {ordersContent}
        </PullToRefresh>
      ) : (
        ordersContent
      )}

      {/* Custom Confirmation Modal */}
      {confirmCancelOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4 text-center">
            {/* Warning Icon */}
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-450">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                {t('cancel_btn')}
              </h3>
              <p className="text-sm text-zinc-550 dark:text-zinc-400">
                {t('cancel_order_confirm')}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => setConfirmCancelOrderId(null)}
                className="flex-1 px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-white dark:hover:text-black hover:bg-zinc-50 dark:hover:bg-zinc-850 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                {t('go_back')}
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => handleCancelOrder(confirmCancelOrderId)}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isCancelling ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : null}
                <span>{t('cancel_btn')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Conflict Modal */}
      {pendingEditOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-fade-in text-left">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-450">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                {t('edit_btn')}
              </h3>
              <p className="text-sm text-zinc-555 dark:text-zinc-400">
                {t('edit_order_conflict')}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPendingEditOrder(null)}
                className="flex-1 px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-white dark:hover:text-black hover:bg-zinc-50 dark:hover:bg-zinc-850 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                {t('go_back')}
              </button>
              <button
                type="button"
                onClick={handleConfirmConflict}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                {t('discard_changes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
