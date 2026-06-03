import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { useTranslation } from 'react-i18next'
import PullToRefresh from 'react-simple-pull-to-refresh'

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
      <div className="w-20 h-20 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400 dark:text-zinc-500 font-bold text-lg select-none">
        {getInitials(name)}
      </div>
    )
  }

  return (
    <img
      src={imageSrc}
      alt={name}
      onError={() => setHasError(true)}
      className="w-20 h-20 object-contain rounded-xl"
    />
  )
}

export default function CategoriesPage({ user, onLogout }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setErrorMsg('')

    try {
      const login = user?.username || 'admin'
      const apiKey = user?.apiKey || localStorage.getItem('api-key') || ''

      const API_BASE = (Capacitor.isNativePlatform() || !import.meta.env.DEV)
        ? 'http://192.168.29.99:8019'
        : '/api'

      const categoriesUrl = `${API_BASE}/category_list`
      // Always fetch in English first to ensure image data is loaded
      const catResponse = await fetch(categoriesUrl, {
        method: 'GET',
        headers: {
          'login': login,
          'api-key': apiKey,
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
              className="aspect-square flex flex-col items-center justify-center p-6 bg-zinc-50/60 dark:bg-zinc-900/10 border border-zinc-200 dark:border-zinc-800 rounded-2xl animate-pulse"
            >
              <div className="w-20 h-20 bg-zinc-200 dark:bg-zinc-800 rounded-xl mb-4"></div>
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-20"></div>
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
              className="aspect-square flex flex-col items-center justify-center p-6 bg-zinc-50/60 dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-purple-300 dark:hover:border-purple-800 cursor-pointer transition-all duration-300 select-none"
            >
              {/* Category Image */}
              <div className="w-20 h-20 flex items-center justify-center overflow-hidden flex-shrink-0 mb-4">
                <CategoryImage src={category.image} name={category.name} />
              </div>
              {/* Category Title */}
              <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 truncate w-full text-center px-1">
                {category.name || category.display_name}
              </h3>
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
    <PullToRefresh onRefresh={handleRefresh}>
      {categoriesContent}
    </PullToRefresh>
  ) : (
    categoriesContent
  )
}
