import { Capacitor } from '@capacitor/core'

export function getApiBaseUrl() {
  const savedUrl = localStorage.getItem('server-url')
  const defaultApiUrl = import.meta.env.VITE_API_BASE_URL || 'http://192.168.29.191:8099'
  
  if (!Capacitor.isNativePlatform() && import.meta.env.DEV) {
    if (savedUrl) {
      const cleanSaved = savedUrl.replace(/^(https?:\/\/)?/, '').replace(/\/+$/, '')
      const cleanDefault = defaultApiUrl.replace(/^(https?:\/\/)?/, '').replace(/\/+$/, '')
      if (cleanSaved === cleanDefault) {
        return '/api'
      }
    } else {
      return '/api'
    }
  }
  
  return savedUrl || defaultApiUrl
}
