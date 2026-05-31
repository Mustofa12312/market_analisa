import React, { useState } from 'react'
import { Settings, Key, MessageSquare, Shield, RefreshCw, Check, X, Eye, EyeOff, AlertCircle } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

function Section({ title, icon: Icon, children }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
        <Icon size={15} style={{ color: '#00d4ff' }} />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [telegramToken, setTelegramToken] = useState('')
  const [telegramChatId, setTelegramChatId] = useState('')
  const [loading, setLoading] = useState({})
  const [newPassword, setNewPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')

  const setLoad = (key, val) => setLoading(l => ({ ...l, [key]: val }))

  const saveApiKey = async () => {
    if (!apiKey || !apiSecret) return toast.error('Enter both API key and secret')
    setLoad('apiKey', true)
    try {
      await api.post('/settings/api-key', { apiKey, apiSecret })
      toast.success('API key saved securely (encrypted)')
      setApiKey(''); setApiSecret('')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save API key')
    }
    setLoad('apiKey', false)
  }

  const saveTelegram = async () => {
    if (!telegramToken || !telegramChatId) return toast.error('Enter token and chat ID')
    setLoad('telegram', true)
    try {
      const res = await api.post('/settings/telegram', { botToken: telegramToken, chatId: telegramChatId })
      toast.success(`Telegram connected: @${res.data.botName}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to connect Telegram')
    }
    setLoad('telegram', false)
  }

  const changePassword = async () => {
    if (!currentPassword || !newPassword) return toast.error('Fill in both password fields')
    if (newPassword.length < 6) return toast.error('New password must be at least 6 characters')
    setLoad('password', true)
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword })
      toast.success('Password changed successfully')
      setCurrentPassword(''); setNewPassword('')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password')
    }
    setLoad('password', false)
  }

  const resetBalance = async () => {
    try {
      await api.post('/trades/balance/reset')
      toast.success('Paper balance reset to $10,000')
    } catch (err) {
      toast.error('Failed to reset balance')
    }
  }

  return (
    <div className="h-full overflow-auto scrollable p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="mb-2">
          <h2 className="text-lg font-bold text-white">Settings</h2>
          <p className="text-sm text-white/40 mt-1">Configure your trading bot, API keys, and notifications</p>
        </div>

        {/* Binance API Key */}
        <Section title="Binance API Key" icon={Key}>
          <div className="p-3 rounded-lg mb-4"
            style={{ background: 'rgba(255,214,10,0.05)', border: '1px solid rgba(255,214,10,0.15)' }}>
            <div className="flex gap-2">
              <AlertCircle size={14} style={{ color: '#ffd60a', flexShrink: 0, marginTop: 2 }} />
              <p className="text-xs" style={{ color: '#ffd60a' }}>
                API key disimpan terenkripsi di server. Untuk keamanan, gunakan API key dengan permission 
                <strong> hanya Enable Spot Trading</strong> — jangan aktifkan withdrawal.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50">API Key</label>
              <div className="relative">
                <input
                  id="input-api-key"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="Paste your Binance API Key"
                  className="input-field pr-10 font-mono text-xs"
                />
                <button type="button" onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50">API Secret</label>
              <div className="relative">
                <input
                  id="input-api-secret"
                  type={showSecret ? 'text' : 'password'}
                  value={apiSecret}
                  onChange={e => setApiSecret(e.target.value)}
                  placeholder="Paste your Binance API Secret"
                  className="input-field pr-10 font-mono text-xs"
                />
                <button type="button" onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showSecret ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            <button id="btn-save-api-key" onClick={saveApiKey} disabled={loading.apiKey}
              className="btn-primary flex items-center gap-2 disabled:opacity-50">
              {loading.apiKey ? <RefreshCw size={13} className="animate-spin" /> : <Key size={13} />}
              Save API Key (Encrypted)
            </button>
          </div>
        </Section>

        {/* Telegram */}
        <Section title="Telegram Notifications" icon={MessageSquare}>
          <p className="text-xs text-white/40 mb-4">
            Dapatkan notifikasi real-time via Telegram. Buat bot di @BotFather dan dapatkan Chat ID via @userinfobot.
          </p>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50">Bot Token</label>
              <input
                id="input-telegram-token"
                type="text"
                value={telegramToken}
                onChange={e => setTelegramToken(e.target.value)}
                placeholder="1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ"
                className="input-field font-mono text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50">Chat ID</label>
              <input
                id="input-telegram-chat"
                type="text"
                value={telegramChatId}
                onChange={e => setTelegramChatId(e.target.value)}
                placeholder="-1001234567890 or 123456789"
                className="input-field font-mono text-xs"
              />
            </div>
            <button id="btn-save-telegram" onClick={saveTelegram} disabled={loading.telegram}
              className="btn-primary flex items-center gap-2 disabled:opacity-50">
              {loading.telegram ? <RefreshCw size={13} className="animate-spin" /> : <MessageSquare size={13} />}
              Connect Telegram
            </button>
          </div>
        </Section>

        {/* Security */}
        <Section title="Security" icon={Shield}>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50">Current Password</label>
              <input
                id="input-current-password"
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className="input-field"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50">New Password</label>
              <input
                id="input-new-password"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New password (min 6 chars)"
                className="input-field"
              />
            </div>
            <button id="btn-change-password" onClick={changePassword} disabled={loading.password}
              className="btn-ghost flex items-center gap-2 disabled:opacity-50">
              {loading.password ? <RefreshCw size={13} className="animate-spin" /> : <Shield size={13} />}
              Change Password
            </button>
          </div>
        </Section>

        {/* Paper Trading */}
        <Section title="Paper Trading" icon={RefreshCw}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Reset Paper Balance</p>
              <p className="text-xs text-white/40 mt-0.5">Reset saldo demo ke $10,000 (trades history tetap ada)</p>
            </div>
            <button id="btn-reset-balance" onClick={resetBalance}
              className="btn-danger flex items-center gap-2 text-xs">
              <RefreshCw size={12} />
              Reset
            </button>
          </div>
        </Section>

        {/* About */}
        <div className="card p-4 text-center">
          <p className="text-sm font-semibold text-white mb-1">StrategiSpot v1.0.0</p>
          <p className="text-xs text-white/40">AI Trading Bot for Binance Spot</p>
          <p className="text-xs text-white/20 mt-2">Built with React + Node.js + SQLite</p>
        </div>
      </div>
    </div>
  )
}
