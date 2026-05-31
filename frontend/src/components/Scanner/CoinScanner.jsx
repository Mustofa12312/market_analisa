import React, { useEffect, useState } from 'react'
import { Zap, TrendingUp, TrendingDown, Minus, RefreshCw, ChevronUp } from 'lucide-react'
import api from '../../lib/api'
import { useMarketStore } from '../../store'
import toast from 'react-hot-toast'

function RiskBadge({ level }) {
  const styles = {
    LOW: { color: '#00ff88', bg: 'rgba(0,255,136,0.1)', border: 'rgba(0,255,136,0.2)' },
    'MEDIUM-LOW': { color: '#00d4ff', bg: 'rgba(0,212,255,0.1)', border: 'rgba(0,212,255,0.2)' },
    MEDIUM: { color: '#ffd60a', bg: 'rgba(255,214,10,0.1)', border: 'rgba(255,214,10,0.2)' },
    HIGH: { color: '#ff3366', bg: 'rgba(255,51,102,0.1)', border: 'rgba(255,51,102,0.2)' },
  }
  const s = styles[level] || styles.MEDIUM
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {level}
    </span>
  )
}

function ScoreBar({ score }) {
  const color = score >= 65 ? '#00ff88' : score >= 40 ? '#ffd60a' : '#ff3366'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, background: `linear-gradient(90deg, ${color}80, ${color})` }} />
      </div>
      <span className="text-xs font-bold font-mono w-8 text-right"
        style={{ color }}>{score}</span>
    </div>
  )
}

export default function CoinScanner() {
  const { signals, updateSignals } = useMarketStore()
  const [loading, setLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(null)

  const refresh = async () => {
    setLoading(true)
    try {
      const res = await api.get('/market/signals')
      updateSignals(res.data)
      setLastRefresh(new Date())
    } catch (err) {
      toast.error('Failed to refresh signals')
    }
    setLoading(false)
  }

  useEffect(() => {
    if (signals.length === 0) refresh()
  }, [])

  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Zap size={15} style={{ color: '#ffd60a' }} />
          <h3 className="text-sm font-semibold text-white">AI Coin Scanner</h3>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-white/30">
              {lastRefresh.toLocaleTimeString('id-ID', { hour12: false })}
            </span>
          )}
          <button id="btn-refresh-signals" onClick={refresh} disabled={loading}
            className="p-1.5 rounded-lg transition-all hover:bg-white/5"
            style={{ color: '#00d4ff' }}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto scrollable">
        {signals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 gap-3">
            <div className="w-10 h-10 border-2 rounded-full animate-spin"
              style={{ borderColor: 'rgba(0,212,255,0.2)', borderTopColor: '#00d4ff' }} />
            <p className="text-sm text-white/40">Loading signals...</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {signals.map((s, i) => {
              const symbol = s.symbol.replace('USDT', '')
              return (
                <div key={s.symbol} id={`scanner-row-${s.symbol}`}
                  className="px-4 py-3 hover:bg-white/2 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white/40 w-4">#{i + 1}</span>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          background: symbol === 'BTC' ? 'linear-gradient(135deg, #f7931a, #e8820c)' :
                            symbol === 'ETH' ? 'linear-gradient(135deg, #627eea, #4a5fd8)' :
                            'linear-gradient(135deg, #9945ff, #7b2fe0)',
                          color: 'white'
                        }}>
                        {symbol[0]}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white">{symbol}</span>
                        <span className="text-xs text-white/40">/USDT</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <RiskBadge level={s.riskLevel} />
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        s.signal === 'BUY' ? 'badge-buy' :
                        s.signal === 'SELL' ? 'badge-sell' : 'badge-hold'
                      }`}>
                        {s.signal === 'BUY' ? <TrendingUp size={10} className="inline mr-1" /> :
                          s.signal === 'SELL' ? <TrendingDown size={10} className="inline mr-1" /> :
                          <Minus size={10} className="inline mr-1" />}
                        {s.signal}
                      </span>
                    </div>
                  </div>

                  <ScoreBar score={s.aiScore || 50} />

                  <div className="flex items-center justify-between mt-2 flex-wrap gap-1">
                    <div className="flex gap-3 text-xs">
                      {s.indicators?.rsi != null && (
                        <span className="text-white/40">
                          RSI <span className="font-mono"
                            style={{ color: s.indicators.rsi < 30 ? '#00ff88' : s.indicators.rsi > 70 ? '#ff3366' : '#ffd60a' }}>
                            {s.indicators.rsi?.toFixed(1)}
                          </span>
                        </span>
                      )}
                      <span className="text-white/40">
                        Price <span className="font-mono text-white/70">${s.price?.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </span>
                    </div>
                    {s.reasons && s.reasons.length > 0 && (
                      <span className="text-xs text-white/30 truncate max-w-[180px]" title={s.reasons.join(', ')}>
                        {s.reasons[0]}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
