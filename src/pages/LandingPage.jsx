import React, { useState, useCallback } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from './Navbar'

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
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [toasts, setToasts] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

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
      addToast(t('order_updated_success'), 'success')
      navigate('/orders')
    } catch (err) {
      console.error(err)
      addToast(err.message || t('order_error_default'), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDiscardConfirm = () => {
    onDiscardEditedOrder()
    addToast(t('cart_emptied_toast'), 'success')
    setShowDiscardConfirm(false)
    navigate('/orders')
  }

  const mainContent = (
    <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 md:py-12 flex flex-col gap-8">
      <Outlet context={{
        addToast,
        editingOrder,
        startEditingOrder,
        discardEditingOrder,
        saveEditedOrder: onSaveEditedOrder
      }} />
    </main>
  )

  return (
    <div className="flex-1 min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300 flex flex-col">
      {/* Top sticky container for banner and navbar */}
      <div className="sticky top-0 z-50 w-full flex flex-col shadow-sm">
        {editingOrder && (
          <div className="w-full bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-200/50 dark:border-amber-900/30 backdrop-blur-md px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <p className="text-xs font-semibold text-amber-850 dark:text-amber-300">
                {t('edit_order_banner', { orderNumber: editingOrder.order_number })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSave}
                className="px-3.5 py-1.5 bg-amber-650 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isSaving ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : null}
                <span>{t('save_changes')}</span>
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setShowDiscardConfirm(true)}
                className="px-3.5 py-1.5 border border-amber-250 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 rounded-lg text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                {t('discard_changes')}
              </button>
            </div>
          </div>
        )}
        <Navbar user={user} onLogout={onLogout} cart={cart} />
      </div>

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
            {/* Warning Icon */}
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
                className="flex-1 px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-white dark:hover:text-black hover:bg-zinc-50 dark:hover:bg-zinc-850 rounded-xl text-xs font-semibold transition-all cursor-pointer"
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
