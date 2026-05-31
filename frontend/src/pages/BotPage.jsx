import React from 'react'
import BotControlPanel from '../components/BotControl/BotControlPanel'
import { useBotStore } from '../store'
import { useEffect, useState } from 'react'
import api from '../lib/api'
import { Terminal } from 'lucide-react'

export default function BotPage() {
  const { status, dailyPnl, dailyLoss, paperBalance } = useBotStore()
  const [logs, setLogs] = useState([])

  useEffect(() => {
    api.get('/bot/logs?limit=30').then(res => setLogs(res.data)).catch(() => {})
    const interval = setInterval(() => {
      api.get('/bot/logs?limit=30').then(res => setLogs(res.data)).catch(() => {})
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const levelColor = { info: '#00d4ff', warn: '#ffd60a', error: '#ff3366', success: '#00ff88' }

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-auto scrollable">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-shrink-0">
        {[
          { label: 'Balance', value: `$${paperBalance?.toFixed(2)}`, color: '#00d4ff' },
          { label: 'Daily PnL', value: `${dailyPnl >= 0 ? '+' : ''}$${dailyPnl?.toFixed(2)}`, color: dailyPnl >= 0 ? '#00ff88' : '#ff3366' },
          { label: 'Daily Loss', value: `$${dailyLoss?.toFixed(2)}`, color: '#ff3366' },
          { label: 'Status', value: status, color: status === 'running' ? '#00ff88' : status === 'paused' ? '#ffd60a' : '#ff3366' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <p className="text-xs text-white/50 mb-1">{s.label}</p>
            <p className="text-lg font-bold font-mono capitalize" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-4 flex-1 min-h-0" style={{ minHeight: '400px' }}>
        {/* Bot Control */}
        <div style={{ flex: '0 0 340px' }}>
          <BotControlPanel />
        </div>

        {/* Execution Log */}
        <div className="card flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 flex-shrink-0">
            <Terminal size={14} style={{ color: '#00d4ff' }} />
            <h3 className="text-sm font-semibold text-white">Execution Log</h3>
          </div>
          <div className="flex-1 overflow-auto scrollable p-3 font-mono text-xs space-y-1">
            {logs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-white/30">
                <p>No logs yet...</p>
              </div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="flex gap-3 py-1 border-b border-white/3">
                  <span className="text-white/20 flex-shrink-0">
                    {new Date(log.created_at).toLocaleTimeString('id-ID', { hour12: false })}
                  </span>
                  <span className="flex-shrink-0 w-12 uppercase font-semibold"
                    style={{ color: levelColor[log.level] || '#00d4ff', fontSize: '10px' }}>
                    [{log.level}]
                  </span>
                  <span className="text-white/70 break-all">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
