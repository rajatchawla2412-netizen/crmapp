import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Navbar({ user, onLogout, cart, isContentLoading }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogoutClick = () => {
    const confirmLogout = window.confirm(t('logout_confirm'))
    if (confirmLogout) {
      onLogout()
    }
  }

  // Total Quantity in Cart for Badge
  const totalCartQty = cart.reduce((sum, item) => sum + item.quantity, 0)
  const isCartActive = location.pathname === '/cart'

  return (
    <nav className="w-full bg-zinc-50/80 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md transition-colors duration-300">
      {/* Brand logo link */}
      <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => navigate('/')}>
        <svg className="w-8 h-8" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="8" width="34" height="34" rx="10" fill="#3A6DFF" />
          <rect x="22" y="22" width="34" height="34" rx="10" fill="#4B6BFB" />
          <rect x="21" y="21" width="22" height="22" rx="6" fill="#FFFFFF" />
        </svg>
        <span className="font-semibold text-lg tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-zinc-100 dark:to-zinc-400 bg-clip-text text-transparent">
          crmapp
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Language Switcher button */}
        <button
          type="button"
          disabled={isContentLoading}
          onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'gu' : 'en')}
          className="px-3.5 py-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs font-semibold text-zinc-650 dark:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title={t('preferred_language')}
        >
          <svg className="w-4 h-4 text-zinc-450 dark:text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-.554-8.243-1.548m16.5 0a8.997 8.997 0 01-1.863 5.06M3.91 9c.18-.287.375-.56.586-.816m-.586.816A9.004 9.004 0 003 12c0 2.083.704 3.999 1.884 5.517m0 0a8.997 8.997 0 007.843 4.582M12 3c.132 0 .263.003.394.01M12 3c-.132 0-.263.003-.394.01"></path>
          </svg>
          <span className="hidden sm:inline">{i18n.language === 'en' ? 'ગુજરાતી' : 'English'}</span>
          <span className="sm:hidden">{i18n.language === 'en' ? 'ગુ' : 'EN'}</span>
        </button>

        {/* Cart Icon Button with Quantity Badge */}
        <button
          type="button"
          onClick={() => navigate(isCartActive ? '/' : '/cart')}
          className={`relative p-2.5 border rounded-xl transition-all cursor-pointer flex items-center justify-center ${isCartActive
            ? 'border-purple-600 text-purple-650 bg-purple-50/50 dark:border-purple-500/30 dark:text-purple-400 dark:bg-purple-900/20'
            : 'border-zinc-200 dark:border-zinc-800 text-zinc-655 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
          }`}
          title={t('view_cart')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
          {totalCartQty > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#6941c6] text-white text-[9px] font-bold flex items-center justify-center animate-pulse shadow-sm">
              {totalCartQty}
            </span>
          )}
        </button>

        {/* User Dropdown toggle wrapper */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 pl-3 border-l border-zinc-200 dark:border-zinc-850 hover:opacity-85 transition-opacity focus:outline-none cursor-pointer"
            aria-expanded={showDropdown}
            aria-haspopup="true"
          >
            {user?.image ? (
              <img
                src={user.image}
                alt={user.username}
                className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800"
              />
            ) : (
              <div className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold text-xs">
                OP
              </div>
            )}
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                {user ? `${user.firstName} ${user.lastName}` : 'Operator'}
              </p>
              <p className="text-[10px] text-zinc-455 dark:text-zinc-550 font-mono">
                @{user?.username || 'user'}
              </p>
            </div>
            <svg className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {/* Floating Dropdown Card */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 animate-fade-in text-left overflow-hidden">
              <div className="py-1">
                {/* My Orders option */}
                <button
                  type="button"
                  onClick={() => {
                    navigate('/orders')
                    setShowDropdown(false)
                  }}
                  className="w-full px-4 py-2.5 text-xs font-medium text-zinc-700 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <svg className="w-4 h-4 text-zinc-450 dark:text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{t('my_orders')}</span>
                </button>

                {/* Logout option */}
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
                  <span>{t('logout_btn')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
