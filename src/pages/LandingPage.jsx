import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getApiBaseUrl, customFetch } from '../utils/api'
import { CategoryImage, getCategoryTheme } from './CategoriesPage'


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

  const [selectedParentCategory, setSelectedParentCategory] = useState(null)
  const [childCategories, setChildCategories] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  const showSubcategoriesPopup = useCallback((parent, children) => {
    setSelectedParentCategory(parent)
    setChildCategories(children)
    setIsOpen(true)
    setIsClosing(false)
  }, [])

  const handleClosePopup = useCallback((callback) => {
    setIsClosing(true)
    setTimeout(() => {
      setIsOpen(false)
      setIsClosing(false)
      setSelectedParentCategory(null)
      setChildCategories([])
      if (callback && typeof callback === 'function') {
        callback()
      }
    }, 180)
  }, [])

  // Modal Escape key & Scroll lock
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClosePopup()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClosePopup])

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
    }
    return () => {
      document.body.classList.remove('overflow-hidden')
    }
  }, [isOpen])

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

      await customFetch(`${API_BASE}/edit_profile`, {
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

  const [prevPath, setPrevPath] = useState(location.pathname)
  const [transitionClass, setTransitionClass] = useState('')

  const getPathIndex = (path) => {
    if (path === '/' || path.startsWith('/products/')) return 0
    if (path === '/cart') return 1
    if (path === '/orders') return 2
    if (path === '/user') return 3
    return 0
  }

  useEffect(() => {
    if (location.pathname === prevPath) return

    const prevIdx = getPathIndex(prevPath)
    const currentIdx = getPathIndex(location.pathname)

    let direction = ''

    if (currentIdx > prevIdx) {
      direction = 'animate-slide-from-right'
    } else if (currentIdx < prevIdx) {
      direction = 'animate-slide-from-left'
    }

    setTransitionClass(direction)
    setPrevPath(location.pathname)
  }, [location.pathname, prevPath])

  const totalCartQty = cart.reduce((sum, item) => sum + item.quantity, 0)
  const currentPath = location.pathname
  const isHomeActive = currentPath === '/' || currentPath.startsWith('/products/')
  const isCartActive = currentPath === '/cart'
  const isOrdersActive = currentPath === '/orders'
  const isUserActive = currentPath === '/user'

  const mainContent = (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col gap-6 overflow-y-auto overflow-x-hidden">
      <div key={location.pathname} className={`flex-1 flex flex-col gap-6 ${transitionClass}`}>
        <Outlet context={{
          addToast,
          editingOrder,
          startEditingOrder,
          discardEditingOrder,
          saveEditedOrder: onSaveEditedOrder,
          setPageLoading,
          isLanguageUpdating,
          showSubcategoriesPopup
        }} />
      </div>
    </main>
  )

  return (
    <div className="fixed inset-0 bg-zinc-50 dark:bg-[#0b0416] flex flex-col overflow-hidden transition-colors duration-300">
      
      {/* Background Blur Blobs */}
      <div className="absolute top-[10%] left-[10%] w-[450px] h-[450px] rounded-full bg-brand-red/10 dark:bg-brand-red/5 blur-[120px] pointer-events-none select-none"></div>
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-brand-red/5 blur-[120px] pointer-events-none select-none"></div>

      {/* Main Container - Full height flexbox, overflow hidden */}
      <div className="w-full h-full flex flex-col relative z-10 bg-white/70 dark:bg-[#0b0416]/20 backdrop-blur-md transition-colors duration-300 overflow-hidden">
        
        {/* Header - Fixed to top, will not scroll */}
        <header className="flex-shrink-0 z-40 w-full bg-zinc-100/90 dark:bg-[#05020a]/90 backdrop-blur-md border-b border-purple-650/40 dark:border-purple-400/30 px-4 md:px-6 py-3 flex items-center justify-between transition-colors duration-300">
          <div className="flex items-center gap-6">
            {/* Branding Logo */}
            <div className="flex items-center gap-1.5 cursor-pointer select-none" onClick={() => navigate('/')}>
              <span className="font-extrabold text-xl tracking-tight text-brand-red uppercase">
                CRMAPP
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => navigate('/')}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${isHomeActive
                  ? 'text-brand-red bg-brand-red/10'
                  : 'text-zinc-650 hover:text-zinc-900 dark:text-zinc-100 dark:hover:text-zinc-100'
                  }`}
              >
                <span>{t('home') || 'Home'}</span>
              </button>

              <button
                onClick={() => navigate('/cart')}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer relative ${isCartActive
                  ? 'text-brand-red bg-brand-red/10'
                  : 'text-zinc-650 hover:text-zinc-900 dark:text-zinc-100 dark:hover:text-zinc-100'
                  }`}
              >
                <span>{t('cart') || 'Cart'}</span>
                {totalCartQty > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-brand-red text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {totalCartQty}
                  </span>
                )}
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Toggle Button */}
            <button
              type="button"
              disabled={isContentLoading || isLanguageUpdating}
              onClick={handleLanguageSwitch}
              className="h-9 p-1 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 rounded-full flex items-center gap-2 text-zinc-700 dark:text-zinc-300 text-xs font-semibold cursor-pointer select-none transition-all duration-300 disabled:opacity-50"
              title={t('preferred_language')}
            >
              {i18n.language === 'en' ? (
                <>
                  {/* Circle 'en' on the left */}
                  <span className="w-7 h-7 rounded-full bg-white text-brand-red flex items-center justify-center font-extrabold text-[10px] uppercase shadow-sm">
                    en
                  </span>
                  {/* Label 'English' on the right */}
                  <span className="pr-2.5">English</span>
                </>
              ) : (
                <>
                  {/* Label 'ગુજરાતી' on the left */}
                  <span className="pl-2.5">ગુજરાતી</span>
                  {/* Circle 'ગુ' on the right */}
                  <span className="w-7 h-7 rounded-full bg-white text-brand-red flex items-center justify-center font-extrabold text-[10px] shadow-sm">
                    ગુ
                  </span>
                </>
              )}
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
          <div className="flex-shrink-0 w-full bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-200/50 dark:border-amber-900/30 backdrop-blur-md px-4 py-2.5 flex items-center justify-between gap-3 animate-fade-in z-30">
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
        <nav className="flex-shrink-0 md:hidden bg-zinc-100/95 dark:bg-[#05020a]/95 border-t border-purple-650/40 dark:border-purple-400/30 pb-safe-bottom z-30 transition-colors duration-300">
          <div className="w-full max-w-md mx-auto flex items-center justify-between py-2.5 px-4">

            {/* Home Tab */}
            <button
              id="nav-tab-0"
              onClick={() => navigate('/')}
              className={`w-[25%] flex flex-col items-center gap-1 py-1 cursor-pointer transition-all duration-200 ${isHomeActive
                ? 'text-brand-red dark:text-purple-400 scale-105'
                : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
                }`}
            >
              <svg className="w-5 h-5 transition-all duration-200" fill="none" stroke="currentColor" strokeWidth={isHomeActive ? "2.6" : "2"} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              <span className={`text-[10px] tracking-wide leading-none transition-all duration-200 ${isHomeActive ? 'font-bold' : 'font-medium'}`}>{t('home') || 'Home'}</span>
            </button>

            {/* Cart Tab */}
            <button
              id="nav-tab-1"
              onClick={() => navigate('/cart')}
              className={`w-[25%] flex flex-col items-center gap-1 py-1 cursor-pointer transition-all duration-200 relative ${isCartActive
                ? 'text-brand-red dark:text-purple-400 scale-105'
                : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
                }`}
            >
              <div className="relative">
                <svg className="w-5 h-5 transition-all duration-200" fill="none" stroke="currentColor" strokeWidth={isCartActive ? "2.6" : "2"} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
                {totalCartQty > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] px-1 rounded-full bg-brand-red text-white text-[7.5px] font-extrabold flex items-center justify-center shadow-sm border border-white dark:border-zinc-950 animate-pulse z-20">
                    {totalCartQty}
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-wide leading-none transition-all duration-200 ${isCartActive ? 'font-bold' : 'font-medium'}`}>{t('cart') || 'Cart'}</span>
            </button>

            {/* Orders Tab */}
            <button
              id="nav-tab-2"
              onClick={() => navigate('/orders')}
              className={`w-[25%] flex flex-col items-center gap-1 py-1 cursor-pointer transition-all duration-200 ${isOrdersActive
                ? 'text-brand-red dark:text-purple-400 scale-105'
                : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
                }`}
            >
              <svg className="w-5 h-5 transition-all duration-200" fill="none" stroke="currentColor" strokeWidth={isOrdersActive ? "2.6" : "2"} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span className={`text-[10px] tracking-wide leading-none transition-all duration-200 ${isOrdersActive ? 'font-bold' : 'font-medium'}`}>{t('my_orders') || 'Orders'}</span>
            </button>

            {/* User Tab */}
            <button
              id="nav-tab-3"
              onClick={() => navigate('/user')}
              className={`w-[25%] flex flex-col items-center gap-1 py-1 cursor-pointer transition-all duration-200 ${isUserActive
                ? 'text-brand-red dark:text-purple-400 scale-105'
                : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
                }`}
            >
              <svg className="w-5 h-5 transition-all duration-200" fill="none" stroke="currentColor" strokeWidth={isUserActive ? "2.6" : "2"} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <span className={`text-[10px] tracking-wide leading-none transition-all duration-200 ${isUserActive ? 'font-bold' : 'font-medium'}`}>{t('profile') || 'User'}</span>
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
      )}      {/* Subcategory Popup Modal (Binds whole landing page with absolute blur) */}
      {isOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleClosePopup()
            }
          }}
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-zinc-900/60 dark:bg-black/65 ${
            isClosing ? 'backdrop-fade-out' : 'backdrop-fade-in'
          }`}
        >
          <div 
            className={`bg-zinc-50/95 dark:bg-zinc-900/95 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl w-full max-w-md p-6 shadow-2xl relative flex flex-col max-h-[80vh] backdrop-blur-xl ${
              isClosing ? 'popup-shrink' : 'popup-expand'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200/50 dark:border-zinc-800/50">
              <div className="text-left">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
                  {selectedParentCategory?.name || selectedParentCategory?.display_name}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {t('select_subcategory') || 'Select a Subcategory'}
                </p>
              </div>
              <button 
                onClick={() => handleClosePopup()}
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-colors duration-200 focus:outline-none"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body (Scrollable grid/list of subcategories using category card design) */}
            <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-3 custom-scrollbar">
              {childCategories.map((child) => {
                const theme = getCategoryTheme(child.id, child.name)
                return (
                  <div
                    key={child.id}
                    id={`child-category-card-${child.id}`}
                    onClick={() => {
                      handleClosePopup(() => {
                        navigate(`/products/${child.id}`, { state: { category: child } })
                      })
                    }}
                    className="category-card flex items-center justify-between p-3.5 sm:p-5 rounded-2xl border hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 group cursor-pointer select-none h-20 shadow-sm"
                    style={{
                      '--cat-bg-light': theme.light.bg,
                      '--cat-bg-dark': theme.dark.bg,
                      '--cat-text-light': theme.light.text,
                      '--cat-text-dark': theme.dark.text,
                      '--cat-subtext-light': theme.light.subtext,
                      '--cat-subtext-dark': theme.dark.subtext,
                      '--cat-border-light': theme.light.border,
                      '--cat-border-dark': theme.dark.border,
                    }}
                  >
                    <div className="flex-1 pr-3 text-left">
                      <h4 className="category-card-title font-extrabold text-sm sm:text-base tracking-tight leading-tight line-clamp-1">
                        {child.name || child.display_name}
                      </h4>
                      <p className="category-card-subtext text-[9px] sm:text-[10px] font-semibold mt-0.5 sm:mt-1">
                        {t('browse_products') || 'Browse Products'}
                      </p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      <CategoryImage src={child.image} name={child.name} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
      <style>{`
        .category-card {
          background-color: var(--cat-bg-light);
          color: var(--cat-text-light);
          border-color: var(--cat-border-light);
        }
        .dark .category-card {
          background-color: var(--cat-bg-dark);
          color: var(--cat-text-dark);
          border-color: var(--cat-border-dark);
        }
        .category-card-title {
          color: var(--cat-text-light);
        }
        .dark .category-card-title {
          color: var(--cat-text-dark);
        }
        .category-card-subtext {
          color: var(--cat-subtext-light);
        }
        .dark .category-card-subtext {
          color: var(--cat-subtext-dark);
        }
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
        @keyframes slideFromRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideFromLeft {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-from-right {
          animation: slideFromRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-from-left {
          animation: slideFromLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes popup-expand {
          0% {
            transform: scale(0.93) translateY(8px);
            opacity: 0;
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
        @keyframes popup-shrink {
          0% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
          100% {
            transform: scale(0.93) translateY(8px);
            opacity: 0;
          }
        }
        .popup-expand {
          animation: popup-expand 0.22s cubic-bezier(0.34, 1.3, 0.64, 1) forwards;
        }
        .popup-shrink {
          animation: popup-shrink 0.18s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        @keyframes backdrop-fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes backdrop-fade-out {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        .backdrop-fade-in {
          animation: backdrop-fade-in 0.22s ease-out forwards;
        }
        .backdrop-fade-out {
          animation: backdrop-fade-out 0.18s ease-in forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e4e4e7;
          border-radius: 9999px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
        }
      `}</style>
    </div>
  )
}
