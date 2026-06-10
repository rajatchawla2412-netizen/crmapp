import { Capacitor, CapacitorHttp } from '@capacitor/core'

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

export async function customFetch(url, options = {}) {
  if (Capacitor.isNativePlatform()) {
    try {
      const method = options.method || 'GET'
      const headers = {}
      
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          headers[key] = String(value)
        })
      }

      let requestData = options.body
      if (requestData && typeof requestData === 'string') {
        const contentType = Object.keys(headers).find(k => k.toLowerCase() === 'content-type')
        const isJson = contentType && headers[contentType].toLowerCase().includes('application/json')
        if (isJson) {
          try {
            requestData = JSON.parse(requestData)
          } catch (e) {
            // Keep as string if parsing fails
          }
        }
      }

      const response = await CapacitorHttp.request({
        url,
        method,
        headers,
        data: requestData
      })

      return {
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        statusText: String(response.status),
        headers: {
          get: (name) => {
            const lowerName = name.toLowerCase()
            const foundKey = Object.keys(response.headers || {}).find(
              k => k.toLowerCase() === lowerName
            )
            return foundKey ? response.headers[foundKey] : null
          }
        },
        json: async () => {
          if (typeof response.data === 'string') {
            return JSON.parse(response.data)
          }
          return response.data
        },
        text: async () => {
          if (typeof response.data === 'object') {
            return JSON.stringify(response.data)
          }
          return response.data
        }
      }
    } catch (error) {
      console.error('CapacitorHttp native request failed:', error)
      throw error
    }
  }

  return fetch(url, options)
}
