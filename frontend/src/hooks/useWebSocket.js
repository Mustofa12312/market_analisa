import { useEffect, useRef, useCallback } from 'react'
import { useBotStore, useMarketStore, useTradeStore, useUIStore } from '../store'

const WS_URL = `ws://${window.location.host}/ws`

export function useWebSocket() {
  const ws = useRef(null)
  const reconnectTimer = useRef(null)
  const reconnectCount = useRef(0)

  const updateBotState = useBotStore(s => s.updateBotState)
  const updatePrice = useMarketStore(s => s.updatePrice)
  const updateSignals = useMarketStore(s => s.updateSignals)
  const setStats = useTradeStore(s => s.setStats)
  const addNotification = useUIStore(s => s.addNotification)

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return

    ws.current = new WebSocket(WS_URL)

    ws.current.onopen = () => {
      console.log('[WS] Connected')
      reconnectCount.current = 0
    }

    ws.current.onmessage = (evt) => {
      try {
        const { type, data } = JSON.parse(evt.data)

        switch (type) {
          case 'connected':
            updateBotState({
              status: data.botStatus,
              mode: data.mode,
              paperBalance: data.balance
            })
            break

          case 'price':
            updatePrice(data)
            break

          case 'signals':
            updateSignals(data)
            break

          case 'stats':
            setStats(data)
            break

          case 'bot_state':
            updateBotState({
              status: data.status,
              mode: data.mode,
              paperBalance: data.balance,
              dailyLoss: data.dailyLoss,
              dailyPnl: data.dailyPnl
            })
            break

          case 'trade_opened':
            addNotification({
              type: 'success',
              title: `BUY ${data.symbol}`,
              message: `Paper buy @ $${data.entryPrice?.toFixed(2)}`
            })
            break

          case 'trade_closed':
            const isProfit = data.pnl >= 0
            addNotification({
              type: isProfit ? 'success' : 'error',
              title: `SELL ${data.symbol}`,
              message: `PnL: $${data.pnl?.toFixed(2)} (${data.pnlPercent?.toFixed(2)}%)`
            })
            break

          default:
            break
        }
      } catch (e) {}
    }

    ws.current.onclose = () => {
      console.log('[WS] Disconnected')
      const delay = Math.min(1000 * Math.pow(2, reconnectCount.current), 30000)
      reconnectCount.current++
      reconnectTimer.current = setTimeout(connect, delay)
    }

    ws.current.onerror = () => {
      ws.current?.close()
    }
  }, [updateBotState, updatePrice, updateSignals, setStats, addNotification])

  useEffect(() => {
    connect()

    // Ping every 30s to keep alive
    const pingInterval = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'ping' }))
      }
    }, 30000)

    return () => {
      clearInterval(pingInterval)
      clearTimeout(reconnectTimer.current)
      ws.current?.close()
    }
  }, [connect])

  return {
    connected: ws.current?.readyState === WebSocket.OPEN
  }
}
