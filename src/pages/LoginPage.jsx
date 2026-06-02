import React, { useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { useTranslation } from 'react-i18next'

export default function LoginPage({ onLoginSuccess }) {
  const { t, i18n } = useTranslation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const db = 'may29_rest_api'
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleLogin = async (e) => {
    if (e) e.preventDefault()
    
    if (!username.trim() || !password.trim()) {
      setMessage({ type: 'error', text: t('fill_fields') })
      return
    }

    setIsLoading(true)
    setMessage({ type: '', text: '' })

    try {
      // Use absolute URL on Capacitor (mobile) and relative URL on web (to avoid CORS/Cookie restrictions in dev proxy).
      const API_URL = (Capacitor.isNativePlatform() || !import.meta.env.DEV)
        ? 'http://192.168.29.99:8019/odoo_connect'
        : '/api/odoo_connect'

      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'db': db.trim(),
          'login': username.trim(),
          'password': password.trim(),
          'lang': i18n.language === 'gu' ? 'gu' : 'en'
        },
        credentials: 'include'
      })

      let data = {}
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        const text = await response.text()
        if (text) {
          try {
            data = JSON.parse(text)
          } catch (e) {
            // Strip any HTML tags from response to output a clean user-facing error message
            const cleanText = text.replace(/<[^>]*>/g, '').trim()
            data = { message: t('login_failed') }
          }
        }
      }

      if (data.status === "success") {
        setMessage({ type: 'success', text: t('login_success') })

        // Store the API key in localStorage for future requests
        if (data['api-key']) {
          localStorage.setItem('api-key', data['api-key'])
        }

        const fullName = data.user || username.trim()
        const nameParts = fullName.split(' ')
        const firstName = nameParts[0]
        const lastName = nameParts.slice(1).join(' ')

        // Construct user profile data for client-side UI consumption
        const userData = {
          username: username.trim(),
          firstName: firstName,
          lastName: lastName,
          email: username.trim().includes('@') ? username.trim() : `${username.trim()}@company.com`,
          db: db.trim(),
          image: `https://api.dicebear.com/7.x/initials/svg?seed=${fullName}`,
          apiKey: data['api-key'],
          ...data
        }

        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(userData)
          }
        }, 800)
      } else {
        setMessage({
          type: 'error',
          text: data.message || t('login_failed')
        })
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: t('network_error')
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-zinc-950 transition-colors duration-300 relative min-h-screen">
      
      {/* Corner Language Toggle Button */}
      <button
        type="button"
        onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'gu' : 'en')}
        className="absolute top-6 right-6 px-3.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full text-sm font-semibold text-zinc-650 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer z-20"
      >
        <svg className="w-4 h-4 text-zinc-450 dark:text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-.554-8.243-1.548m16.5 0a8.997 8.997 0 01-1.863 5.06M3.91 9c.18-.287.375-.56.586-.816m-.586.816A9.004 9.004 0 003 12c0 2.083.704 3.999 1.884 5.517m0 0a8.997 8.997 0 007.843 4.582M12 3c.132 0 .263.003.394.01M12 3c-.132 0-.263.003-.394.01"></path>
        </svg>
        <span>{i18n.language === 'en' ? 'ગુજરાતી' : 'English'}</span>
      </button>

      {/* Main Content Area */}
      <div className="w-full max-w-[360px] mx-auto text-center z-10">

        {/* Brand / Logo Area */}
        <div className="flex flex-col items-center mb-8">
         
          <h2 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">
            {t('welcome')}
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-[15px] mt-2 text-center max-w-[280px] leading-relaxed">
            {t('login_subtext')}
          </p>
        </div>

        {/* Notification Banner */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl text-sm border flex items-start gap-3 transition-all duration-300 text-left ${
            message.type === 'success'
              ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-300'
          }`}>
            {message.type === 'success' ? (
              <svg className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5 flex-shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"></path>
              </svg>
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email / Username Input */}
          <div className="relative mb-6">
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder=" "
              className="peer block w-full px-4 py-3.5 text-[15px] text-zinc-900 dark:text-zinc-100 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600 placeholder-transparent font-medium"
              required
              disabled={isLoading}
            />
            <label
              htmlFor="username"
              className="absolute left-3 -top-2 bg-white dark:bg-zinc-950 px-1 text-xs font-semibold text-zinc-400 dark:text-zinc-500 transition-all peer-placeholder-shown:text-[15px] peer-placeholder-shown:text-zinc-400 peer-placeholder-shown:top-3.5 peer-placeholder-shown:left-4 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-purple-600 dark:peer-focus:text-purple-400 peer-focus:left-3"
            >
              {t('email_address')}
            </label>
          </div>

          {/* Password Input */}
          <div className="relative mb-6">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
              className="peer block w-full px-4 py-3.5 pr-12 text-[15px] text-zinc-900 dark:text-zinc-100 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600 placeholder-transparent font-medium"
              required
              disabled={isLoading}
            />
            <label
              htmlFor="password"
              className="absolute left-3 -top-2 bg-white dark:bg-zinc-950 px-1 text-xs font-semibold text-zinc-400 dark:text-zinc-500 transition-all peer-placeholder-shown:text-[15px] peer-placeholder-shown:text-zinc-400 peer-placeholder-shown:top-3.5 peer-placeholder-shown:left-4 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-purple-600 dark:peer-focus:text-purple-400 peer-focus:left-3"
            >
              {t('password')}
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 focus:outline-none transition-colors"
              title={showPassword ? t('hide_password') : t('show_password')}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.824 2.15a1.5 1.5 0 00-2.148-2.148m0 0L13 13.5m-3.228 3.228L3 18.75m3.228-3.228l3.65-3.65m0 0a3 3 0 104.243 4.243m-4.243-4.243L9 12"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              )}
            </button>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading || !username || !password}
            className="w-full py-3.5 bg-[#6941c6] hover:bg-[#5b37ad] text-white font-semibold rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[15px] cursor-pointer mt-4"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{t('logging_in')}</span>
              </>
            ) : (
              <span>{t('sign_in')}</span>
            )}
          </button>
        </form>

      </div>
    </div>
  )
}
