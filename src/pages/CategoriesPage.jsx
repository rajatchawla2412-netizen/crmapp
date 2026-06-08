import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { useTranslation } from 'react-i18next'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { getApiBaseUrl } from '../utils/api'

// Minimalist Pull to Refresh components
const PullingIndicator = () => (
  <div className="flex items-center justify-center py-4 text-zinc-400 dark:text-zinc-500">
    <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
    </svg>
  </div>
)

const RefreshingIndicator = () => (
  <div className="flex items-center justify-center py-4">
    <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-700 border-t-purple-650 dark:border-t-purple-400 rounded-full animate-spin"></div>
  </div>
)

// CategoryImage sub-component to handle Odoo image load errors gracefully
function CategoryImage({ src, name }) {
  const [hasError, setHasError] = useState(false)
  const getInitials = (n) => {
    if (!n) return '?'
    const parts = n.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return n.slice(0, 2).toUpperCase()
  }

  const formatImageSrc = (img) => {
    if (!img) return null;
    if (img.startsWith('data:') || img.startsWith('http://') || img.startsWith('https://') || img.startsWith('/') || img.startsWith('blob:')) {
      return img;
    }

    let cleanImg = img.trim().replace(/\s/g, '');

    // Strip Python byte string wrapper b'...'
    if (cleanImg.startsWith("b'") && cleanImg.endsWith("'")) {
      cleanImg = cleanImg.slice(2, -1);
    }

    // Check for double base64 encoding
    try {
      const decodedOnce = atob(cleanImg);
      const cleanDecoded = decodedOnce.trim().replace(/\s/g, '');
      if (/^[A-Za-z0-9+/=]+$/.test(cleanDecoded) && cleanDecoded.length > 0) {
        cleanImg = cleanDecoded;
      }
    } catch (e) {
      // Keep single-encoded image
    }

    let mimeType = 'png';
    if (cleanImg.startsWith('/9j/')) {
      mimeType = 'jpeg';
    } else if (cleanImg.startsWith('iVBORw0KGgo')) {
      mimeType = 'png';
    } else if (cleanImg.startsWith('R0lGOD')) {
      mimeType = 'gif';
    } else if (cleanImg.startsWith('UklGR')) {
      mimeType = 'webp';
    } else if (cleanImg.startsWith('PHN2Zy')) {
      mimeType = 'svg+xml';
    }
    return `data:image/${mimeType};base64,${cleanImg}`;
  }

  const imageSrc = formatImageSrc(src);

  if (!imageSrc || hasError) {
    return (
      <div className="w-full h-full bg-zinc-100 dark:bg-zinc-850 flex items-center justify-center text-zinc-400 dark:text-zinc-500 font-bold text-xl select-none">
        {getInitials(name)}
      </div>
    )
  }

  return (
    <img
      src={imageSrc}
      alt={name}
      onError={() => setHasError(true)}
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
  )
}

