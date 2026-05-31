import React from 'react'
import {
  LayoutDashboard, TrendingUp, Settings, FileText,
  Activity, ChevronLeft, ChevronRight, Bot, Zap,
  Bell, LogOut
} from 'lucide-react'
import { useUIStore, useAuthStore, useBotStore } from '../../store'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'scanner', label: 'AI Scanner', icon: Zap },
  { id: 'trades', label: 'Trade Journal', icon: FileText },
  { id: 'bot', label: 'Bot Control', icon: Bot },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const { activePage, setActivePage, sidebarOpen, setSidebarOpen, notifications } = useUIStore()
  const { logout, user } = useAuthStore()
  const { status, mode, paperBalance } = useBotStore()

  const unread = notifications.length

  const statusColors = {
    running: '#00ff88',
    paused: '#ffd60a',
    stopped: '#ff3366'
  }

  return (
    <aside
      className="flex flex-col h-full transition-all duration-300 relative"
      style={{
        width: sidebarOpen ? '220px' : '64px',
        background: 'linear-gradient(180deg, #0d0d1a 0%, #10102a 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', boxShadow: '0 0 15px rgba(0,212,255,0.4)' }}>
          <Activity size={16} className="text-white" />
        </div>
        {sidebarOpen && (
          <div className="animate-fade-in overflow-hidden">
            <div className="text-sm font-bold text-white leading-tight">StrategiSpot</div>
            <div className="text-xs" style={{ color: '#00d4ff' }}>AI Trading Bot</div>
          </div>
        )}
      </div>

      {/* Bot Status Mini Card */}
      {sidebarOpen && (
        <div className="mx-3 mt-3 p-3 rounded-lg animate-fade-in"
          style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.12)' }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-white/50">Bot Status</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full animate-pulse-slow"
                style={{ backgroundColor: statusColors[status] || '#888' }} />
              <span className="text-xs font-semibold capitalize"
                style={{ color: statusColors[status] }}>{status}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">Mode</span>
            <span className="text-xs font-medium uppercase" style={{ color: mode === 'paper' ? '#ffd60a' : '#00ff88' }}>
              {mode}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-white/50">Balance</span>
            <span className="text-xs font-mono font-medium" style={{ color: '#00d4ff' }}>
              ${paperBalance?.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 pt-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activePage === item.id
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setActivePage(item.id)}
              className="sidebar-item w-full text-left"
              style={isActive ? {
                background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,102,255,0.1))',
                color: '#00d4ff',
                border: '1px solid rgba(0,212,255,0.2)'
              } : {}}
              title={!sidebarOpen ? item.label : ''}
            >
              <Icon size={16} className="flex-shrink-0" />
              {sidebarOpen && (
                <span className="animate-fade-in truncate">{item.label}</span>
              )}
              {/* Notification badge for alerts */}
              {item.id === 'dashboard' && unread > 0 && sidebarOpen && (
                <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: '#ff3366', color: 'white', fontSize: '10px' }}>
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="p-2 border-t border-white/5">
        {sidebarOpen ? (
          <div className="flex items-center gap-2 px-2 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', color: 'white' }}>
              {user?.username?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-xs font-medium text-white truncate">{user?.username || 'Admin'}</div>
              <div className="text-xs text-white/40 capitalize">{user?.role || 'admin'}</div>
            </div>
            <button onClick={logout} className="p-1 rounded hover:text-red-400 transition-colors" title="Logout">
              <LogOut size={14} className="text-white/40 hover:text-red-400" />
            </button>
          </div>
        ) : (
          <button onClick={logout} className="sidebar-item w-full justify-center" title="Logout">
            <LogOut size={16} />
          </button>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute -right-3 top-16 w-6 h-6 rounded-full flex items-center justify-center z-10 transition-all hover:scale-110"
        style={{ background: '#1a1a3a', border: '1px solid rgba(0,212,255,0.3)', color: '#00d4ff' }}
      >
        {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>
    </aside>
  )
}
