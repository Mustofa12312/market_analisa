import { create } from 'zustand'

// ---- Auth Store ----
export const useAuthStore = create((set) => ({
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),

  login: (token, user) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ token, user })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ token: null, user: null })
  }
}))

// ---- Bot Store ----
export const useBotStore = create((set) => ({
  status: 'stopped',
  mode: 'paper',
  activePairs: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
  dailyLoss: 0,
  dailyPnl: 0,
  paperBalance: 10000,
  riskConfig: {
    maxRiskPerTrade: 2,
    maxDailyLoss: 6,
    takeProfit: 3,
    stopLoss: 1.5,
    minAIScore: 60,
    maxOpenPositions: 3
  },

  setStatus: (status) => set({ status }),
  setMode: (mode) => set({ mode }),
  setActivePairs: (activePairs) => set({ activePairs }),
  setBalance: (paperBalance) => set({ paperBalance }),
  setRiskConfig: (riskConfig) => set({ riskConfig }),
  updateBotState: (state) => set((prev) => ({ ...prev, ...state }))
}))

// ---- Market Store ----
export const useMarketStore = create((set) => ({
  prices: {},
  signals: [],
  candles: {},
  lastUpdated: null,

  updatePrice: (priceData) => set((state) => ({
    prices: { ...state.prices, [priceData.symbol]: priceData },
    lastUpdated: Date.now()
  })),

  updateSignals: (signals) => set({ signals }),
  updateCandles: (symbol, candles) => set((state) => ({
    candles: { ...state.candles, [symbol]: candles }
  }))
}))

// ---- Trade Store ----
export const useTradeStore = create((set) => ({
  trades: [],
  openTrades: [],
  stats: null,
  loading: false,

  setTrades: (trades) => set({ trades }),
  setOpenTrades: (openTrades) => set({ openTrades }),
  setStats: (stats) => set({ stats }),
  setLoading: (loading) => set({ loading }),
  addTrade: (trade) => set((state) => ({ trades: [trade, ...state.trades] })),
  removeTrade: (id) => set((state) => ({
    openTrades: state.openTrades.filter(t => t.id !== id)
  }))
}))

// ---- UI Store ----
export const useUIStore = create((set) => ({
  activePage: 'dashboard',
  sidebarOpen: true,
  activeSymbol: 'BTCUSDT',
  activeInterval: '15m',
  notifications: [],

  setActivePage: (activePage) => set({ activePage }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setActiveSymbol: (activeSymbol) => set({ activeSymbol }),
  setActiveInterval: (activeInterval) => set({ activeInterval }),
  addNotification: (notification) => set((state) => ({
    notifications: [
      { id: Date.now(), ...notification },
      ...state.notifications.slice(0, 49)
    ]
  })),
  clearNotifications: () => set({ notifications: [] })
}))
