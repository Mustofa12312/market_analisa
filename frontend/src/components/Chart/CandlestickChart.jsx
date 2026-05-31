import React, { useEffect, useRef, useState } from 'react'
import { createChart } from 'lightweight-charts'
import api from '../../lib/api'
import { useUIStore, useMarketStore } from '../../store'
import { TrendingUp, BarChart2 } from 'lucide-react'

const INTERVALS = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '1d', value: '1d' },
]

const PAIRS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT']

export default function CandlestickChart() {
  const chartContainer = useRef(null)
  const chart = useRef(null)
  const candleSeries = useRef(null)
  const volumeSeries = useRef(null)
  const emaFastSeries = useRef(null)
  const emaSlowSeries = useRef(null)
  const bbUpperSeries = useRef(null)
  const bbLowerSeries = useRef(null)

  const { activeSymbol, setActiveSymbol, activeInterval, setActiveInterval } = useUIStore()
  const { prices, signals } = useMarketStore()
  const [loading, setLoading] = useState(true)
  const [showIndicators, setShowIndicators] = useState(true)

  // Active signal for current symbol
  const activeSignal = signals.find(s => s.symbol === activeSymbol)

  const loadCandles = async (symbol, interval) => {
    setLoading(true)
    try {
      const res = await api.get(`/market/candles/${symbol}?interval=${interval}&limit=200`)
      const candles = res.data

      if (candleSeries.current && candles.length > 0) {
        const sortedCandles = [...candles].sort((a, b) => a.time - b.time)

        candleSeries.current.setData(sortedCandles.map(c => ({
          time: c.time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close
        })))

        volumeSeries.current?.setData(sortedCandles.map(c => ({
          time: c.time,
          value: c.volume,
          color: c.close >= c.open ? 'rgba(0,255,136,0.3)' : 'rgba(255,51,102,0.3)'
        })))

        // Calculate and overlay EMA + BB
        if (showIndicators && sortedCandles.length >= 21) {
          const closes = sortedCandles.map(c => c.close)
          const times = sortedCandles.map(c => c.time)

          // EMA 9
          const ema9Data = calcEMAData(closes, times, 9)
          emaFastSeries.current?.setData(ema9Data)

          // EMA 21
          const ema21Data = calcEMAData(closes, times, 21)
          emaSlowSeries.current?.setData(ema21Data)

          // BB
          const bbData = calcBBData(closes, times, 20)
          bbUpperSeries.current?.setData(bbData.upper)
          bbLowerSeries.current?.setData(bbData.lower)
        }

        chart.current?.timeScale().fitContent()
      }
    } catch (err) {
      console.error('Failed to load candles:', err)
    }
    setLoading(false)
  }

  function calcEMAData(closes, times, period) {
    const result = []
    const k = 2 / (period + 1)
    let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period
    result.push({ time: times[period - 1], value: parseFloat(ema.toFixed(2)) })
    for (let i = period; i < closes.length; i++) {
      ema = closes[i] * k + ema * (1 - k)
      result.push({ time: times[i], value: parseFloat(ema.toFixed(2)) })
    }
    return result
  }

  function calcBBData(closes, times, period = 20) {
    const upper = [], lower = []
    for (let i = period - 1; i < closes.length; i++) {
      const slice = closes.slice(i - period + 1, i + 1)
      const mean = slice.reduce((a, b) => a + b, 0) / period
      const std = Math.sqrt(slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period)
      upper.push({ time: times[i], value: parseFloat((mean + std * 2).toFixed(2)) })
      lower.push({ time: times[i], value: parseFloat((mean - std * 2).toFixed(2)) })
    }
    return { upper, lower }
  }

  useEffect(() => {
    if (!chartContainer.current) return

    chart.current = createChart(chartContainer.current, {
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: 'rgba(255,255,255,0.5)',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.03)' },
        horzLines: { color: 'rgba(255,255,255,0.03)' },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: 'rgba(0,212,255,0.3)', width: 1, style: 2 },
        horzLine: { color: 'rgba(0,212,255,0.3)', width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        textColor: 'rgba(255,255,255,0.4)',
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        textColor: 'rgba(255,255,255,0.4)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { mouseWheel: true, pinch: true },
    })

    candleSeries.current = chart.current.addCandlestickSeries({
      upColor: '#00ff88',
      downColor: '#ff3366',
      borderUpColor: '#00ff88',
      borderDownColor: '#ff3366',
      wickUpColor: '#00ff88',
      wickDownColor: '#ff3366',
    })

    volumeSeries.current = chart.current.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    })
    chart.current.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    })

    emaFastSeries.current = chart.current.addLineSeries({
      color: '#00d4ff',
      lineWidth: 1,
      title: 'EMA9'
    })

    emaSlowSeries.current = chart.current.addLineSeries({
      color: '#ffd60a',
      lineWidth: 1,
      title: 'EMA21'
    })

    bbUpperSeries.current = chart.current.addLineSeries({
      color: 'rgba(168,85,247,0.4)',
      lineWidth: 1,
      lineStyle: 2,
      title: 'BB+'
    })

    bbLowerSeries.current = chart.current.addLineSeries({
      color: 'rgba(168,85,247,0.4)',
      lineWidth: 1,
      lineStyle: 2,
      title: 'BB-'
    })

    const resizeObserver = new ResizeObserver(() => {
      if (chartContainer.current && chart.current) {
        chart.current.applyOptions({
          width: chartContainer.current.clientWidth,
          height: chartContainer.current.clientHeight
        })
      }
    })
    resizeObserver.observe(chartContainer.current)

    loadCandles(activeSymbol, activeInterval)

    return () => {
      resizeObserver.disconnect()
      chart.current?.remove()
    }
  }, [])

  useEffect(() => {
    loadCandles(activeSymbol, activeInterval)
  }, [activeSymbol, activeInterval])

  // Update last candle with live price
  useEffect(() => {
    const priceData = prices[activeSymbol]
    if (priceData && candleSeries.current) {
      const now = Math.floor(Date.now() / 1000)
      try {
        candleSeries.current.update({
          time: now,
          open: priceData.price,
          high: priceData.high || priceData.price,
          low: priceData.low || priceData.price,
          close: priceData.price
        })
      } catch(e) {}
    }
  }, [prices, activeSymbol])

  const priceData = prices[activeSymbol]
  const change = priceData?.change || 0

  return (
    <div className="card flex flex-col h-full">
      {/* Chart Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-4">
          {/* Symbol Selector */}
          <div className="flex gap-1">
            {PAIRS.map(pair => (
              <button key={pair} id={`btn-symbol-${pair}`}
                onClick={() => setActiveSymbol(pair)}
                className="px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-200"
                style={activeSymbol === pair ? {
                  background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,102,255,0.15))',
                  color: '#00d4ff',
                  border: '1px solid rgba(0,212,255,0.3)'
                } : {
                  background: 'rgba(255,255,255,0.04)',
                  color: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}>
                {pair.replace('USDT', '/USDT')}
              </button>
            ))}
          </div>

          {/* Price */}
          {priceData && (
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold font-mono" style={{ color: '#00d4ff' }}>
                ${priceData.price?.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-semibold" style={{ color: change >= 0 ? '#00ff88' : '#ff3366' }}>
                {change >= 0 ? '+' : ''}{change?.toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Signal Badge */}
          {activeSignal && (
            <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              activeSignal.signal === 'BUY' ? 'badge-buy' :
              activeSignal.signal === 'SELL' ? 'badge-sell' : 'badge-hold'
            }`}>
              {activeSignal.signal} · {activeSignal.aiScore}
            </div>
          )}

          {/* Interval Selector */}
          <div className="flex gap-0.5">
            {INTERVALS.map(iv => (
              <button key={iv.value} id={`btn-interval-${iv.value}`}
                onClick={() => setActiveInterval(iv.value)}
                className="px-2 py-1 rounded text-xs transition-all duration-200"
                style={activeInterval === iv.value ? {
                  background: 'rgba(0,212,255,0.15)',
                  color: '#00d4ff'
                } : {
                  color: 'rgba(255,255,255,0.4)'
                }}>
                {iv.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="relative flex-1 min-h-0">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10"
            style={{ background: 'rgba(8,8,16,0.7)' }}>
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 rounded-full animate-spin"
                style={{ borderColor: 'rgba(0,212,255,0.3)', borderTopColor: '#00d4ff' }} />
              <span className="text-xs text-white/40">Loading chart...</span>
            </div>
          </div>
        )}
        <div ref={chartContainer} className="w-full h-full" />
      </div>

      {/* Indicator row */}
      {activeSignal?.indicators && (
        <div className="flex items-center gap-4 px-4 py-2 border-t border-white/5 flex-shrink-0 flex-wrap">
          {activeSignal.indicators.rsi != null && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-white/40">RSI</span>
              <span style={{
                color: activeSignal.indicators.rsi < 30 ? '#00ff88' :
                  activeSignal.indicators.rsi > 70 ? '#ff3366' : '#ffd60a',
                fontFamily: 'monospace'
              }}>{activeSignal.indicators.rsi?.toFixed(1)}</span>
            </div>
          )}
          {activeSignal.indicators.macd && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-white/40">MACD</span>
              <span style={{
                color: activeSignal.indicators.macd.histogram > 0 ? '#00ff88' : '#ff3366',
                fontFamily: 'monospace'
              }}>{activeSignal.indicators.macd.histogram?.toFixed(4)}</span>
            </div>
          )}
          {activeSignal.indicators.ema && (
            <>
              <div className="flex items-center gap-1.5 text-xs">
                <span style={{ color: '#00d4ff' }}>EMA9</span>
                <span className="font-mono text-white/70">${activeSignal.indicators.ema.fast?.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span style={{ color: '#ffd60a' }}>EMA21</span>
                <span className="font-mono text-white/70">${activeSignal.indicators.ema.slow?.toFixed(2)}</span>
              </div>
            </>
          )}
          {activeSignal.indicators.bb && (
            <div className="flex items-center gap-1.5 text-xs">
              <span style={{ color: 'rgba(168,85,247,0.8)' }}>BB</span>
              <span className="font-mono text-white/50">
                {activeSignal.indicators.bb.lower?.toFixed(0)}–{activeSignal.indicators.bb.upper?.toFixed(0)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
