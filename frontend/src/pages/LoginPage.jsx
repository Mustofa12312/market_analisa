import React, { useState } from 'react'
import { Activity, Eye, EyeOff, Lock, AlertCircle } from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../store'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const login = useAuthStore(s => s.login)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await api.post('/auth/login', { username, password })
      login(res.data.token, res.data.user)
      toast.success(`Welcome, ${res.data.user.username}!`)
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Try admin / admin123')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: '#080810' }}>
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid opacity-50" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-10"
        style={{ background: 'radial-gradient(circle, #00d4ff, transparent)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-10"
        style={{ background: 'radial-gradient(circle, #00ff88, transparent)' }} />

      {/* Animated particles */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="absolute w-1 h-1 rounded-full opacity-40 animate-float"
          style={{
            background: '#00d4ff',
            left: `${10 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
            animationDelay: `${i * 0.5}s`,
            boxShadow: '0 0 6px #00d4ff'
          }} />
      ))}

      {/* Login Card */}
      <div className="relative w-full max-w-sm mx-4 animate-fade-in">
        <div className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(22,33,62,0.95) 0%, rgba(15,52,96,0.5) 100%)',
            border: '1px solid rgba(0,212,255,0.2)',
            boxShadow: '0 0 60px rgba(0,212,255,0.1), 0 20px 60px rgba(0,0,0,0.5)'
          }}>
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-white/5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{
                background: 'linear-gradient(135deg, #00d4ff, #0066ff)',
                boxShadow: '0 0 30px rgba(0,212,255,0.4)'
              }}>
              <Activity size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">StrategiSpot</h1>
            <p className="text-sm mt-1" style={{ color: '#00d4ff' }}>AI Trading Bot Dashboard</p>
            <p className="text-xs text-white/40 mt-1">Binance Spot Trading Platform</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="px-8 py-6 space-y-4">
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg text-xs animate-slide-up"
                style={{ background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.2)', color: '#ff3366' }}>
                <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Username</label>
              <input
                id="input-username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="input-field"
                placeholder="admin"
                autoComplete="username"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  id="input-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              id="btn-login"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #00d4ff, #0066ff)',
                color: 'white',
                boxShadow: '0 0 20px rgba(0,212,255,0.3)'
              }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Logging in...
                </span>
              ) : 'Login to Dashboard'}
            </button>

            <div className="text-center p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs text-white/40">Default credentials:</p>
              <p className="text-xs font-mono mt-1" style={{ color: '#00d4ff' }}>admin / admin123</p>
            </div>
          </form>

          {/* Footer */}
          <div className="px-8 pb-6 text-center">
            <div className="flex items-center justify-center gap-4 text-xs text-white/30">
              <div className="flex items-center gap-1">
                <Lock size={10} />
                Encrypted
              </div>
              <div className="w-px h-3 bg-white/10" />
              <span>Paper Trading Mode</span>
              <div className="w-px h-3 bg-white/10" />
              <span>v1.0.0</span>
            </div>
          </div>
        </div>

        {/* Features below card */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { icon: '📊', text: 'RSI · MACD · BB' },
            { icon: '🤖', text: 'AI Scoring' },
            { icon: '🛡️', text: 'Risk Engine' },
          ].map(f => (
            <div key={f.text} className="text-center py-2 px-3 rounded-lg text-xs text-white/40"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-base mb-0.5">{f.icon}</div>
              {f.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
