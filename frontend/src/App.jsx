import React from 'react'
import { Toaster } from 'react-hot-toast'
import { useAuthStore, useUIStore } from './store'
import { useWebSocket } from './hooks/useWebSocket'
import Sidebar from './components/Layout/Sidebar'
import TopBar from './components/Layout/TopBar'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ScannerPage from './pages/ScannerPage'
import TradesPage from './pages/TradesPage'
import BotPage from './pages/BotPage'
import SettingsPage from './pages/SettingsPage'

function AppContent() {
  const { activePage } = useUIStore()

  // Connect WebSocket when authenticated
  useWebSocket()

  const pages = {
    dashboard: <DashboardPage />,
    scanner: <ScannerPage />,
    trades: <TradesPage />,
    bot: <BotPage />,
    settings: <SettingsPage />,
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#080810' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <main className="flex-1 min-h-0 overflow-hidden">
          {pages[activePage] || <DashboardPage />}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const { token } = useAuthStore()

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a3a',
            color: '#e2e8f0',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            fontSize: '13px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.4)'
          },
          success: {
            iconTheme: { primary: '#00ff88', secondary: '#080810' },
          },
          error: {
            iconTheme: { primary: '#ff3366', secondary: '#080810' },
          }
        }}
      />
      {token ? <AppContent /> : <LoginPage />}
    </>
  )
}
