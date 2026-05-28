import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Capacitor } from '@capacitor/core'

export default function LandingPage({ user, onLogout }) {
  const [partners, setPartners] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [nextId, setNextId] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const observer = useRef()

  const loadMorePartners = useCallback(async () => {
    if (isLoading || !hasMore) return
    setIsLoading(true)

    try {
      const login = user?.username || 'admin'
      const password = user?.password || 'admin'
      const apiKey = user?.apiKey || localStorage.getItem('api-key') || ''

      const API_URL = (Capacitor.isNativePlatform() || !import.meta.env.DEV)
        ? 'http://192.168.29.99:8019/send_request'
        : '/api/send_request'

      // Fetch 10 IDs in parallel
      const idsToFetch = Array.from({ length: 10 }, (_, i) => nextId + i)

      const fetchPromises = idsToFetch.map(async (id) => {
        try {
          const url = `${API_URL}?model=res.partner&Id=${id}&fields=name,email,phone`
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'login': login,
              'password': password,
              'api-key': apiKey,
              'lang': 'gu'
            }
          })

          if (response.status === 401 || response.status === 403) {
            // Session expired or unauthorized, trigger logout
            onLogout()
            return null
          }

          if (!response.ok) return null

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
                data = { message: text }
              }
            }
          }

          let record = null
          if (data) {
            if (data.records && Array.isArray(data.records) && data.records.length > 0) {
              record = data.records[0]
            } else if (Array.isArray(data) && data.length > 0) {
              record = data[0]
            } else if (data.name || data.display_name) {
              record = data
            }
          }

          if (record && (record.name || record.display_name)) {
            return {
              id: record.id || id,
              name: record.name || record.display_name,
              email: record.email || 'No email',
              phone: record.phone || 'No phone'
            }
          }

          return null
        } catch (e) {
          console.error(`Failed to fetch partner with ID ${id}:`, e)
          return null
        }
      })

      const results = await Promise.all(fetchPromises)
      const validPartners = results.filter(p => p !== null)

      if (validPartners.length > 0) {
        setPartners(prev => {
          const existingIds = new Set(prev.map(p => p.id))
          const uniqueNew = validPartners.filter(p => !existingIds.has(p.id))
          const merged = [...prev, ...uniqueNew]

          return merged
        })
      }

      setNextId(prev => prev + 10)

      // Stop fetching if we check past the last found partner ID and find no more partners
      const maxLoadedId = partners.length > 0 ? Math.max(...partners.map(p => p.id)) : 0
      const checkLimit = Math.max(maxLoadedId + 20, 50)
      if (validPartners.length === 0 && nextId > checkLimit) {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error fetching partners batch:', error)
    } finally {
      setIsLoading(false)
    }
  }, [nextId, isLoading, hasMore, user, onLogout, partners])

  // Observer callback for scroll detection
  const lastPartnerElementRef = useCallback(node => {
    if (isLoading || !hasMore) return
    if (observer.current) observer.current.disconnect()

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        loadMorePartners()
      }
    }, { threshold: 0.1 })

    if (node) observer.current.observe(node)
  }, [isLoading, hasMore, loadMorePartners])

  // Initial load
  useEffect(() => {
    loadMorePartners()
  }, [])

  // Helper to generate initials avatar color class
  const getAvatarGradient = (name) => {
    const gradients = [
      'from-purple-500 to-indigo-500',
      'from-blue-500 to-cyan-500',
      'from-emerald-500 to-teal-500',
      'from-pink-500 to-rose-500',
      'from-amber-500 to-orange-500',
      'from-violet-500 to-fuchsia-500'
    ]
    const charCodeSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
    return gradients[charCodeSum % gradients.length]
  }

  // Helper to get initials
  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <div className="flex-1 min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300 flex flex-col">
      {/* Top Navigation */}
      <nav className="w-full bg-white dark:bg-zinc-900 border-b border-zinc-200/60 dark:border-zinc-800/60 px-6 py-4 flex items-center justify-between sticky top-0 z-50 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-purple-600 dark:bg-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-purple-500/10">
            C
          </div>
          <span className="font-semibold text-lg tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-zinc-100 dark:to-zinc-400 bg-clip-text text-transparent">
            crmapp
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 pl-3 border-l border-zinc-200 dark:border-zinc-800">
            {user?.image && (
              <img
                src={user.image}
                alt={user.username}
                className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800"
              />
            )}
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                {user ? `${user.firstName} ${user.lastName}` : 'Operator'}
              </p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                @{user?.username || 'user'}
              </p>
            </div>
            <button
              onClick={onLogout}
              className="px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-900/30 hover:bg-rose-50/40 dark:hover:bg-rose-950/10 rounded-xl text-xs font-medium transition-all flex items-center gap-2"
              title="Log out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              <span>લોગઆઉટ</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 md:py-12 flex flex-col">
        {/* Welcome Section */}
        <section className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 md:p-8 shadow-xl shadow-zinc-200/20 dark:shadow-none relative overflow-hidden transition-all duration-300 mb-10">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/20 rounded-full text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mb-4 tracking-wide uppercase">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                કનેક્ટ થયેલ: {user?.firstName || 'ઓપરેટર'}
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 margin-0">
                ભાગીદારોની યાદી
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2 max-w-xl leading-relaxed">
                ડાયનામિક રીતે લોડ થયેલા Odoo ભાગીદારોની યાદી બ્રાઉઝ કરો.
              </p>
            </div>
          </div>
        </section>

        {/* Partners Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {partners.map((partner, index) => {
            const isLast = index === partners.length - 1
            return (
              <div
                key={partner.id}
                ref={isLast ? lastPartnerElementRef : null}
                className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-4 mb-5">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getAvatarGradient(partner.name)} flex items-center justify-center text-white font-bold text-lg shadow-inner`}>
                      {getInitials(partner.name)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-950 dark:text-zinc-50 leading-snug">
                        {partner.name}
                      </h3>
                      <span className="text-[10px] font-mono text-zinc-450 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 px-2 py-0.5 rounded-full">
                        ID: {partner.id}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
                      <svg className="w-4 h-4 flex-shrink-0 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                      <span className="text-xs truncate" title={partner.email}>
                        {partner.email}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
                      <svg className="w-4 h-4 flex-shrink-0 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.802-5.19-4.168-7-7l1.293-.97c.362-.271.528-.733.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                      <span className="text-xs truncate">
                        {partner.phone}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Loading Skeletons */}
          {isLoading && Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 shadow-md flex flex-col justify-between animate-pulse"
            >
              <div>
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-200 dark:bg-zinc-800"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3"></div>
                    <div className="h-3 bg-zinc-250 dark:bg-zinc-850 rounded w-1/3"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
                    <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4"></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
                    <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* End of results message */}
        {!hasMore && partners.length > 0 && (
          <div className="text-center text-xs text-zinc-400 dark:text-zinc-550 mt-12 py-6 border-t border-zinc-200/60 dark:border-zinc-800/60">
            લોડ કરવા માટે વધુ ભાગીદારો ઉપલબ્ધ નથી. ડિરેક્ટરીના તમામ આઇટમ્સ લોડ થઈ ગયા છે.
          </div>
        )}

        {/* Empty State */}
        {!isLoading && partners.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-8">
            <div className="w-16 h-16 bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/30 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A2.25 2.25 0 0112.75 21.5h-1.5a2.25 2.25 0 01-2.25-2.263V19.13m4.121-3.077A9.38 9.38 0 0012 15.75c-1.39 0-2.68.303-3.84.845m8.59-4.845a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">No Partners Found</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1 max-w-[280px]">
              ડેટાબેઝમાંથી કોઈ ભાગીદાર પ્રોફાઇલ મેળવી શકાયા નથી. કૃપા કરીને તમારી Odoo API-Key અથવા નેટવર્ક કનેક્શન તપાસો.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-6 bg-white dark:bg-zinc-900 border-t border-zinc-200/60 dark:border-zinc-800/60 text-center text-xs text-zinc-450 dark:text-zinc-550 transition-colors duration-300 mt-auto">
        <p>&copy; {new Date().getFullYear()} crmapp. તમામ અધિકારો સુરક્ષિત છે..</p>
      </footer>
    </div>
  )
}
