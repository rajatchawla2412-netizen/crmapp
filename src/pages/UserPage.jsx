import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { customFetch, getApiBaseUrl } from '../utils/api'

export default function UserPage({ user, onLogout }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    street: '',
    street2: '',
    city: '',
    zip: '',
    state: '',
    country: ''
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const fetchProfile = useCallback(async () => {
    setIsLoading(true)
    setErrorMsg('')
    try {
      const login = user?.username || ''
      const apiKey = user?.apiKey || localStorage.getItem('api-key') || ''
      const db = user?.db || localStorage.getItem('server-db') || ''
      const API_BASE = getApiBaseUrl()

      const response = await customFetch(`${API_BASE}/edit_profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'login': login,
          'api-key': apiKey,
          'db': db
        },
        body: JSON.stringify({})
      })

      if (!response.ok) {
        throw new Error('Failed to load profile data')
      }

      const data = await response.json()
      if (data.status === 'success' && data.records && data.records.length > 0) {
        const record = data.records[0]
        setProfile({
          name: record.name || '',
          phone: record.phone || '',
          street: record.street || '',
          street2: record.street2 || '',
          city: record.city || '',
          zip: record.zip || '',
          state: record.state || '',
          country: record.country || ''
        })
      } else {
        throw new Error(data.message || 'Failed to load profile records')
      }
    } catch (err) {
      console.error(err)
      setErrorMsg(t('error_fetching_profile') || 'Error fetching profile details.')
    } finally {
      setIsLoading(false)
    }
  }, [user, i18n.language])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleInputChange = (field, val) => {
    setProfile(prev => ({
      ...prev,
      [field]: val
    }))
  }

  const handleUpdate = async (e) => {
    if (e) e.preventDefault()
    setIsLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const login = user?.username || ''
      const apiKey = user?.apiKey || localStorage.getItem('api-key') || ''
      const db = user?.db || localStorage.getItem('server-db') || ''
      const API_BASE = getApiBaseUrl()

      const response = await customFetch(`${API_BASE}/edit_profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'login': login,
          'api-key': apiKey,
          'db': db
        },
        body: JSON.stringify(profile)
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      const data = await response.json()
      if (data.status === 'success') {
        setSuccessMsg(t('profile_update_success') || 'Profile updated successfully!')
        setIsEditing(false)

        // Update user state name locally
        const savedUserStr = localStorage.getItem('user')
        if (savedUserStr) {
          try {
            const savedUser = JSON.parse(savedUserStr)
            const nameParts = profile.name.split(' ')
            savedUser.firstName = nameParts[0] || ''
            savedUser.lastName = nameParts.slice(1).join(' ') || ''
            localStorage.setItem('user', JSON.stringify(savedUser))
            // Reload page to propagate changes across header operator greetings
            window.location.reload()
          } catch (e) {
            console.error('Error updating local storage user name:', e)
          }
        }
      } else {
        throw new Error(data.message || t('error_updating_profile') || 'Failed to update profile')
      }
    } catch (err) {
      console.error(err)
      setErrorMsg(err.message || t('error_updating_profile') || 'Error updating profile.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoutClick = () => {
    const confirmLogout = window.confirm(t('logout_confirm') || 'Are you sure you want to logout?')
    if (confirmLogout) {
      onLogout(false)
    }
  }

  return (
    <div className="space-y-8 text-left animate-fade-in select-none font-sans">

      {/* Title Section (Flat text matching CategoriesPage, with brand purple heading color) */}
      <section className="relative transition-all duration-300">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-left">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 margin-0">
              {t('user_settings') || 'User Settings'}
            </h1>
            <p className="text-zinc-555 dark:text-zinc-400 text-sm mt-2 max-w-xl leading-relaxed">
              {t('user_settings_description') || 'Manage your operator profile details, active database connection, and account actions.'}
            </p>
          </div>
        </div>
      </section>

      {/* Message Banners */}
      {errorMsg && (
        <div className="p-4 bg-rose-50/60 dark:bg-rose-955/20 border border-rose-100/50 dark:border-rose-900/30 text-rose-700 dark:text-rose-455 rounded-2xl text-sm font-medium">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50/60 dark:bg-emerald-955/20 border border-emerald-100/50 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-450 rounded-2xl text-sm font-medium">
          {successMsg}
        </div>
      )}

      {/* Operator Info Card */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 shadow-sm flex flex-col gap-6 text-left relative overflow-hidden">

        {/* Detail section: Photo left, details right */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Profile Photo */}
          <div className="relative flex-shrink-0">
            {user?.image ? (
              <img
                src={user.image}
                alt={user.username}
                className="w-20 h-20 rounded-full border-2 border-brand-red bg-white dark:bg-zinc-950 shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 rounded-full border-2 border-brand-red bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center text-brand-650 dark:text-brand-400 font-extrabold text-3xl shadow-sm">
                {user?.firstName?.charAt(0) || 'U'}
              </div>
            )}
          </div>

          {/* Right Details */}
          <div className="flex-1 w-full space-y-4">
            {!isEditing ? (
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h2 className="text-xl font-extrabold text-zinc-900 dark:text-purple-400 leading-tight">
                      {profile.name || (user ? `${user.firstName} ${user.lastName || ''}` : t('operator') || 'Operator')}
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-300 font-bold mt-1">
                      @{user?.username || 'username'}
                    </p>
                  </div>

                  {/* Database Info Badge (using white background instead of zinc) */}
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/85 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 shadow-sm">
                    <svg className="w-3.5 h-3.5 text-brand-red" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V10.125M3.75 10.125v3.75m16.5-3.75v3.75m-16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125v-3.75m16.5 0v3.75" />
                    </svg>
                    <span>{t('database') || 'Database'}:</span>
                    <span className="font-mono text-brand-red dark:text-purple-400 font-bold">{user?.db || 'rest_api'}</span>
                  </div>
                </div>
                <div className="pt-1 flex flex-col gap-1 text-sm font-bold text-zinc-850 dark:text-zinc-200">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-zinc-455 dark:text-purple-400 mr-2">{t('phone') || 'Phone'}</span>
                    <span>{profile.phone || t('not_available') || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-455 dark:text-zinc-555 uppercase tracking-wider mb-1">
                    {t('name') || 'Name'}
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 focus:outline-none focus:border-brand-red transition-all duration-200 rounded-xl shadow-sm"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-455 dark:text-zinc-555 uppercase tracking-wider mb-1">
                    {t('phone') || 'Phone'}
                  </label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 focus:outline-none focus:border-brand-red transition-all duration-200 rounded-xl shadow-sm"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Address & Actions Area below photo */}
        <div className="space-y-4 pt-6 border-t border-zinc-100 dark:border-zinc-800/80 w-full">
          {!isEditing ? (
            <div className="space-y-4 text-sm w-full">
              {/* Purple heading */}
              <h3 className="text-[11px] font-black text-brand-red dark:text-purple-400 uppercase tracking-widest pl-0">
                {t('address_details') || 'Address Details'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-zinc-800 dark:text-zinc-200">
                <div className="space-y-1">
                  <p className="font-bold text-zinc-455 dark:text-zinc-500 text-[10px] uppercase tracking-wider">{t('street_address') || 'Street Address'}</p>
                  <p className="text-zinc-900 dark:text-zinc-50 font-semibold text-sm leading-relaxed">{profile.street || t('not_available') || 'N/A'}</p>
                  {profile.street2 && <p className="text-zinc-650 dark:text-zinc-400 font-medium text-xs pt-0.5">{profile.street2}</p>}
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-zinc-455 dark:text-zinc-500 text-[10px] uppercase tracking-wider">{t('region') || 'Region'}</p>
                  <p className="text-zinc-900 dark:text-zinc-50 font-semibold text-sm leading-relaxed">
                    {[profile.city, profile.state, profile.zip].filter(Boolean).join(', ') || t('not_available') || 'N/A'}
                  </p>
                  {profile.country && <p className="text-zinc-650 dark:text-zinc-400 font-bold text-xs pt-0.5">{profile.country}</p>}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-5 py-2.5 bg-brand-red hover:bg-brand-red-hover active:scale-95 text-white font-bold rounded-xl text-xs transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-md shadow-brand-red/10"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                  <span>{t('edit_profile_btn') || 'Edit Profile'}</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-5">
              {/* Purple heading */}
              <h3 className="text-[11px] font-black text-brand-red dark:text-purple-400 uppercase tracking-widest pl-0">
                {t('edit_address') || 'Edit Address'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-455 dark:text-zinc-555 uppercase tracking-wider mb-1">
                    {t('street_address') || 'Street Address'}
                  </label>
                  <input
                    type="text"
                    value={profile.street}
                    onChange={(e) => handleInputChange('street', e.target.value)}
                    className="w-full px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 focus:outline-none focus:border-brand-red transition-all duration-200 rounded-xl shadow-sm"
                    placeholder="e.g. Lemon tree residency"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-455 dark:text-zinc-555 uppercase tracking-wider mb-1">
                    {t('street_2') || 'Street 2'}
                  </label>
                  <input
                    type="text"
                    value={profile.street2}
                    onChange={(e) => handleInputChange('street2', e.target.value)}
                    className="w-full px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 focus:outline-none focus:border-brand-red transition-all duration-200 rounded-xl shadow-sm"
                    placeholder="e.g. Opp Keshav"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-455 dark:text-zinc-555 uppercase tracking-wider mb-1">
                    {t('city') || 'City'}
                  </label>
                  <input
                    type="text"
                    value={profile.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 focus:outline-none focus:border-brand-red transition-all duration-200 rounded-xl shadow-sm"
                    placeholder="e.g. Ahmedabad"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-455 dark:text-zinc-555 uppercase tracking-wider mb-1">
                    {t('zip_code') || 'Zip Code'}
                  </label>
                  <input
                    type="text"
                    value={profile.zip}
                    onChange={(e) => handleInputChange('zip', e.target.value)}
                    className="w-full px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 focus:outline-none focus:border-brand-red transition-all duration-200 rounded-xl shadow-sm"
                    placeholder="e.g. 380049"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-455 dark:text-zinc-555 uppercase tracking-wider mb-1">
                    {t('state') || 'State'}
                  </label>
                  <input
                    type="text"
                    value={profile.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="w-full px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 focus:outline-none focus:border-brand-red transition-all duration-200 rounded-xl shadow-sm"
                    placeholder="e.g. Gujarat"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-455 dark:text-zinc-555 uppercase tracking-wider mb-1">
                    {t('country') || 'Country'}
                  </label>
                  <input
                    type="text"
                    value={profile.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 focus:outline-none focus:border-brand-red transition-all duration-200 rounded-xl shadow-sm"
                    placeholder="e.g. India"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Edit Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs transition-all duration-200 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                  <span>{t('update_btn') || 'Update'}</span>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    setIsEditing(false)
                    setErrorMsg('')
                    setSuccessMsg('')
                    fetchProfile() // reset inputs
                  }}
                  className="px-5 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 active:scale-95 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl text-xs transition-all duration-200 cursor-pointer"
                >
                  {t('cancel_btn') || 'Cancel'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Account Actions Section */}
      <div className="flex flex-col gap-1 text-left">
        {/* Purple heading */}
        <h3 className="text-[11px] font-black text-brand-red dark:text-purple-400 uppercase tracking-widest pl-1 mb-1">
          {t('account_actions') || 'Account Actions'}
        </h3>

        {/* My Orders Button */}
        <button
          type="button"
          onClick={() => navigate('/orders')}
          className="w-full flex items-center justify-between py-4 px-1 hover:text-brand-red dark:hover:text-purple-400 transition-colors cursor-pointer group text-left"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-zinc-550 dark:text-zinc-400 group-hover:text-brand-red transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-brand-red transition-colors">
              {t('my_orders') || 'My Orders'}
            </span>
          </div>
          <svg className="w-4 h-4 text-zinc-400 dark:text-zinc-650 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Separator line */}
        <div className="border-t border-zinc-200/80 dark:border-zinc-800/80 my-0.5"></div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogoutClick}
          className="w-full flex items-center justify-between py-4 px-1 hover:text-rose-600 transition-colors cursor-pointer group text-left"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-zinc-550 dark:text-zinc-400 group-hover:text-brand-red transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-brand-red transition-colors">
              {t('logout_btn') || 'Logout'}
            </span>
          </div>
          <svg className="w-4 h-4 text-zinc-400 dark:text-zinc-650 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
