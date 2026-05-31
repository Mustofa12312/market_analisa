import React from 'react'
import StatsGrid from '../components/Dashboard/StatsGrid'
import CandlestickChart from '../components/Chart/CandlestickChart'
import CoinScanner from '../components/Scanner/CoinScanner'
import BotControlPanel from '../components/BotControl/BotControlPanel'
import TradeJournal from '../components/TradeJournal/TradeJournal'

export default function DashboardPage() {
  return (
    <div className="h-full flex flex-col gap-4 overflow-auto p-4 scrollable">
      {/* Stats + Prices */}
      <div className="flex-shrink-0">
        <StatsGrid />
      </div>

      {/* Main Content: Chart + Right Panel */}
      <div className="flex gap-4 min-h-0" style={{ height: '420px' }}>
        {/* Chart — takes 65% */}
        <div className="flex-1 min-w-0" style={{ flex: '0 0 65%' }}>
          <CandlestickChart />
        </div>

        {/* Right Panel: Scanner + Bot Control */}
        <div className="flex flex-col gap-4" style={{ flex: '0 0 35%', minWidth: 0 }}>
          {/* Bot Control - top */}
          <div style={{ flex: '0 0 auto' }}>
            <BotControlPanel />
          </div>
        </div>
      </div>

      {/* Bottom: Scanner + Trades */}
      <div className="flex gap-4 min-h-0" style={{ height: '340px' }}>
        <div style={{ flex: '0 0 40%', minWidth: 0 }}>
          <CoinScanner />
        </div>
        <div style={{ flex: '0 0 60%', minWidth: 0 }}>
          <TradeJournal compact={true} />
        </div>
      </div>
    </div>
  )
}
