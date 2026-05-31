import React, { useState, useEffect } from 'react'
import { Wifi, WifiOff, Bell, BellOff, RefreshCw } from 'lucide-react'
import { useBotStore, useMarketStore, useUIStore } from '../../store'

export default function TopBar() {
  const { status, mode, paperBalance, dailyPnl } = useBotStore()
  const { lastUpdated } = useMarketStore()
  const { notifications, clearNotifications, activePage } = useUIStore()
  const [wsConnected, setWsConnected] = useState(true)
  const [showNotifications, setShowNotifications] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const pageLabels = {
    dashboard: 'Dashboard',
    scanner: 'AI Coin Scanner',
    trades: 'Trade Journal',
    bot: 'Bot Control',
    settings: 'Settings'
  }

  const statusStyle = {
    running: { color: '#00ff88', bg: 'rgba(0,255,136,0.1)', border: 'rgba(0,255,136,0.2)' },
    paused: { color: '#ffd60a', bg: 'rgba(255,214,10,0.1)', border: 'rgba(255,214,10,0.2)' },
    stopped: { color: '#ff3366', bg: 'rgba(255,51,102,0.1)', border: 'rgba(255,51,102,0.2)' }
  }

  const ss = statusStyle[status] || statusStyle.stopped

  return (
    <header className="flex items-center justify-between px-6 py-3 relative"
      style={{
        background: 'rgba(13,13,26,0.95)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(10px)',
        zIndex: 100
      }}>
      {/* Left: Page title */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-white">
          {pageLabels[activePage] || 'Dashboard'}
        </h1>
        <div className="h-4 w-px bg-white/10" />
        <span className="text-xs text-white/40 font-mono">
          {currentTime.toLocaleTimeString('id-ID', { hour12: false })} WIB
        </span>
      </div>

      {/* Center: Status chips */}
      <div className="flex items-center gap-3">
        {/* Bot Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: ss.bg, border: `1px solid ${ss.border}`, color: ss.color }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: ss.color }} />
          <span className="capitalize">{status}</span>
        </div>

        {/* Mode */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{
            background: mode === 'paper' ? 'rgba(255,214,10,0.1)' : 'rgba(0,255,136,0.1)',
            border: `1px solid ${mode === 'paper' ? 'rgba(255,214,10,0.3)' : 'rgba(0,255,136,0.3)'}`,
            color: mode === 'paper' ? '#ffd60a' : '#00ff88'
          }}>
          {mode === 'paper' ? '📄 Paper' : '⚡ Live'}
        </div>

        {/* Daily PnL */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="text-white/50">PnL Today:</span>
          <span style={{ color: dailyPnl >= 0 ? '#00ff88' : '#ff3366' }}>
            {dailyPnl >= 0 ? '+' : ''}{dailyPnl?.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* WS Connection */}
        <div className="flex items-center gap-1.5 text-xs"
          style={{ color: lastUpdated ? '#00ff88' : '#ff3366' }}>
          {lastUpdated ? <Wifi size={13} /> : <WifiOff size={13} />}
          <span className="hidden sm:inline">
            {lastUpdated ? 'Live' : 'Offline'}
          </span>
        </div>

        {/* Balance */}
        <div className="hidden md:block text-xs font-mono px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)' }}>
          <span className="text-white/50 mr-1">Balance:</span>
          <span style={{ color: '#00d4ff' }}>
            ${paperBalance?.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            id="btn-notifications"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg transition-all hover:bg-white/5"
            style={{ color: notifications.length > 0 ? '#00d4ff' : 'rgba(255,255,255,0.4)' }}>
            <Bell size={16} />
            {notifications.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white flex items-center justify-center text-xs font-bold"
                style={{ background: '#ff3366', fontSize: '9px' }}>
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-10 w-80 rounded-xl overflow-hidden z-50 animate-slide-up"
              style={{
                background: '#0d0d1a',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
              }}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <span className="text-sm font-semibold text-white">Notifications</span>
                <button onClick={clearNotifications} className="text-xs text-white/40 hover:text-white">Clear</button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-white/30 text-sm">No notifications</div>
                ) : (
                  notifications.slice(0, 20).map(n => (
                    <div key={n.id} className="px-4 py-3 border-b border-white/5 hover:bg-white/3">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold"
                          style={{ color: n.type === 'success' ? '#00ff88' : n.type === 'error' ? '#ff3366' : '#ffd60a' }}>
                          {n.title}
                        </span>
                      </div>
                      <p className="text-xs text-white/60">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
