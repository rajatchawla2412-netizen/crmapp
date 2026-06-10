import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { useTranslation } from 'react-i18next'
import PullToRefresh from 'react-simple-pull-to-refresh'
import { getApiBaseUrl, customFetch } from '../utils/api'

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
      <div className="w-12 h-12 rounded-full bg-white/40 dark:bg-black/25 flex items-center justify-center font-black text-xs select-none backdrop-blur-sm">
        {getInitials(name)}
      </div>
    )
  }

  return (
    <img
      src={imageSrc}
      alt={name}
      onError={() => setHasError(true)}
      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
    />
  )
}

function getCategoryTheme(id, name) {
  const identifier = name || String(id || '');
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return {
    light: {
      bg: `hsl(${hue}, 80%, 96%)`,
      text: `hsl(${hue}, 85%, 22%)`,
      subtext: `hsl(${hue}, 70%, 35%)`,
      border: `hsl(${hue}, 65%, 90%)`
    },
    dark: {
      bg: `hsl(${hue}, 45%, 11%)`,
      text: `hsl(${hue}, 80%, 80%)`,
      subtext: `hsl(${hue}, 70%, 65%)`,
      border: `hsl(${hue}, 35%, 17%)`
    }
  };
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
      const catResponse = await customFetch(categoriesUrl, {
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
          const guResponse = await customFetch(categoriesUrl, {
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
    <div className="space-y-8 text-left animate-slide-in-left">
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
        <section className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="h-24 bg-zinc-150/40 dark:bg-zinc-900/15 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl animate-pulse overflow-hidden flex items-center justify-between p-3.5 sm:p-5"
            >
              <div className="space-y-2 flex-1 pr-2">
                <div className="h-3.5 bg-zinc-200/80 dark:bg-zinc-800/60 rounded w-4/5"></div>
                <div className="h-2.5 bg-zinc-200/60 dark:bg-zinc-800/40 rounded w-1/2"></div>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-zinc-200/50 dark:bg-zinc-850/50 rounded-xl flex-shrink-0"></div>
            </div>
          ))}
        </section>
      )}

      {/* Categories Grid  */}
      {!isLoading && categories.length > 0 && (
        <section className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
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
          `}</style>
          {categories.map((category) => {
            const theme = getCategoryTheme(category.id, category.name)
            return (
              <div
                key={category.id}
                id={`category-card-${category.id}`}
                onClick={() => {
                  navigate(`/products/${category.id}`, { state: { category } })
                }}
                className="category-card flex items-center justify-between p-3.5 sm:p-5 rounded-2xl border hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 group cursor-pointer select-none h-24 shadow-sm"
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
                {/* Category Name on the Left */}
                <div className="flex-1 pr-1.5 sm:pr-4 text-left">
                  <h3 className="category-card-title font-extrabold text-sm sm:text-base md:text-lg tracking-tight leading-tight line-clamp-2">
                    {category.name || category.display_name}
                  </h3>
                  <p className="category-card-subtext text-[9px] sm:text-[11px] font-semibold mt-0.5 sm:mt-1">
                    {t('browse_products') || 'Browse Products'}
                  </p>
                </div>

                {/* Transparent Image on the Right */}
                <div className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  <CategoryImage src={category.image} name={category.name} />
                </div>
              </div>
            )
          })}
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
