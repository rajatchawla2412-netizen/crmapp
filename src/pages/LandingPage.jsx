import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getApiBaseUrl } from '../utils/api'

export default function LandingPage({
  user,
  onLogout,
  cart,
  editingOrder,
  startEditingOrder,
  discardEditingOrder,
  onSaveEditedOrder,
  onDiscardEditedOrder
}) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [toasts, setToasts] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const [isLanguageUpdating, setIsLanguageUpdating] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

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

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSaveEditedOrder()
      addToast(t('order_updated_success') || 'Order updated successfully', 'success')
      navigate('/orders')
    } catch (err) {
      console.error(err)
      addToast(err.message || t('order_error_default') || 'Failed to update order', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDiscardConfirm = () => {
    onDiscardEditedOrder()
    addToast(t('cart_emptied_toast') || 'Changes discarded', 'success')
    setShowDiscardConfirm(false)
    navigate('/orders')
  }

  const [loadingMap, setLoadingMap] = useState({})
  const setPageLoading = useCallback((key, isLoading) => {
    setLoadingMap(prev => {
      if (prev[key] === isLoading) return prev
      return { ...prev, [key]: isLoading }
    })
  }, [])
  const isContentLoading = Object.values(loadingMap).some(Boolean)

  const handleLanguageSwitch = async () => {
    if (isLanguageUpdating) return
    setIsLanguageUpdating(true)

    const nextLang = i18n.language === 'en' ? 'gu' : 'en'

    try {
      const login = user?.username || 'admin'
      const apiKey = user?.apiKey || localStorage.getItem('api-key') || ''
      const db = user?.db || localStorage.getItem('server-db') || ''
      const apiLangCode = nextLang === 'en' ? 'en_US' : 'gu_IN'

      const API_BASE = getApiBaseUrl()

      await fetch(`${API_BASE}/edit_profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'login': login,
          'api-key': apiKey,
          'db': db
        },
        body: JSON.stringify({
          lang: apiLangCode
        })
      })
    } catch (err) {
      console.error('Failed to update language on backend profile:', err)
    } finally {
      i18n.changeLanguage(nextLang)
      localStorage.setItem('language', nextLang)
      setIsLanguageUpdating(false)
    }
  }

  const handleLogoutClick = () => {
    const confirmLogout = window.confirm(t('logout_confirm') || 'Are you sure you want to logout?')
    if (confirmLogout) {
      onLogout(false)
    }
  }

  const handleFullLogoutClick = () => {
    const confirmLogout = window.confirm(t('reset_logout_confirm') || 'Are you sure you want to clear server settings and logout?')
    if (confirmLogout) {
      onLogout(true)
    }
  }

  // Click outside dropdown handler
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const totalCartQty = cart.reduce((sum, item) => sum + item.quantity, 0)
  const currentPath = location.pathname
  const isHomeActive = currentPath === '/' || currentPath.startsWith('/products/')
  const isCartActive = currentPath === '/cart'
  const isUserActive = currentPath === '/user' || currentPath === '/orders'

  const mainContent = (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col gap-6 overflow-y-auto">
      <Outlet context={{
        addToast,
        editingOrder,
        startEditingOrder,
        discardEditingOrder,
        saveEditedOrder: onSaveEditedOrder,
        setPageLoading,
        isLanguageUpdating
      }} />
    </main>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/60 via-zinc-50 to-purple-50/60 dark:from-[#080512] dark:via-zinc-950 dark:to-[#120a2b] flex flex-col relative overflow-hidden transition-colors duration-300">
      
      {/* Background Blur Blobs */}
      <div className="absolute top-[10%] left-[10%] w-[450px] h-[450px] rounded-full bg-brand-600/10 dark:bg-brand-600/5 blur-[120px] pointer-events-none select-none"></div>
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] pointer-events-none select-none"></div>

      {/* Main Container - Full width on desktop, phone padding on mobile */}
      <div className="w-full flex-1 flex flex-col pb-20 md:pb-0 relative z-10 bg-white/40 dark:bg-zinc-950/20 backdrop-blur-md transition-colors duration-300">
        
        {/* Sticky Header with Responsive elements */}
        <header className="sticky top-0 z-40 w-full bg-white/30 dark:bg-zinc-950/30 backdrop-blur-md border-b border-zinc-200/30 dark:border-zinc-800/35 px-4 md:px-6 py-4 flex items-center justify-between transition-colors duration-300">
          <div className="flex items-center gap-6">
            {/* Branding Logo */}
            <div className="flex items-center gap-2.5 cursor-pointer select-none" onClick={() => navigate('/')}>
              <svg className="w-7 h-7" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="8" y="8" width="34" height="34" rx="10" fill="#3A6DFF" />
                <rect x="22" y="22" width="34" height="34" rx="10" fill="#4B6BFB" />
                <rect x="21" y="21" width="22" height="22" rx="6" fill="#FFFFFF" />
              </svg>
              <span className="font-bold text-base tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-zinc-100 dark:to-zinc-400 bg-clip-text text-transparent">
                crmapp
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => navigate('/')}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isHomeActive
                    ? 'text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/20'
                    : 'text-zinc-650 hover:text-zinc-900 dark:text-zinc-350 dark:hover:text-zinc-100'
                }`}
              >
                <span>{t('home') || 'Home'}</span>
              </button>

              <button
                onClick={() => navigate('/cart')}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer relative ${
                  isCartActive
                    ? 'text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/20'
                    : 'text-zinc-650 hover:text-zinc-900 dark:text-zinc-350 dark:hover:text-zinc-100'
                }`}
              >
                <span>{t('cart') || 'Cart'}</span>
                {totalCartQty > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#6941c6] text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {totalCartQty}
                  </span>
                )}
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Switch Button */}
            <button
              type="button"
              disabled={isContentLoading || isLanguageUpdating}
              onClick={handleLanguageSwitch}
              className="px-3.5 py-1.5 bg-white/40 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 rounded-full text-xs font-semibold text-zinc-650 dark:text-zinc-300 hover:bg-white/80 dark:hover:bg-zinc-800/80 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title={t('preferred_language')}
            >
              <svg className="w-4 h-4 text-zinc-450 dark:text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-.554-8.243-1.548m16.5 0a8.997 8.997 0 01-1.863 5.06M3.91 9c.18-.287.375-.56.586-.816m-.586.816A9.004 9.004 0 003 12c0 2.083.704 3.999 1.884 5.517m0 0a8.997 8.997 0 007.843 4.582M12 3c.132 0 .263.003.394.01M12 3c-.132 0-.263.003-.394.01"></path>
              </svg>
              <span>{i18n.language === 'en' ? 'ગુજરાતી' : 'English'}</span>
            </button>

            {/* Desktop User Profile Dropdown */}
            <div className="hidden md:block relative border-l border-zinc-200/50 dark:border-zinc-800/50 pl-4" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2.5 hover:opacity-85 transition-opacity focus:outline-none cursor-pointer"
                aria-expanded={showDropdown}
              >
                {user?.image ? (
                  <img
                    src={user.image}
                    alt={user.username}
                    className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold text-xs">
                    {user?.firstName?.charAt(0) || 'U'}
                  </div>
                )}
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-350">
                  {user ? `${user.firstName} ${user.lastName}` : 'Operator'}
                </span>
                <svg className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2.5 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 animate-fade-in text-left overflow-hidden">
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        navigate('/orders')
                        setShowDropdown(false)
                      }}
                      className="w-full px-4 py-2.5 text-xs font-medium text-zinc-750 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-950 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <svg className="w-4 h-4 text-zinc-450 dark:text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>{t('my_orders') || 'My Orders'}</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        navigate('/user')
                        setShowDropdown(false)
                      }}
                      className="w-full px-4 py-2.5 text-xs font-medium text-zinc-750 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-950 flex items-center gap-2 cursor-pointer transition-colors border-t border-zinc-100 dark:border-zinc-900"
                    >
                      <svg className="w-4 h-4 text-zinc-455 dark:text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{t('profile') || 'User Profile'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowDropdown(false)
                        handleLogoutClick()
                      }}
                      className="w-full px-4 py-2.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-955/20 flex items-center gap-2 cursor-pointer transition-colors border-t border-zinc-100 dark:border-zinc-900"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                      </svg>
                      <span>{t('logout_btn') || 'Logout'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Edit Order Banner */}
        {editingOrder && (
          <div className="w-full bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-200/50 dark:border-amber-900/30 backdrop-blur-md px-4 py-2.5 flex items-center justify-between gap-3 animate-fade-in z-30">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <p className="text-[10px] font-bold text-amber-850 dark:text-amber-300">
                {t('edit_order_banner', { orderNumber: editingOrder.order_number })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSave}
                className="px-2.5 py-1 bg-amber-650 hover:bg-amber-700 text-white rounded-md text-[10px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
              >
                {isSaving && <span className="w-2.5 h-2.5 border border-white/30 border-t-white rounded-full animate-spin"></span>}
                <span>{t('save_changes')}</span>
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setShowDiscardConfirm(true)}
                className="px-2.5 py-1 border border-amber-250 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 rounded-md text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                {t('discard_changes')}
              </button>
            </div>
          </div>
        )}

        {/* Content Outlet */}
        {mainContent}

        {/* Bottom Tab Bar (Visible on Mobile only, hidden on Desktop) */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/30 dark:bg-zinc-950/30 backdrop-blur-md border-t border-zinc-200/30 dark:border-zinc-800/35 pb-safe-bottom">
          <div className="flex items-center justify-around py-3 px-4">
            {/* Home Tab */}
            <button
              onClick={() => navigate('/')}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-all duration-200 active:scale-95 ${
                isHomeActive
                  ? 'text-brand-600 dark:text-brand-400 font-bold scale-105'
                  : 'text-zinc-400 hover:text-zinc-550 dark:hover:text-zinc-350'
              }`}
            >
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              <span className="text-[10px] tracking-wide">{t('home') || 'Home'}</span>
            </button>

            {/* Cart Tab */}
            <button
              onClick={() => navigate('/cart')}
              className={`relative flex flex-col items-center gap-1 cursor-pointer transition-all duration-200 active:scale-95 ${
                isCartActive
                  ? 'text-brand-600 dark:text-brand-400 font-bold scale-105'
                  : 'text-zinc-400 hover:text-zinc-555 dark:hover:text-zinc-350'
              }`}
            >
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              {totalCartQty > 0 && (
                <span className="absolute -top-1.5 right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-[#6941c6] text-white text-[8px] font-bold flex items-center justify-center shadow-sm animate-pulse">
                  {totalCartQty}
                </span>
              )}
              <span className="text-[10px] tracking-wide">{t('cart') || 'Cart'}</span>
            </button>

            {/* User Tab */}
            <button
              onClick={() => navigate('/user')}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-all duration-200 active:scale-95 ${
                isUserActive
                  ? 'text-brand-600 dark:text-brand-400 font-bold scale-105'
                  : 'text-zinc-400 hover:text-zinc-555 dark:hover:text-zinc-350'
              }`}
            >
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <span className="text-[10px] tracking-wide">{t('profile') || 'User'}</span>
            </button>
          </div>
        </nav>

      </div>

      {/* Toast Notification Container - Pushed to bottom-20 on mobile, bottom-6 on desktop */}
      <div className="fixed bottom-20 md:bottom-6 left-6 right-6 sm:left-auto sm:right-6 z-[100] flex flex-col gap-3 max-w-none sm:max-w-sm pointer-events-none text-left">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-zinc-950/90 dark:bg-zinc-900/90 text-zinc-50 border border-zinc-800/80 rounded-xl p-4 shadow-xl flex items-center justify-between gap-3 animate-slide-in backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${toast.type === 'error'
                  ? 'bg-rose-500/20 border border-rose-500/30 text-rose-400'
                  : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                }`}>
                {toast.type === 'error' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </div>
              <p className="text-xs font-semibold leading-relaxed">
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-zinc-555 hover:text-zinc-350 transition-colors p-1 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Custom Discard Confirmation Modal */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-fade-in text-left">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-450">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>

            <div className="space-y-2 text-center">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                {t('discard_changes')}
              </h3>
              <p className="text-sm text-zinc-555 dark:text-zinc-400">
                {t('discard_edit_confirm')}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-850 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                {t('go_back')}
              </button>
              <button
                type="button"
                onClick={handleDiscardConfirm}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>{t('discard_changes')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
