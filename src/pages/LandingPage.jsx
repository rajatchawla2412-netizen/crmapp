import React, { useState, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from './Navbar'

export default function LandingPage({ user, onLogout, cart }) {
  const { t } = useTranslation()
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

  const mainContent = (
    <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 md:py-12 flex flex-col gap-8">
      <Outlet context={{ addToast }} />
    </main>
  )

  return (
    <div className="flex-1 min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300 flex flex-col">
      {/* Top Navigation */}
      <Navbar user={user} onLogout={onLogout} cart={cart} />

      {mainContent}

      {/* Footer */}
      <footer className="w-full py-6 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-850 text-center text-xs text-zinc-450 dark:text-zinc-500 transition-colors duration-300 mt-auto">
        <p>&copy; {new Date().getFullYear()} crmapp. {t('all_rights_reserved')}</p>
      </footer>

      {/* Toast Notification Container */}
      <div className="fixed bottom-6 left-6 right-6 sm:left-auto sm:right-6 z-[100] flex flex-col gap-3 max-w-none sm:max-w-sm pointer-events-none text-left">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-zinc-950/90 dark:bg-zinc-900/90 text-zinc-50 border border-zinc-800/80 rounded-xl p-4 shadow-xl flex items-center justify-between gap-3 animate-slide-in backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                toast.type === 'error'
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
