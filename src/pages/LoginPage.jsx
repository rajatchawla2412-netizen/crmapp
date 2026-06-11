import React, { useState, useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import { useTranslation } from 'react-i18next'
import { customFetch } from '../utils/api'

// Inline Styles for custom animations
const customStyles = `
@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-zoom-in {
  animation: zoomIn 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes pulseSlow {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.04);
    opacity: 0.95;
  }
}

.animate-pulse-slow {
  animation: pulseSlow 3s ease-in-out infinite;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes successBounce {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  60% {
    transform: scale(1.15);
    opacity: 1;
  }
  80% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
  }
}

.animate-success-bounce {
  animation: successBounce 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}

.server-settings-slide {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease, margin-bottom 0.5s ease;
}

.server-settings-slide.show {
  max-height: 500px;
  opacity: 1;
  margin-bottom: 24px;
}

@keyframes rotateGear {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(90deg);
  }
}

.hover-rotate-gear:hover svg {
  animation: rotateGear 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
`;

function Logo({ size = "medium" }) {
  const isLarge = size === "large";
  return (
    <div className="flex items-center font-bold select-none text-white tracking-tight">
      <span className={`font-extrabold tracking-tight ${isLarge ? 'text-[3rem]' : 'text-[1.8rem]'}`}>
        CRMAPP
      </span>
    </div>
  );
}

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
        <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 pl-0 transition-colors select-none">
          {label}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-0 py-2.5 text-[15px] font-semibold transition-all duration-200 border-b border-zinc-200 dark:border-zinc-800 cursor-pointer bg-transparent ${disabled
          ? 'text-zinc-400 dark:text-zinc-600 cursor-not-allowed opacity-50'
          : isOpen
            ? 'border-brand-red text-zinc-900 dark:text-zinc-50'
            : 'hover:border-zinc-350 dark:hover:border-zinc-700 text-zinc-900 dark:text-zinc-100'
          }`}
      >
        <span className={selectedOption ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500 font-normal'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 flex-shrink-0 ml-2 ${isOpen ? 'rotate-180 text-brand-red' : ''
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
        <div className="absolute left-0 right-0 mt-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/65 rounded-2xl shadow-xl z-50 py-1.5 max-h-60 overflow-y-auto transition-all duration-200">
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
                className={`w-full flex items-center justify-between px-4 py-2.5 text-[15px] font-medium transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-brand-red cursor-pointer ${value === option.value
                  ? 'bg-zinc-50 dark:bg-zinc-800 text-brand-red font-semibold'
                  : 'text-zinc-700 dark:text-zinc-300'
                  }`}
              >
                <span>{option.label}</span>
                {value === option.value && (
                  <svg className="w-4.5 h-4.5 text-brand-red flex-shrink-0 ml-2" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
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

  // Startup Splash Animation States
  const [showSplash, setShowSplash] = useState(true)
  const [animateDrawer, setAnimateDrawer] = useState(false)

  // Dynamic API & DB Configuration States
  const defaultApiUrl = import.meta.env.VITE_API_BASE_URL
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
  const [showServerSettings, setShowServerSettings] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Successful login animation states
  const [isLoginSuccessState, setIsLoginSuccessState] = useState(false)
  const [successUser, setSuccessUser] = useState(null)

  // Startup animation effect
  useEffect(() => {
    const drawerTimer = setTimeout(() => {
      setAnimateDrawer(true)
    }, 1400)

    const splashTimer = setTimeout(() => {
      setShowSplash(false)
    }, 2100)

    return () => {
      clearTimeout(drawerTimer)
      clearTimeout(splashTimer)
    }
  }, [])

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

        const response = await customFetch(fetchUrl, {
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

  const savedScheme = localStorage.getItem('server-scheme')
  const savedServerUrlRaw = localStorage.getItem('server-url-raw')
  const savedDb = localStorage.getItem('server-db')

  // Normalise raw URLs (e.g. strip protocol/trailing slashes) for comparison
  const normalizeUrl = (url) => {
    if (!url) return ''
    return url.replace(/^(https?:\/\/)?/, '').replace(/\/+$/, '').trim()
  }

  const isSettingsModified = 
    normalizeUrl(savedServerUrlRaw) !== normalizeUrl(serverUrl) ||
    savedScheme !== scheme ||
    savedDb !== selectedDb

  const isConnectionValid = (!isSettingsModified && hasSavedConfig) || (connectionStatus === 'success' && selectedDb)

  const handleLogin = async (e) => {
    if (e) e.preventDefault()
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

      const response = await customFetch(API_URL, {
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

        // Trigger welcome animation
        setSuccessUser(userData)
        setIsLoginSuccessState(true)

        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(userData)
          }
        }, 2200)
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
    <div className="flex-1 flex flex-col justify-end bg-brand-red min-h-screen relative overflow-hidden w-full font-sans">
      <style>{customStyles}</style>

      {/* Startup Animation Splash Screen */}
      {showSplash && (
        <div
          className={`fixed inset-0 bg-brand-red z-50 flex flex-col items-center justify-center transition-opacity duration-700 ease-in-out ${animateDrawer ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
        >
          <div className="animate-zoom-in animate-pulse-slow">
            <Logo size="large" />
          </div>
        </div>
      )}

      {/* Login Success Welcome Screen */}
      {isLoginSuccessState && (
        <div className="fixed inset-0 bg-brand-red z-50 flex flex-col items-center justify-center text-white text-center p-6 animate-fade-in">
          <div className="flex flex-col items-center justify-center space-y-6">
            {/* Animated Checkmark Circle */}
            <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl border border-white/30 animate-success-bounce">
              <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" strokeWidth="4.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>

            {/* Welcome Text */}
            <div className="space-y-3 animate-fade-in-up">
              <h1 className="text-3xl font-extrabold tracking-tight animate-pulse-slow">
                {t('welcome_back') || 'Welcome Back!'}
              </h1>
              <p className="text-white/90 font-semibold text-lg max-w-xs mx-auto">
                {successUser?.firstName ? `${successUser.firstName} ${successUser.lastName || ''}` : successUser?.username}
              </p>
              <p className="text-white/60 text-xs font-medium tracking-wider uppercase pt-4 animate-pulse">
                {t('loading') || 'Loading Workspace...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Section on Active Login Screen */}
      <div className={`w-full flex items-center justify-between px-6 pt-12 pb-6 z-10 transition-opacity duration-500 ${animateDrawer ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <Logo size="small" />

        <div className="flex items-center gap-3">
          {/* Language Toggle Button */}
          <button
            type="button"
            onClick={() => {
              const nextLang = i18n.language === 'en' ? 'gu' : 'en';
              i18n.changeLanguage(nextLang);
              localStorage.setItem('language', nextLang);
            }}
            className="h-9 p-1 bg-white/10 hover:bg-white/15 border border-white/20 rounded-full flex items-center gap-2 text-white text-xs font-semibold cursor-pointer select-none transition-all duration-300"
            title="Toggle Language"
          >
            {i18n.language === 'en' ? (
              <>
                {/* Circle 'en' on the left */}
                <span className="w-7 h-7 rounded-full bg-white text-[#7338A0] flex items-center justify-center font-extrabold text-[10px] uppercase">
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
                <span className="w-7 h-7 rounded-full bg-white text-[#7338A0] flex items-center justify-center font-extrabold text-[10px]">
                  ગુ
                </span>
              </>
            )}
          </button>

          {/* Config / Server Settings Gear Button */}
          <button
            type="button"
            onClick={() => setShowServerSettings(!showServerSettings)}
            className={`w-9 h-9 bg-white/10 hover:bg-white/15 border border-white/20 rounded-full flex items-center justify-center text-white cursor-pointer select-none transition-all duration-300 hover-rotate-gear ${showServerSettings ? 'bg-white/25 border-white/40' : ''}`}
            title="Server Settings"
          >
            <svg className="w-5 h-5 text-white transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.99l1.005.831a1.125 1.125 0 01.26 1.43l-1.297 2.247a1.125 1.125 0 01-1.37.491l-1.216-.456c-.356-.133-.751-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.83c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.831a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Drawer Card */}
      <div
        className={`w-full max-w-md mx-auto bg-white dark:bg-zinc-900 rounded-t-[40px] px-8 pt-10 pb-8 shadow-2xl flex flex-col justify-start z-10 transition-all duration-700 ease-out ${animateDrawer ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
          }`}
        style={{ minHeight: '72vh' }}
      >
        {/* Title */}
        <div className="text-left mb-8 select-none">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {t('welcome')}
          </h2>
          <p className="text-zinc-400 dark:text-zinc-500 text-xs mt-1.5 font-medium">
            {t('login_subtext')}
          </p>
        </div>

        {/* Message Banner */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl text-sm border flex items-start gap-3 transition-all duration-300 text-left ${message.type === 'success'
            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-100/50 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-450'
            : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-100/50 dark:border-rose-900/30 text-rose-700 dark:text-rose-450'
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
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        {/* Server Setup Warning */}
        {(!hasSavedConfig || isSettingsModified) && connectionStatus !== 'success' && (
          <div className="mb-6 p-4 rounded-xl text-sm border bg-amber-50/60 dark:bg-amber-950/20 border-amber-100/50 dark:border-amber-900/30 text-amber-700 dark:text-amber-450 flex items-start gap-3 transition-all duration-300 text-left">
            <svg className="w-5.5 h-5.5 flex-shrink-0 text-amber-600 dark:text-amber-500 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="font-bold">{t('server_settings_required') || 'Server Configuration Required'}</p>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1 leading-relaxed">
                {t('server_settings_required_desc') || 'Please configure and verify the database server settings before signing in.'}
              </p>
              {!showServerSettings && (
                <button
                  type="button"
                  onClick={() => setShowServerSettings(true)}
                  className="mt-2 text-xs font-bold text-brand-red dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Configure Now →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6 flex-1 flex flex-col justify-between">
          <div className="space-y-6">

            {/* Connection settings section */}
            <div className={`server-settings-slide ${showServerSettings ? 'show' : ''}`}>
              <div className="bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-100 dark:border-zinc-900 rounded-2xl p-5 space-y-5 text-left transition-all duration-300">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-200/50 dark:border-zinc-800/50 mb-1 select-none">
                  <svg className="w-4 h-4 text-brand-red" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3V7.5a3 3 0 013-3h13.5a3 3 0 013 3v3.75a3 3 0 01-3 3zm-13.5 0a3 3 0 00-3 3v3.75a3 3 0 003 3h13.5a3 3 0 003-3v-3.75a3 3 0 00-3-3M6 7.5h.008v.008H6V7.5zM6 18h.008v.008H6V18z" />
                  </svg>
                  <h3 className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Server Settings
                  </h3>
                </div>

                {/* Scheme & URL Input Row */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-[120px] flex-shrink-0">
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
                    <label htmlFor="serverUrl" className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 pl-0 transition-colors select-none">
                      {t('db_server_url')}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="serverUrl"
                        value={serverUrl}
                        onChange={(e) => setServerUrl(e.target.value)}
                        placeholder="e.g. demo.odoo.com"
                        className="w-full px-0 py-2 text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 bg-transparent border-b border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-brand-red transition-all duration-200"
                        required={showServerSettings}
                        disabled={isLoading}
                      />

                      {/* Status Indicator Icon */}
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center">
                        {connectionStatus === 'loading' && (
                          <svg className="animate-spin h-5 w-5 text-brand-red" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
                  <p className="text-rose-600 dark:text-rose-450 text-xs font-semibold pl-0 animate-pulse select-none">
                    {t('connection_error')}
                  </p>
                )}
                {connectionStatus === 'success' && (
                  <p className="text-emerald-600 dark:text-emerald-450 text-xs font-semibold pl-0 select-none">
                    {t('connection_success')} ({dbList.length} database(s) found)
                  </p>
                )}
              </div>
            </div>

            {/* Email / Username Input */}
            <div className="relative mb-6 text-left">
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder=" "
                className="peer block w-full px-0 py-2.5 text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 bg-transparent border-b border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-brand-red placeholder-transparent transition-all duration-200"
                required
                disabled={isLoading}
              />
              <label
                htmlFor="username"
                className="absolute left-0 top-1.5 -translate-y-5 text-xs font-bold text-zinc-500 dark:text-zinc-400 transition-all duration-200 pointer-events-none
                           peer-placeholder-shown:translate-y-0 peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-medium peer-placeholder-shown:text-zinc-400 dark:peer-placeholder-shown:text-zinc-500
                           peer-focus:-translate-y-5 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-brand-red dark:peer-focus:text-brand-red"
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
                className="peer block w-full px-0 py-2.5 pr-10 text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 bg-transparent border-b border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-brand-red placeholder-transparent transition-all duration-200"
                required
                disabled={isLoading}
              />
              <label
                htmlFor="password"
                className="absolute left-0 top-1.5 -translate-y-5 text-xs font-bold text-zinc-500 dark:text-zinc-400 transition-all duration-200 pointer-events-none
                           peer-placeholder-shown:translate-y-0 peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-[15px] peer-placeholder-shown:font-medium peer-placeholder-shown:text-zinc-400 dark:peer-placeholder-shown:text-zinc-500
                           peer-focus:-translate-y-5 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-brand-red dark:peer-focus:text-brand-red"
              >
                {t('password')}
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 focus:outline-none transition-colors cursor-pointer"
                title={showPassword ? t('hide_password') : t('show_password')}
              >
                {showPassword ? (
                  <svg className="w-5 h-5 text-zinc-500 dark:text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.88 9.88a3 3 0 104.24 4.24"></path>
                    <path d="M10.73 5.08A10.43 10.43 0 0112 5c7 0 10 7 10 7a13.16 13.16 0 01-1.67 2.68"></path>
                    <path d="M6.61 6.61A13.52 13.52 0 002 12s3 7 10 7a9.74 9.74 0 005.39-1.61"></path>
                    <line x1="2" y1="2" x2="22" y2="22"></line>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-zinc-500 dark:text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>

            {/* Forgot password link */}
            <div className="flex justify-between items-center text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-350 font-semibold mb-6">
              <button type="button" className="hover:text-brand-red transition-colors">
                {t('cant_login')}
              </button>
            </div>

          </div>

          <div className="mt-8">
            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading || !username || !password || !isConnectionValid}
              className="w-full py-3.5 bg-brand-red hover:bg-brand-red-hover active:scale-[0.98] text-white font-bold rounded-xl transition-all duration-200 shadow-md shadow-brand-red/10 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[15px] cursor-pointer"
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
            {/* Sign up Link */}
            <div className="mt-8 text-center text-xs text-zinc-500 dark:text-zinc-400 font-semibold select-none">
              <span>{t('dont_have_account')}</span>{' '}
              <button type="button" className="text-brand-red hover:underline ml-1 cursor-pointer">
                {t('sign_up')}
              </button>
            </div>

          </div>
        </form>

      </div>
    </div>
  )
}
