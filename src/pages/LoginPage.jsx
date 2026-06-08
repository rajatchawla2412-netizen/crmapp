import React, { useState, useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import { useTranslation } from 'react-i18next'

function CustomSelect({ label, value, onChange, options, disabled, placeholder }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div className="relative w-full text-left" ref={containerRef}>
      {label && (
        <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5 pl-1 transition-colors select-none">
          {label}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3.5 text-[15px] font-semibold transition-all duration-200 rounded-xl cursor-pointer backdrop-blur-sm ${disabled
          ? 'bg-white/10 dark:bg-zinc-950/10 border border-zinc-200/40 dark:border-zinc-800/40 text-zinc-400 dark:text-zinc-650 cursor-not-allowed opacity-50'
          : isOpen
            ? 'bg-white/85 dark:bg-zinc-900/85 border-brand-500 dark:border-brand-500 text-zinc-900 dark:text-zinc-50 ring-2 ring-brand-500/10 dark:ring-brand-500/20 shadow-lg'
            : 'bg-white/40 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-350 dark:hover:border-zinc-700 text-zinc-900 dark:text-zinc-100'
          }`}
      >
        <span className={selectedOption ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500 font-normal'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-zinc-400 dark:text-zinc-500 transition-transform duration-250 flex-shrink-0 ml-2 ${isOpen ? 'rotate-180 text-brand-500 dark:text-brand-500' : ''
            }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 mt-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/65 rounded-2xl shadow-xl shadow-zinc-200/30 dark:shadow-none z-50 py-1.5 max-h-60 overflow-y-auto transition-all duration-200">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-zinc-400 dark:text-zinc-500 text-center font-normal">
              No options available
            </div>
          ) : (
            options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-[15px] font-medium transition-colors hover:bg-brand-50/50 dark:hover:bg-brand-950/30 hover:text-brand-650 dark:hover:text-brand-400 cursor-pointer ${value === option.value
                  ? 'bg-brand-50/60 dark:bg-brand-950/25 text-brand-600 dark:text-brand-400 font-semibold'
                  : 'text-zinc-700 dark:text-zinc-300'
                  }`}
              >
                <span>{option.label}</span>
                {value === option.value && (
                  <svg className="w-4.5 h-4.5 text-brand-600 dark:text-brand-400 flex-shrink-0 ml-2 animate-fade-in" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}


export default function LoginPage({ onLoginSuccess }) {
  const { t, i18n } = useTranslation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  // Dynamic API & DB Configuration States
  const defaultApiUrl = import.meta.env.VITE_API_BASE_URL || 'http://192.168.29.191:8099'
  const defaultScheme = defaultApiUrl.startsWith('https') ? 'https' : 'http'
  const defaultHost = defaultApiUrl.replace(/^(https?:\/\/)/, '').replace(/\/+$/, '')

  const [scheme, setScheme] = useState(() => localStorage.getItem('server-scheme') || defaultScheme)
  const [serverUrl, setServerUrl] = useState(() => localStorage.getItem('server-url-raw') || defaultHost)
  const [dbList, setDbList] = useState(() => {
    try {
      const saved = localStorage.getItem('server-db-list')
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      return []
    }
  })
  const [selectedDb, setSelectedDb] = useState(() => localStorage.getItem('server-db') || import.meta.env.VITE_DB_NAME || 'rest_api')
  const [connectionStatus, setConnectionStatus] = useState('idle') // 'idle', 'loading', 'success', 'error'

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Debounced server URL validation & database fetching
  useEffect(() => {
    if (!serverUrl.trim()) {
      setDbList([])
      setConnectionStatus('idle')
      return
    }

    setConnectionStatus('loading')

    const timer = setTimeout(async () => {
      try {
        const cleanUrl = serverUrl.replace(/^(https?:\/\/)?/, '').replace(/\/+$/, '')
        const cleanDefault = defaultHost.replace(/^(https?:\/\/)?/, '').replace(/\/+$/, '')

        let fetchUrl = `${scheme}://${cleanUrl}/web/database/list`

        // If in web development and URL matches default host, route through Vite proxy to bypass CORS
        if (!Capacitor.isNativePlatform() && import.meta.env.DEV && cleanUrl === cleanDefault) {
          fetchUrl = '/api/web/database/list'
        }

        const response = await fetch(fetchUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'call',
            params: {}
          })
        })

        if (!response.ok) {
          throw new Error('Connection failed')
        }

        const data = await response.json()
        if (data && Array.isArray(data.result)) {
          setDbList(data.result)
          setConnectionStatus('success')

          if (data.result.includes(selectedDb)) {
            // Keep current selected db
          } else if (data.result.length > 0) {
            setSelectedDb(data.result[0])
          } else {
            setSelectedDb('')
          }
        } else {
          throw new Error('Invalid format')
        }
      } catch (err) {
        console.error('Failed to connect to database server:', err)
        setDbList([])
        setConnectionStatus('error')
      }
    }, 600)

    return () => clearTimeout(timer)
  }, [serverUrl, scheme])

  const hasSavedConfig = !!localStorage.getItem('server-url')

  const handleLogin = async (e) => {
    if (e) e.preventDefault()

    const isConnectionValid = hasSavedConfig || (connectionStatus === 'success' && selectedDb)
    if (!username.trim() || !password.trim() || !isConnectionValid) {
      setMessage({ type: 'error', text: t('fill_fields') })
      return
    }

    setIsLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const cleanUrl = serverUrl.replace(/^(https?:\/\/)?/, '').replace(/\/+$/, '')
      const cleanDefault = defaultHost.replace(/^(https?:\/\/)?/, '').replace(/\/+$/, '')
      const serverBase = `${scheme}://${cleanUrl}`

      let API_URL = `${serverBase}/odoo_connect`

      // If in web development and URL matches default host, route through Vite proxy to bypass CORS
      if (!Capacitor.isNativePlatform() && import.meta.env.DEV && cleanUrl === cleanDefault) {
        API_URL = '/api/odoo_connect'
      }

      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'db': selectedDb.trim(),
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

        // Save server details in localStorage
        localStorage.setItem('server-url', serverBase)
        localStorage.setItem('server-url-raw', cleanUrl)
        localStorage.setItem('server-scheme', scheme)
        localStorage.setItem('server-db', selectedDb)
        localStorage.setItem('server-db-list', JSON.stringify(dbList))

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
          db: selectedDb.trim(),
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
    <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 bg-zinc-950 transition-colors duration-300 relative min-h-screen overflow-hidden">

      {/* Background Blur Blobs */}
      <div className="absolute top-[20%] left-[20%] w-[320px] h-[320px] rounded-full bg-brand-600/10 dark:bg-brand-600/5 blur-[90px] pointer-events-none select-none"></div>
      <div className="absolute bottom-[20%] right-[15%] w-[300px] h-[300px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-[90px] pointer-events-none select-none"></div>

      {/* Corner Language Toggle Button */}
      <button
        type="button"
        onClick={() => {
          const nextLang = i18n.language === 'en' ? 'gu' : 'en';
          i18n.changeLanguage(nextLang);
          localStorage.setItem('language', nextLang);
        }}
        className="absolute top-6 right-6 px-3.5 py-1.5 bg-brand-50/50 hover:bg-brand-50 dark:bg-brand-950/20 dark:hover:bg-brand-950/40 border border-brand-200/50 dark:border-brand-900/30 rounded-full text-sm font-semibold text-brand-600 dark:text-brand-400 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer z-20"
      >
        <svg className="w-4 h-4 text-zinc-450 dark:text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-.554-8.243-1.548m16.5 0a8.997 8.997 0 01-1.863 5.06M3.91 9c.18-.287.375-.56.586-.816m-.586.816A9.004 9.004 0 003 12c0 2.083.704 3.999 1.884 5.517m0 0a8.997 8.997 0 007.843 4.582M12 3c.132 0 .263.003.394.01M12 3c-.132 0-.263.003-.394.01"></path>
        </svg>
        <span>{i18n.language === 'en' ? 'ગુજરાતી' : 'English'}</span>
      </button>

      {/* Glass Container Card */}
      <div className="w-full max-w-[420px] mx-auto z-10 bg-white/40 dark:bg-zinc-900/35 backdrop-blur-xl border border-white/20 dark:border-zinc-800/40 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-zinc-200/30 dark:shadow-none transition-all duration-300">

        {/* Brand / Logo Area */}
        <div className="flex flex-col items-center mb-8 text-center">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            {t('welcome')}
          </h2>
          <p className="text-zinc-550 dark:text-zinc-400 text-sm mt-2 max-w-[280px] leading-relaxed">
            {t('login_subtext')}
          </p>
        </div>

        {/* Notification Banner */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl text-sm border flex items-start gap-3 transition-all duration-300 text-left ${message.type === 'success'
            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300'
            : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-300'
            }`}>
            {message.type === 'success' ? (
              <svg className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-450 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5 flex-shrink-0 text-rose-600 dark:text-rose-450 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"></path>
              </svg>
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">

          {/* Connection settings section */}
          {!hasSavedConfig && (
            <div className="bg-white/10 dark:bg-zinc-950/15 border border-zinc-200/40 dark:border-zinc-800/40 rounded-2xl p-5 space-y-5 mb-6 text-left transition-all duration-300 backdrop-blur-xs">
              <div className="flex items-center gap-2 pb-3 border-b border-zinc-200/30 dark:border-zinc-850/40 mb-1 select-none">
                <svg className="w-4 h-4 text-brand-500 dark:text-brand-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3V7.5a3 3 0 013-3h13.5a3 3 0 013 3v3.75a3 3 0 01-3 3zm-13.5 0a3 3 0 00-3 3v3.75a3 3 0 003 3h13.5a3 3 0 003-3v-3.75a3 3 0 00-3-3M6 7.5h.008v.008H6V7.5zM6 18h.008v.008H6V18z" />
                </svg>
                <h3 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Server Settings
                </h3>
              </div>

              {/* Scheme & URL Input Row */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-[130px] flex-shrink-0">
                  <CustomSelect
                    label={t('connection_type')}
                    value={scheme}
                    onChange={setScheme}
                    options={[
                      { value: 'https', label: 'HTTPS' },
                      { value: 'http', label: 'HTTP' }
                    ]}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex-1 text-left">
                  <label htmlFor="serverUrl" className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5 pl-1 transition-colors select-none">
                    {t('db_server_url')}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="serverUrl"
                      value={serverUrl}
                      onChange={(e) => setServerUrl(e.target.value)}
                      placeholder="e.g. demo.odoo.com"
                      className="w-full px-4 py-3.5 pr-11 text-[15px] font-medium text-zinc-900 dark:text-zinc-100 bg-white/40 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:focus:ring-brand-500/30 focus:border-brand-500 dark:focus:border-brand-500 transition-all duration-200 backdrop-blur-sm"
                      required
                      disabled={isLoading}
                    />

                    {/* Status Indicator Icon */}
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                      {connectionStatus === 'loading' && (
                        <svg className="animate-spin h-5 w-5 text-brand-500 dark:text-brand-500" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {connectionStatus === 'success' && (
                        <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"></path>
                        </svg>
                      )}
                      {connectionStatus === 'error' && (
                        <svg className="w-5 h-5 text-rose-600 dark:text-rose-500" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Database Selection Dropdown */}
              <div className="relative">
                <CustomSelect
                  label={t('select_database')}
                  value={selectedDb}
                  onChange={setSelectedDb}
                  options={dbList.map(db => ({ value: db, label: db }))}
                  disabled={isLoading || connectionStatus !== 'success' || dbList.length === 0}
                  placeholder={
                    connectionStatus === 'loading'
                      ? t('connecting') || 'Connecting...'
                      : connectionStatus === 'error'
                        ? t('connection_error') || 'Connection failed.'
                        : dbList.length === 0
                          ? 'No Databases Found'
                          : t('select_database')
                  }
                />
              </div>

              {/* Status Help Text */}
              {connectionStatus === 'error' && (
                <p className="text-rose-600 dark:text-rose-450 text-xs font-semibold pl-1 animate-pulse select-none">
                  {t('connection_error')}
                </p>
              )}
              {connectionStatus === 'success' && (
                <p className="text-emerald-600 dark:text-emerald-450 text-xs font-semibold pl-1 select-none">
                  {t('connection_success')} ({dbList.length} database(s) found)
                </p>
              )}
            </div>
          )}

          {/* Email / Username Input */}
          <div className="relative mb-6 text-left">
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder=" "
              className="peer block w-full px-4 py-3.5 text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 bg-white/40 dark:bg-zinc-950/45 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:focus:ring-brand-500/30 focus:border-brand-500 dark:focus:border-brand-500 placeholder-transparent transition-all duration-200 backdrop-blur-sm"
              required
              disabled={isLoading}
            />
            <label
              htmlFor="username"
              className="absolute left-4 top-1 -translate-y-5.5 text-xs font-bold text-zinc-400 dark:text-zinc-500 transition-all duration-200 pointer-events-none
                         peer-placeholder-shown:translate-y-0 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-semibold
                         peer-focus:-translate-y-5.5 peer-focus:top-1 peer-focus:text-xs peer-focus:text-brand-500 dark:peer-focus:text-brand-400"
            >
              {t('email_address')}
            </label>
          </div>

          {/* Password Input */}
          <div className="relative mb-6 text-left">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
              className="peer block w-full px-4 py-3.5 pr-12 text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 bg-white/40 dark:bg-zinc-950/45 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:focus:ring-brand-500/30 focus:border-brand-500 dark:focus:border-brand-500 placeholder-transparent transition-all duration-200 backdrop-blur-sm"
              required
              disabled={isLoading}
            />
            <label
              htmlFor="password"
              className="absolute left-4 top-1 -translate-y-5.5 text-xs font-bold text-zinc-400 dark:text-zinc-500 transition-all duration-200 pointer-events-none
                         peer-placeholder-shown:translate-y-0 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-semibold
                         peer-focus:-translate-y-5.5 peer-focus:top-1 peer-focus:text-xs peer-focus:text-brand-500 dark:peer-focus:text-brand-400"
            >
              {t('password')}
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-450 hover:text-zinc-650 dark:hover:text-zinc-300 focus:outline-none transition-colors cursor-pointer"
              title={showPassword ? t('hide_password') : t('show_password')}
            >
              {showPassword ? (
                <svg className="w-5 h-5 text-zinc-950 dark:text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.88 9.88a3 3 0 104.24 4.24"></path>
                  <path d="M10.73 5.08A10.43 10.43 0 0112 5c7 0 10 7 10 7a13.16 13.16 0 01-1.67 2.68"></path>
                  <path d="M6.61 6.61A13.52 13.52 0 002 12s3 7 10 7a9.74 9.74 0 005.39-1.61"></path>
                  <line x1="2" y1="2" x2="22" y2="22"></line>
                </svg>
              ) : (
                <svg className="w-5 h-5 text-zinc-950 dark:text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading || !username || !password || (!hasSavedConfig && (connectionStatus !== 'success' || !selectedDb))}
            className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-bold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-brand-600/20 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[15px] cursor-pointer mt-6"
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
