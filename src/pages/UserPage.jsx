import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function UserPage({ user, onLogout }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

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

  return (
    <div className="flex-1 flex flex-col gap-6 animate-fade-in">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center p-6 bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/40 rounded-3xl backdrop-blur-md">
        {user?.image ? (
          <img
            src={user.image}
            alt={user.username}
            className="w-20 h-20 rounded-full border-2 border-brand-500 shadow-md bg-zinc-100 dark:bg-zinc-800 mb-4"
          />
        ) : (
          <div className="w-20 h-20 rounded-full border-2 border-brand-500 bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-2xl mb-4 shadow-inner">
            {user?.firstName?.charAt(0) || 'U'}
          </div>
        )}

        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          {user ? `${user.firstName} ${user.lastName}` : 'Operator'}
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-mono mt-1">
          @{user?.username || 'username'}
        </p>

        <div className="mt-4 px-3 py-1 bg-brand-50 dark:bg-brand-950/30 border border-brand-100/50 dark:border-brand-900/30 rounded-full text-xs font-semibold text-brand-650 dark:text-brand-400 dark:text-white">
          Database: <span className="font-mono">{user?.db || 'rest_api'}</span>
        </div>
      </div>

      {/* Navigation & Action Options */}
      <div className="flex flex-col gap-3">
        {/* My Orders Button */}
        <button
          type="button"
          onClick={() => navigate('/orders')}
          className="w-full flex items-center justify-between p-4 bg-white dark:bg-zinc-900/30 border border-zinc-200/60 dark:border-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-2xl cursor-pointer transition-all shadow-sm active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100/40 dark:border-indigo-900/30">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-zinc-850 dark:text-zinc-200">{t('my_orders') || 'My Orders'}</span>
          </div>
          <svg className="w-5 h-5 text-zinc-400 dark:text-zinc-650" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        {/* Standard Logout Button */}
        <button
          type="button"
          onClick={handleLogoutClick}
          className="w-full flex items-center justify-between p-4 bg-white dark:bg-zinc-900/30 border border-zinc-200/60 dark:border-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-2xl cursor-pointer transition-all shadow-sm active:scale-[0.99] group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-100/40 dark:border-rose-900/30">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
            </div>
            <span className="text-sm font-bold text-zinc-850 dark:text-zinc-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
              {t('logout_btn') || 'Logout'}
            </span>
          </div>
          <svg className="w-5 h-5 text-zinc-450 dark:text-zinc-650" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        {/* Reset & Full Logout Link */}
        <button
          type="button"
          onClick={handleFullLogoutClick}
          className="w-full text-center py-3.5 text-xs font-semibold text-rose-500/80 hover:text-rose-600 dark:text-rose-450/80 dark:hover:text-rose-400 cursor-pointer transition-colors"
        >
          {t('reset_logout_btn') || 'Reset & Clear Server Settings'}
        </button>
      </div>
    </div>
  )
}
