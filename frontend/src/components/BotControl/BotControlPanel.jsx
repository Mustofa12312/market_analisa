import React, { useEffect, useState } from 'react'
import { Play, Pause, Square, RefreshCw, Settings, ToggleLeft, ToggleRight, ShieldAlert } from 'lucide-react'
import api from '../../lib/api'
import { useBotStore } from '../../store'
import toast from 'react-hot-toast'

export default function BotControlPanel() {
  const { status, mode, activePairs, riskConfig, setRiskConfig, updateBotState } = useBotStore()
  const [loading, setLoading] = useState(false)
  const [showRisk, setShowRisk] = useState(false)
  const [localRisk, setLocalRisk] = useState(riskConfig)

  useEffect(() => {
    // Fetch current bot status
    api.get('/bot/status').then(res => {
      updateBotState({
        status: res.data.status,
        mode: res.data.mode,
        activePairs: res.data.activePairs,
        paperBalance: res.data.paperBalance,
        riskConfig: res.data.riskConfig,
        dailyLoss: res.data.dailyLoss,
        dailyPnl: res.data.dailyPnl,
      })
      setLocalRisk(res.data.riskConfig)
    }).catch(() => {})
  }, [])

  const handleBotAction = async (action) => {
    setLoading(true)
    try {
      await api.post(`/bot/${action}`)
      const res = await api.get('/bot/status')
      updateBotState({ status: res.data.status })
      toast.success(`Bot ${action}ed successfully`)
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to ${action} bot`)
    }
    setLoading(false)
  }

  const handleModeToggle = async () => {
    const newMode = mode === 'paper' ? 'live' : 'paper'
    try {
      await api.post('/bot/mode', { mode: newMode })
      updateBotState({ mode: newMode })
      toast.success(`Switched to ${newMode} mode`)
    } catch (err) {
      toast.error('Failed to switch mode')
    }
  }

  const saveRiskConfig = async () => {
    try {
      await api.post('/bot/risk', localRisk)
      setRiskConfig(localRisk)
      toast.success('Risk config saved')
      setShowRisk(false)
    } catch (err) {
      toast.error('Failed to save risk config')
    }
  }

  const handleManualBuy = async (symbol) => {
    try {
      const res = await api.post('/bot/manual-trade', { symbol, action: 'BUY' })
      if (res.data.success) {
        toast.success(`Paper BUY ${symbol} @ $${res.data.entryPrice}`)
      } else {
        toast.error(res.data.reason)
      }
    } catch (err) {
      toast.error('Manual trade failed')
    }
  }

  const statusConfig = {
    running: { color: '#00ff88', label: 'Running' },
    paused: { color: '#ffd60a', label: 'Paused' },
    stopped: { color: '#ff3366', label: 'Stopped' }
  }
  const sc = statusConfig[status] || statusConfig.stopped

  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: sc.color }} />
          <h3 className="text-sm font-semibold text-white">Bot Control</h3>
        </div>
        <span className="text-xs font-semibold px-2 py-1 rounded-full"
          style={{ background: `${sc.color}15`, color: sc.color, border: `1px solid ${sc.color}30` }}>
          {sc.label}
        </span>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-auto scrollable">
        {/* Main Controls */}
        <div className="grid grid-cols-3 gap-2">
          <button id="btn-bot-start" onClick={() => handleBotAction('start')}
            disabled={loading || status === 'running'}
            className="btn-success flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
            <Play size={14} />
            Start
          </button>
          <button id="btn-bot-pause" onClick={() => handleBotAction('pause')}
            disabled={loading || status !== 'running'}
            className="btn-ghost flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ borderColor: 'rgba(255,214,10,0.3)', color: '#ffd60a' }}>
            <Pause size={14} />
            Pause
          </button>
          <button id="btn-bot-stop" onClick={() => handleBotAction('stop')}
            disabled={loading || status === 'stopped'}
            className="btn-danger flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
            <Square size={14} />
            Stop
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <p className="text-sm font-medium text-white">Trading Mode</p>
            <p className="text-xs text-white/40 mt-0.5">
              {mode === 'paper' ? '📄 Demo dengan harga nyata' : '⚡ Real money trading'}
            </p>
          </div>
          <button id="btn-mode-toggle" onClick={handleModeToggle}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-xs font-semibold"
            style={{
              background: mode === 'live' ? 'rgba(0,255,136,0.1)' : 'rgba(255,214,10,0.1)',
              color: mode === 'live' ? '#00ff88' : '#ffd60a',
              border: `1px solid ${mode === 'live' ? 'rgba(0,255,136,0.2)' : 'rgba(255,214,10,0.2)'}`
            }}>
            {mode === 'live' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            {mode === 'paper' ? 'Paper' : 'Live'}
          </button>
        </div>

        {/* Active Pairs */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Active Pairs</p>
          <div className="flex flex-wrap gap-2">
            {(activePairs || ['BTCUSDT', 'ETHUSDT', 'SOLUSDT']).map(pair => (
              <span key={pair} className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                style={{
                  background: 'rgba(0,212,255,0.1)',
                  color: '#00d4ff',
                  border: '1px solid rgba(0,212,255,0.2)'
                }}>
                {pair.replace('USDT', '/USDT')}
              </span>
            ))}
          </div>
        </div>

        {/* Manual Trade */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Manual Paper Buy</p>
          <div className="grid grid-cols-3 gap-2">
            {['BTCUSDT', 'ETHUSDT', 'SOLUSDT'].map(sym => (
              <button key={sym} id={`btn-manual-buy-${sym}`}
                onClick={() => handleManualBuy(sym)}
                disabled={status !== 'running'}
                className="px-2 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: 'rgba(0,255,136,0.08)',
                  color: '#00ff88',
                  border: '1px solid rgba(0,255,136,0.15)'
                }}>
                BUY {sym.replace('USDT', '')}
              </button>
            ))}
          </div>
          {status !== 'running' && (
            <p className="text-xs text-white/30">Start bot to enable manual trades</p>
          )}
        </div>

        {/* Risk Settings Toggle */}
        <div>
          <button id="btn-toggle-risk" onClick={() => setShowRisk(!showRisk)}
            className="flex items-center gap-2 text-xs font-semibold text-white/60 hover:text-white transition-colors">
            <ShieldAlert size={13} />
            Risk Settings
            <span className="ml-1">{showRisk ? '▲' : '▼'}</span>
          </button>

          {showRisk && (
            <div className="mt-3 space-y-3 animate-slide-up">
              {[
                { key: 'maxRiskPerTrade', label: 'Max Risk/Trade (%)', min: 0.5, max: 10, step: 0.5 },
                { key: 'maxDailyLoss', label: 'Max Daily Loss (%)', min: 1, max: 20, step: 1 },
                { key: 'takeProfit', label: 'Take Profit (%)', min: 0.5, max: 20, step: 0.5 },
                { key: 'stopLoss', label: 'Stop Loss (%)', min: 0.5, max: 10, step: 0.5 },
                { key: 'minAIScore', label: 'Min AI Score', min: 50, max: 90, step: 5 },
                { key: 'maxOpenPositions', label: 'Max Positions', min: 1, max: 10, step: 1 },
              ].map(({ key, label, min, max, step }) => (
                <div key={key}>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs text-white/50">{label}</label>
                    <span className="text-xs font-mono" style={{ color: '#00d4ff' }}>
                      {localRisk[key]}
                    </span>
                  </div>
                  <input
                    type="range" min={min} max={max} step={step}
                    value={localRisk[key]}
                    onChange={e => setLocalRisk({ ...localRisk, [key]: parseFloat(e.target.value) })}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: '#00d4ff', background: 'rgba(255,255,255,0.1)' }}
                    id={`risk-${key}`}
                  />
                </div>
              ))}

              <button onClick={saveRiskConfig} className="btn-primary w-full text-center text-sm">
                Save Risk Config
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
