import React from 'react'
import { TrendingUp, TrendingDown, DollarSign, Activity, Target, AlertTriangle } from 'lucide-react'
import { useMarketStore, useBotStore, useTradeStore } from '../../store'

function PriceCard({ symbol, priceData }) {
  const displaySymbol = symbol.replace('USDT', '')
  const change = priceData?.change || 0
  const isUp = change >= 0

  return (
    <div className="card card-hover p-4 cursor-pointer" id={`price-card-${symbol}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{
              background: symbol === 'BTCUSDT' ? 'linear-gradient(135deg, #f7931a, #e8820c)' :
                symbol === 'ETHUSDT' ? 'linear-gradient(135deg, #627eea, #4a5fd8)' :
                'linear-gradient(135deg, #9945ff, #7b2fe0)',
              color: 'white'
            }}>
            {displaySymbol[0]}
          </div>
          <div>
            <div className="text-sm font-bold text-white">{displaySymbol}</div>
            <div className="text-xs text-white/40">USDT</div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className={`flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded`}
            style={{
              background: isUp ? 'rgba(0,255,136,0.1)' : 'rgba(255,51,102,0.1)',
              color: isUp ? '#00ff88' : '#ff3366'
            }}>
            {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {change >= 0 ? '+' : ''}{change?.toFixed(2)}%
          </div>
          {priceData?.isMock && (
            <span className="text-xs text-white/20 mt-0.5">DEMO</span>
          )}
        </div>
      </div>

      <div className="font-bold font-mono text-xl mb-2" style={{ color: '#00d4ff' }}>
        ${priceData?.price?.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '—'}
      </div>

      <div className="flex justify-between text-xs text-white/40">
        <span>H: ${priceData?.high?.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '—'}</span>
        <span>L: ${priceData?.low?.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '—'}</span>
      </div>

      {/* Volume bar */}
      <div className="mt-2 pt-2 border-t border-white/5">
        <div className="flex justify-between text-xs">
          <span className="text-white/40">Vol 24h</span>
          <span className="text-white/60 font-mono">{priceData?.quoteVolume ? `$${(priceData.quoteVolume / 1e6).toFixed(1)}M` : '—'}</span>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, subtext, icon: Icon, color, prefix = '' }) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-white/50 font-medium">{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${color}18`, color }}>
          <Icon size={14} />
        </div>
      </div>
      <div className="text-xl font-bold font-mono" style={{ color }}>
        {prefix}{typeof value === 'number' ? value?.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value || '—'}
      </div>
      {subtext && <div className="text-xs text-white/40 mt-1">{subtext}</div>}
    </div>
  )
}

export default function StatsGrid() {
  const { prices } = useMarketStore()
  const { paperBalance, dailyPnl, dailyLoss } = useBotStore()
  const { stats } = useTradeStore()

  const PAIRS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT']

  return (
    <div className="space-y-4">
      {/* Price Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PAIRS.map(sym => (
          <PriceCard key={sym} symbol={sym} priceData={prices[sym]} />
        ))}
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Paper Balance"
          value={paperBalance}
          prefix="$"
          icon={DollarSign}
          color="#00d4ff"
          subtext="Available balance"
        />
        <StatCard
          label="Win Rate"
          value={`${stats?.winRate || 0}%`}
          icon={Target}
          color="#00ff88"
          subtext={`${stats?.winningTrades || 0}W / ${stats?.losingTrades || 0}L`}
        />
        <StatCard
          label="Total PnL"
          value={stats?.totalPnl || 0}
          prefix="$"
          icon={TrendingUp}
          color={stats?.totalPnl >= 0 ? '#00ff88' : '#ff3366'}
          subtext={`${stats?.totalReturn || 0}% total return`}
        />
        <StatCard
          label="Daily Loss"
          value={dailyLoss || 0}
          prefix="-$"
          icon={AlertTriangle}
          color="#ff3366"
          subtext={`${stats?.openPositions || 0} open positions`}
        />
      </div>
    </div>
  )
}
