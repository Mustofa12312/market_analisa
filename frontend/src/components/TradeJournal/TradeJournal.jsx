import React, { useEffect, useState } from 'react'
import { FileText, TrendingUp, TrendingDown, X, RefreshCw, ChevronDown } from 'lucide-react'
import api from '../../lib/api'
import { useTradeStore } from '../../store'
import toast from 'react-hot-toast'

function TradeRow({ trade, onClose }) {
  const isOpen = trade.status === 'open'
  const isProfitable = trade.pnl > 0
  const side = trade.side

  return (
    <tr className="table-row text-sm">
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-white">{trade.symbol.replace('USDT', '')}</span>
          <span className="text-xs text-white/40">/USDT</span>
        </div>
      </td>
      <td className="py-2.5 px-3">
        <span className={side === 'BUY' ? 'badge-buy' : 'badge-sell'}>{side}</span>
      </td>
      <td className="py-2.5 px-3 font-mono text-xs text-white/80">
        ${trade.entry_price?.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      <td className="py-2.5 px-3 font-mono text-xs text-white/60">
        {trade.exit_price
          ? `$${trade.exit_price?.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : <span className="text-white/30">—</span>}
      </td>
      <td className="py-2.5 px-3">
        {isOpen ? (
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.2)' }}>
            OPEN
          </span>
        ) : (
          <div className="flex flex-col">
            <span className="text-xs font-bold font-mono"
              style={{ color: isProfitable ? '#00ff88' : '#ff3366' }}>
              {isProfitable ? '+' : ''}${trade.pnl?.toFixed(2)}
            </span>
            <span className="text-xs" style={{ color: isProfitable ? '#00ff88' : '#ff3366' }}>
              {isProfitable ? '+' : ''}{trade.pnl_percent?.toFixed(2)}%
            </span>
          </div>
        )}
      </td>
      <td className="py-2.5 px-3">
        <span className="text-xs font-semibold"
          style={{ color: '#ffd60a' }}>{trade.ai_score?.toFixed(0) || '—'}</span>
      </td>
      <td className="py-2.5 px-3 text-xs text-white/40">
        {trade.entry_time ? new Date(trade.entry_time).toLocaleDateString('id-ID') : '—'}
      </td>
      <td className="py-2.5 px-3">
        {isOpen && (
          <button id={`btn-close-trade-${trade.id}`}
            onClick={() => onClose(trade.id)}
            className="p-1 rounded hover:bg-red-500/10 transition-colors"
            style={{ color: '#ff3366' }}
            title="Close trade">
            <X size={13} />
          </button>
        )}
      </td>
    </tr>
  )
}

export default function TradeJournal({ compact = false }) {
  const { trades, setTrades, stats, setStats, loading, setLoading } = useTradeStore()
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(0)
  const LIMIT = compact ? 5 : 20

  const fetchTrades = async () => {
    setLoading(true)
    try {
      const [tradesRes, statsRes] = await Promise.all([
        api.get(`/trades?limit=${LIMIT}&offset=${page * LIMIT}&status=${filter}`),
        api.get('/trades/stats')
      ])
      setTrades(tradesRes.data.trades)
      setStats(statsRes.data)
    } catch (err) {
      toast.error('Failed to load trades')
    }
    setLoading(false)
  }

  useEffect(() => { fetchTrades() }, [filter, page])

  const handleClose = async (tradeId) => {
    try {
      const res = await api.post(`/trades/${tradeId}/close`, { reason: 'Manual close' })
      if (res.data.success) {
        toast.success(`Trade closed: PnL $${res.data.pnl?.toFixed(2)}`)
        fetchTrades()
      }
    } catch (err) {
      toast.error('Failed to close trade')
    }
  }

  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-white/60" />
          <h3 className="text-sm font-semibold text-white">Trade Journal</h3>
          {stats && (
            <span className="text-xs text-white/40">({stats.totalTrades} total)</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!compact && (
            <div className="flex gap-1">
              {['all', 'open', 'closed'].map(f => (
                <button key={f} onClick={() => { setFilter(f); setPage(0) }}
                  className="px-2 py-1 rounded text-xs capitalize transition-all"
                  style={filter === f ? {
                    background: 'rgba(0,212,255,0.15)',
                    color: '#00d4ff'
                  } : { color: 'rgba(255,255,255,0.4)' }}>
                  {f}
                </button>
              ))}
            </div>
          )}
          <button onClick={fetchTrades} id="btn-refresh-trades"
            className="p-1.5 rounded-lg hover:bg-white/5 transition-all" style={{ color: '#00d4ff' }}>
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      {stats && !compact && (
        <div className="grid grid-cols-4 gap-2 p-3 border-b border-white/5 flex-shrink-0">
          {[
            { label: 'Total', value: stats.totalTrades },
            { label: 'Win Rate', value: `${stats.winRate}%`, color: '#00ff88' },
            { label: 'Total PnL', value: `$${stats.totalPnl?.toFixed(2)}`, color: stats.totalPnl >= 0 ? '#00ff88' : '#ff3366' },
            { label: 'Best Trade', value: `$${stats.bestTrade?.toFixed(2)}`, color: '#ffd60a' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-xs font-bold font-mono" style={{ color: s.color || '#00d4ff' }}>{s.value}</div>
              <div className="text-xs text-white/40">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto scrollable">
        {loading ? (
          <div className="flex items-center justify-center h-24">
            <div className="w-5 h-5 border-2 rounded-full animate-spin"
              style={{ borderColor: 'rgba(0,212,255,0.2)', borderTopColor: '#00d4ff' }} />
          </div>
        ) : trades.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-white/30">
            <FileText size={24} className="mb-2 opacity-50" />
            <p className="text-sm">No trades yet</p>
            <p className="text-xs mt-1">Start the bot to begin paper trading</p>
          </div>
        ) : (
          <table className="w-full min-w-[600px]">
            <thead className="sticky top-0" style={{ background: 'rgba(8,8,16,0.9)' }}>
              <tr className="text-xs text-white/40 font-medium">
                {['Symbol', 'Side', 'Entry', 'Exit', 'PnL', 'Score', 'Date', ''].map(h => (
                  <th key={h} className="text-left py-2 px-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.map(trade => (
                <TradeRow key={trade.id} trade={trade} onClose={handleClose} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!compact && trades.length >= LIMIT && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 flex-shrink-0">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="text-xs text-white/40 hover:text-white disabled:opacity-30 transition-colors">
            ← Prev
          </button>
          <span className="text-xs text-white/40">Page {page + 1}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={trades.length < LIMIT}
            className="text-xs text-white/40 hover:text-white disabled:opacity-30 transition-colors">
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
