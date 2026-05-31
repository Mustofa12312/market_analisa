import React from 'react'
import CoinScanner from '../components/Scanner/CoinScanner'
import { useMarketStore } from '../store'

export default function ScannerPage() {
  const { signals } = useMarketStore()

  const buyCount = signals.filter(s => s.signal === 'BUY').length
  const sellCount = signals.filter(s => s.signal === 'SELL').length
  const avgScore = signals.length > 0
    ? (signals.reduce((a, s) => a + (s.aiScore || 50), 0) / signals.length).toFixed(0)
    : 0

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-auto scrollable">
      {/* Scanner Summary */}
      <div className="grid grid-cols-3 gap-3 flex-shrink-0">
        <div className="card p-4 text-center">
          <p className="text-xs text-white/50 mb-1">BUY Signals</p>
          <p className="text-2xl font-bold" style={{ color: '#00ff88' }}>{buyCount}</p>
          <p className="text-xs text-white/40 mt-1">Active opportunities</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-white/50 mb-1">Avg AI Score</p>
          <p className="text-2xl font-bold" style={{ color: '#ffd60a' }}>{avgScore}</p>
          <p className="text-xs text-white/40 mt-1">Out of 100</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-white/50 mb-1">SELL Signals</p>
          <p className="text-2xl font-bold" style={{ color: '#ff3366' }}>{sellCount}</p>
          <p className="text-xs text-white/40 mt-1">Bearish setups</p>
        </div>
      </div>

      {/* Full Scanner */}
      <div className="flex-1 min-h-0">
        <CoinScanner />
      </div>
    </div>
  )
}
