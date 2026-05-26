import React, { useState } from 'react'

export default function LandingPage({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('Overview')

  // Mock CRM Metrics
  const metrics = [
    { 
      name: 'Total Leads', 
      value: '1,482', 
      change: '+14.3%', 
      trend: 'up',
      icon: (
        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A2.25 2.25 0 0112.75 21.5h-1.5a2.25 2.25 0 01-2.25-2.263V19.13m4.121-3.077A9.38 9.38 0 0012 15.75c-1.39 0-2.68.303-3.84.845m8.59-4.845a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM5.25 5.25a3 3 0 11-6 0 3 3 0 016 0zM6 10.5a9.75 9.75 0 00-3.033.486 4.125 4.125 0 00-3 3.861 8.874 8.874 0 0010.066-.3m-.066-4.048A9.75 9.75 0 008.966 10.5m-3.82 4.156a9.07 9.07 0 01-2.735-1.077" />
        </svg>
      )
    },
    { 
      name: 'Conversion Rate', 
      value: '22.8%', 
      change: '+3.2%', 
      trend: 'up',
      icon: (
        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
        </svg>
      )
    },
    { 
      name: 'Active Deals', 
      value: '$48,250', 
      change: '+8.1%', 
      trend: 'up',
      icon: (
        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      name: 'System Response', 
      value: '99.98%', 
      change: 'Stable', 
      trend: 'stable',
      icon: (
        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      )
    }
  ]

  // Mock CRM Recent Activity
  const activities = [
    { id: 1, action: 'Lead verified successfully', target: 'John Doe', time: '2 mins ago', type: 'success' },
    { id: 2, action: 'New opportunity created', target: 'Acme Corp Deal', time: '1 hour ago', type: 'info' },
    { id: 3, action: 'Follow-up scheduled with', target: 'Sarah Jenkins', time: '3 hours ago', type: 'pending' },
    { id: 4, action: 'Auth session established for', target: user ? `@${user.username}` : 'operator', time: 'Just now', type: 'auth' }
  ]

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

        <div className="hidden md:flex items-center gap-1">
          {['Overview', 'Leads', 'Deals', 'Analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30'
              }`}
            >
              {tab}
            </button>
          ))}
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
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 md:py-12 space-y-10">
        
        {/* Welcome Banner */}
        <section className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 md:p-8 shadow-xl shadow-zinc-200/20 dark:shadow-none relative overflow-hidden transition-all duration-300">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/20 rounded-full text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mb-4 tracking-wide uppercase">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                Secure API Authenticated
              </div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 !margin-0">
                Welcome back to your workspace
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2 max-w-xl leading-relaxed">
                Your CRM instance is active and loaded. You logged in as <span className="font-semibold text-zinc-800 dark:text-zinc-200">{user ? `${user.firstName} ${user.lastName}` : 'Operator'}</span> ({user?.email || 'no-email'}).
              </p>
            </div>
            
            <div className="flex-shrink-0 flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/40 rounded-2xl flex items-center justify-center border border-purple-100 dark:border-purple-900/30 text-purple-600 dark:text-purple-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">Security State</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Enforced HTTPS</p>
              </div>
            </div>
          </div>
        </section>

        {/* Metrics Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, i) => (
            <div 
              key={i} 
              className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2.5xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  {metric.name}
                </span>
                <div className="w-9 h-9 bg-zinc-50 dark:bg-zinc-950 rounded-xl flex items-center justify-center border border-zinc-100 dark:border-zinc-800/40">
                  {metric.icon}
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">
                  {metric.value}
                </span>
                <span className={`text-xs font-medium ${
                  metric.trend === 'up' 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-zinc-400 dark:text-zinc-500'
                }`}>
                  {metric.change}
                </span>
              </div>
            </div>
          ))}
        </section>

        {/* Dashboard Panels */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Activity Log */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 md:p-8 transition-colors duration-300">
            <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight mb-6">
              Recent Activity Feed
            </h3>
            
            <div className="space-y-6">
              {activities.map((act) => (
                <div key={act.id} className="flex items-start justify-between gap-4 py-1.5 group">
                  <div className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                      act.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                      act.type === 'info' ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400' :
                      act.type === 'auth' ? 'bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/30 text-purple-600 dark:text-purple-400' :
                      'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 text-amber-600 dark:text-amber-400'
                    }`}>
                      {act.type === 'success' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      )}
                      {act.type === 'info' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                      )}
                      {act.type === 'pending' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      )}
                      {act.type === 'auth' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {act.action}{' '}
                        <span className="font-semibold text-purple-600 dark:text-purple-400 group-hover:underline cursor-pointer">
                          {act.target}
                        </span>
                      </p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">{act.time}</p>
                    </div>
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 group-hover:bg-purple-500 transition-colors mt-2"></span>
                </div>
              ))}
            </div>
          </div>

          {/* CRM Status & Shortcuts Panel */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 md:p-8 flex flex-col justify-between transition-colors duration-300">
            <div>
              <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight mb-4">
                CRM Agent Panel
              </h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed mb-6">
                Quick actions to perform typical workflow actions within the client records workspace.
              </p>

              <div className="space-y-3">
                <button className="w-full text-left p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 hover:border-purple-200 dark:hover:border-purple-900/30 rounded-2xl flex items-center justify-between transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    </div>
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Register New Lead</span>
                  </div>
                  <svg className="w-3.5 h-3.5 text-zinc-400 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                </button>
                <button className="w-full text-left p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 hover:border-purple-200 dark:hover:border-purple-900/30 rounded-2xl flex items-center justify-between transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.5 4.5L21.75 7.5m-3-1.5h3v3M2.25 21.75h19.5" /></svg>
                    </div>
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">View Sales Analytics</span>
                  </div>
                  <svg className="w-3.5 h-3.5 text-zinc-400 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                </button>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-widest">
                Database Node A
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                Connected
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 bg-white dark:bg-zinc-900 border-t border-zinc-200/60 dark:border-zinc-800/60 text-center text-xs text-zinc-400 dark:text-zinc-500 transition-colors duration-300 mt-auto">
        <p>&copy; {new Date().getFullYear()} crmapp. All rights reserved.</p>
      </footer>
    </div>
  )
}

