import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation, useOutletContext } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { useTranslation } from 'react-i18next'
import PullToRefresh from 'react-simple-pull-to-refresh'

const isShippingProduct = (item) => {
  if (!item) return false;
  const name = String(item.name || item.display_name || '').toLowerCase();
  return name.includes('shipping') || name.includes('શિપિંગ') || name.includes('delivery') || name.includes('ડેલિવરી');
}

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

// ProductImage sub-component to handle fallback initials gracefully
function ProductImage({ src, name }) {
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
      <div className="w-full aspect-square bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 dark:text-zinc-500 font-bold text-lg select-none">
        {getInitials(name)}
      </div>
    )
  }

  return (
    <img
      src={imageSrc}
      alt={name}
      onError={() => setHasError(true)}
      className="w-full aspect-square object-contain rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50"
    />
  )
}

export default function ProductsPage({
  user,
  onLogout,
  cart,
  onAddToCart,
  onUpdateQuantity,
  onRemoveItem
}) {
  const { t, i18n } = useTranslation()
  const { categoryId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { addToast, setPageLoading, editingOrder } = useOutletContext()

  // Retrieve category info from state or reconstruct a simple fallback

  const selectedCategory = location.state?.category || {
    id: categoryId,
    name: categoryId === 'uncategorized' ? t('other_uncategorized') : t('product_list')
  }

  const [categoryName, setCategoryName] = useState(selectedCategory.name)

  // Fetch the translated category name when the language switcher changes
  useEffect(() => {
    if (categoryId === 'uncategorized') {
      setCategoryName(t('other_uncategorized'))
      return
    }

    const fetchCategoryName = async () => {
      try {
        const login = user?.username || 'admin'
        const apiKey = user?.apiKey || localStorage.getItem('api-key') || ''
        const API_BASE = (Capacitor.isNativePlatform() || !import.meta.env.DEV)
          ? 'http://192.168.29.99:8019'
          : '/api'

        const url = `${API_BASE}/category_list`
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'login': login,
            'api-key': apiKey,
            'lang': i18n.language === 'gu' ? 'gu' : 'en'
          }
        })

        if (response.ok) {
          const data = await response.json()
          let records = []
          if (data && data.records && Array.isArray(data.records)) {
            records = data.records
          } else if (Array.isArray(data)) {
            records = data
          }

          const matched = records.find(r => String(r.id) === String(categoryId))
          if (matched) {
            setCategoryName(matched.name || matched.display_name || categoryName)
          }
        }
      } catch (err) {
        console.error('Error updating category translation:', err)
      }
    }

    fetchCategoryName()
  }, [categoryId, i18n.language, user, t])

  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (setPageLoading) {
      setPageLoading('products', isLoading)
    }
    return () => {
      if (setPageLoading) {
        setPageLoading('products', false)
      }
    }
  }, [isLoading, setPageLoading])

  const fetchProducts = useCallback(async () => {
    if (!selectedCategory) return
    setIsLoading(true)
    setErrorMsg('')
    setProducts([])

    try {
      const login = user?.username || 'admin'
      const apiKey = user?.apiKey || localStorage.getItem('api-key') || ''

      const API_BASE = (Capacitor.isNativePlatform() || !import.meta.env.DEV)
        ? 'http://192.168.29.99:8019'
        : '/api'

      const categId = selectedCategory.id === 'uncategorized' ? 'false' : selectedCategory.id
      const url = `${API_BASE}/category_products?model=product.category&categ_id=${categId}`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'login': login,
          'api-key': apiKey,
          'lang': i18n.language === 'gu' ? 'gu' : 'en'
        }
      })

      if (response.status === 401 || response.status === 403) {
        onLogout()
        return
      }

      if (!response.ok) {
        throw new Error(t('products_not_found'))
      }

      const data = await response.json()
      let fetchedProducts = []
      if (data && data.records && Array.isArray(data.records)) {
        fetchedProducts = data.records
      } else if (Array.isArray(data)) {
        fetchedProducts = data
      }

      const formatted = fetchedProducts.map(record => {
        let categoryName = t('other_uncategorized')
        let categoryId = 'uncategorized'
        if (Array.isArray(record.categ_id) && record.categ_id.length > 0) {
          categoryId = record.categ_id[0]
          categoryName = record.categ_id[1] || t('other_uncategorized')
        } else if (typeof record.categ_id === 'number') {
          categoryId = record.categ_id
        } else if (typeof record.categ_id === 'string') {
          categoryName = record.categ_id
        }

        return {
          id: record.id,
          name: record.name,
          display_name: record.display_name.replace(/\[[^\]]*\]/g, ''),
          price: record.list_price !== undefined ? record.list_price : 0,
          categoryId: categoryId,
          category: categoryName,
          image: record.image,
          taxes: record.taxes || []
        }
      })

      setProducts(formatted)
    } catch (err) {
      console.error('Error fetching products:', err)
      let msg = t('network_error_retry')
      if (!navigator.onLine) {
        msg = t('no_internet_connection')
      } else if (err.name === 'TypeError') {
        msg = t('server_connection_failed')
      } else if (err.message) {
        msg = err.message
      }
      setErrorMsg(msg)
    } finally {
      setIsLoading(false)
    }
  }, [selectedCategory, user, onLogout, t, i18n.language])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleRefresh = async () => {
    await fetchProducts()
  }

  const productsContent = (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="p-2.5 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-450 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl transition-all cursor-pointer flex items-center justify-center"
          title={t('back_to_categories')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 margin-0">
            {t('products_in_category', { category: categoryName })}
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">
            {t('viewing_products')}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 rounded-xl text-sm border flex items-start gap-3 transition-all duration-300 bg-rose-50/60 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-350">
          <svg className="w-5 h-5 flex-shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Skeletons Loader */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`prod-skeleton-${i}`}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 animate-pulse flex flex-col justify-between aspect-[3/4]"
            >
              <div className="w-full aspect-square bg-zinc-200 dark:bg-zinc-800 rounded-xl mb-3"></div>
              <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3 mb-2"></div>
              <div className="flex justify-between items-center mt-2">
                <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-12"></div>
                <div className="w-7.5 h-7.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Products Grid list */}
      {!isLoading && products.length === 0 && !errorMsg && (
        <div className="p-12 bg-zinc-50/50 dark:bg-zinc-900/20 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center text-sm text-zinc-500 font-medium">
          {t('category_empty')}
        </div>
      )}

      {!isLoading && products.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {products.map(product => {
            const cartItem = cart.find(item => item.id === product.id)
            const cartQuantity = cartItem ? cartItem.quantity : 0

            return (
              <div
                key={product.id}
                className="bg-zinc-50/60 dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between hover:border-purple-800 dark:hover:border-purple-800 transition-all duration-300 relative text-left"
              >
                {/* Product Image section */}
                <div className="w-full aspect-square flex items-center justify-center overflow-hidden flex-shrink-0">
                  <ProductImage src={product.image} name={product.name} />
                </div>

                {/* Product Details Section */}
                <div className="flex-1 flex flex-col justify-between mt-3">
                  <h4 className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2 min-h-[32px] overflow-hidden" title={product.name}>
                    {product.display_name}
                  </h4>

                  {/* Tax Information */}
                  <div className="flex flex-col gap-0.5 mt-1 text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                    <span>
                      {t('tax_label', { defaultValue: 'Tax' })}: {product.taxes && product.taxes.length > 0 ? product.taxes.map(t => t.name).join(', ') : '0%'}
                    </span>
                    <span>
                      {t('taxable_label', { defaultValue: 'Taxable' })}: ₹{(product.price * (cartQuantity || 1)).toFixed(2)}
                    </span>
                  </div>

                  {/* Pricing and Action button row */}
                  <div className="flex items-center justify-between mt-4">
                    {/* Price display */}
                    <div className="flex items-center gap-0.5">
                      <span className="text-xs font-semibold text-[#6941c6] dark:text-purple-400">₹</span>
                      <span className="text-xs font-bold text-zinc-950 dark:text-zinc-50">
                        {Number(product.price).toFixed(2)}
                      </span>
                    </div>

                    {/* Quantity selectors or Add Button */}
                    <div className="flex-shrink-0">
                      {cartQuantity > 0 ? (
                        editingOrder && isShippingProduct(product) ? (
                          <div className="px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                            {t('qty_label', { defaultValue: 'Qty' })}: {cartQuantity}
                          </div>
                        ) : (
                          <div className="flex items-center bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-800 p-0.5 rounded-lg">
                            <button
                              type="button"
                              disabled={editingOrder && isShippingProduct(product) && cartQuantity === 1}
                              onClick={() => {
                                if (cartQuantity === 1) {
                                  onRemoveItem(product.id)
                                } else {
                                  onUpdateQuantity(product.id, cartQuantity - 1)
                                }
                              }}
                              className="w-5.5 h-5.5 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              -
                            </button>
                            <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-50 px-1 min-w-[12px] text-center">
                              {cartQuantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(product.id, cartQuantity + 1)}
                              className="w-5.5 h-5.5 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        )
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onAddToCart(product, 1)
                            addToast(t('added_to_cart_toast', { name: product.name, quantity: 1 }), 'success')
                          }}
                          className="w-7 h-7 bg-[#6941c6] hover:bg-[#5b37ad] text-white rounded-lg transition-all shadow-sm hover:shadow flex items-center justify-center cursor-pointer animate-btn-in"
                          title={t('add_to_cart')}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
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
      {productsContent}
    </PullToRefresh>
  ) : (
    productsContent
  )
}
