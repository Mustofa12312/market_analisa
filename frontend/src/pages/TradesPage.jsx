import React from 'react'
import TradeJournal from '../components/TradeJournal/TradeJournal'
import { useTradeStore } from '../store'

export default function TradesPage() {
  const { stats } = useTradeStore()

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-auto scrollable">
      {/* Performance Overview */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-shrink-0">
          {[
            {
              label: 'Total Trades',
              value: stats.totalTrades,
              sub: `${stats.winningTrades}W · ${stats.losingTrades}L`,
              color: '#00d4ff'
            },
            {
              label: 'Win Rate',
              value: `${stats.winRate}%`,
              sub: 'Success ratio',
              color: stats.winRate >= 50 ? '#00ff88' : '#ff3366'
            },
            {
              label: 'Total PnL',
              value: `$${stats.totalPnl?.toFixed(2)}`,
              sub: `${stats.totalReturn >= 0 ? '+' : ''}${stats.totalReturn}% total`,
              color: stats.totalPnl >= 0 ? '#00ff88' : '#ff3366'
            },
            {
              label: 'Profit Factor',
              value: stats.profitFactor || '—',
              sub: stats.openPositions > 0 ? `${stats.openPositions} open positions` : 'No open positions',
              color: '#ffd60a'
            },
          ].map(s => (
            <div key={s.label} className="card p-4">
              <p className="text-xs text-white/50 mb-1">{s.label}</p>
              <p className="text-xl font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-white/40 mt-1">{s.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Full Trade Journal */}
      <div className="flex-1 min-h-0">
        <TradeJournal compact={false} />
      </div>
    </div>
  )
}