export default function CategoriesPage({ user, onLogout }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { setPageLoading } = useOutletContext() || {}
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (setPageLoading) {
      setPageLoading('categories', isLoading)
    }
    return () => {
      if (setPageLoading) {
        setPageLoading('categories', false)
      }
    }
  }, [isLoading, setPageLoading])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setErrorMsg('')

    try {
      const login = user?.username || 'admin'
      const apiKey = user?.apiKey || localStorage.getItem('api-key') || ''
      const db = user?.db || localStorage.getItem('server-db') || ''

      const API_BASE = getApiBaseUrl()

      const categoriesUrl = `${API_BASE}/category_list`
      // Always fetch in English first to ensure image data is loaded
      const catResponse = await fetch(categoriesUrl, {
        method: 'GET',
        headers: {
          'login': login,
          'api-key': apiKey,
          'db': db,
          'lang': 'en'
        }
      })

      if (catResponse.status === 401 || catResponse.status === 403) {
        onLogout()
        return
      }

      if (!catResponse.ok) {
        throw new Error(t('products_not_found'))
      }

      const catData = await catResponse.json()
      let fetchedCategories = []
      if (catData && catData.records && Array.isArray(catData.records)) {
        fetchedCategories = catData.records
      } else if (Array.isArray(catData)) {
        fetchedCategories = catData
      }

      // If the app language is Gujarati, fetch the translation for names and merge them
      if (i18n.language === 'gu') {
        try {
          const guResponse = await fetch(categoriesUrl, {
            method: 'GET',
            headers: {
              'login': login,
              'api-key': apiKey,
              'db': db,
              'lang': 'gu'
            }
          })
          if (guResponse.ok) {
            const guData = await guResponse.json()
            let guRecords = []
            if (guData && guData.records && Array.isArray(guData.records)) {
              guRecords = guData.records
            } else if (Array.isArray(guData)) {
              guRecords = guData
            }

            fetchedCategories = fetchedCategories.map(cat => {
              const matchedGu = guRecords.find(r => String(r.id) === String(cat.id))
              if (matchedGu) {
                return {
                  ...cat,
                  name: matchedGu.name || cat.name,
                  display_name: matchedGu.display_name || cat.display_name
                }
              }
              return cat
            })
          }
        } catch (guErr) {
          console.error('Error fetching Gujarati categories, falling back to English names:', guErr)
        }
      }

      setCategories(fetchedCategories)
    } catch (error) {
      console.error('Error fetching categories:', error)
      let msg = t('network_error_retry')

      if (!navigator.onLine) {
        msg = t('no_internet_connection')
      } else if (error.name === 'TypeError') {
        msg = t('server_connection_failed')
      } else if (error.message) {
        msg = error.message
      }

      setErrorMsg(msg)
    } finally {
      setIsLoading(false)
    }
  }, [user, onLogout, t, i18n.language])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRefresh = async () => {
    await loadData()
  }

  const categoriesContent = (
    <div className="space-y-8 text-left">
      {/* Welcome Title (Flat text, no border) */}
      <section className="relative transition-all duration-300">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-left">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 margin-0">
              {t('categories_title')}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2 max-w-xl leading-relaxed">
              {t('product_list_subtext')}
            </p>
          </div>
        </div>
      </section>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 rounded-xl text-sm border flex items-start gap-3 transition-all duration-300 bg-rose-50/60 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-350 text-left">
          <svg className="w-5 h-5 flex-shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="relative aspect-square bg-zinc-150/40 dark:bg-zinc-900/15 border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl animate-pulse overflow-hidden"
            >
              <div className="w-full h-full bg-zinc-200/50 dark:bg-zinc-800/40"></div>
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-white/60 dark:bg-zinc-950/60 border-t border-zinc-200/30 dark:border-zinc-800/30 flex items-center justify-center px-4">
                <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Categories Grid  */}
      {!isLoading && categories.length > 0 && (
        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {categories.map(category => (
            <div
              key={category.id}
              onClick={() => {
                navigate(`/products/${category.id}`, { state: { category } })
              }}
              className="relative aspect-square rounded-3xl overflow-hidden border-zinc-900 dark:border-zinc-900 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.99] hover:border-purple-400 dark:hover:border-purple-700 transition-all duration-300 group cursor-pointer select-none"
            >
              {/* Category Image - Fills the card */}
              <div className="w-full h-full flex items-center justify-center overflow-hidden">
                <CategoryImage src={category.image} name={category.name} />
              </div>

              {/* Category Title - Overlay at the bottom */}
              <div className="absolute bottom-0 left-0 right-0 bg-white/75 dark:bg-zinc-950/75 backdrop-blur-md border-t border-zinc-300 dark:border-zinc-750 py-2.5 px-3 flex items-center justify-center text-center">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate w-full">
                  {category.name || category.display_name}
                </h3>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Empty State */}
      {!isLoading && categories.length === 0 && !errorMsg && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8">
          <div className="w-16 h-16 bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/30 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">{t('products_not_found')}</h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1 max-w-[280px]">
            {t('db_error_msg')}
          </p>
        </div>
      )}
    </div>
  )

  return Capacitor.isNativePlatform() ? (
    <PullToRefresh
      onRefresh={handleRefresh}
      resistance={2.5}
      pullDownThreshold={95}
      maxPullDownDistance={140}
      pullingContent={<PullingIndicator />}
      refreshingContent={<RefreshingIndicator />}
    >
      {categoriesContent}
    </PullToRefresh>
  ) : (
    categoriesContent
  )
}
