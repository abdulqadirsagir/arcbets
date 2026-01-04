'use client'

import { useEffect, useRef, memo } from 'react'

interface TradingViewChartProps {
  symbol: string // ETH, BTC, or SOL
}

function TradingViewChart({ symbol }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Map our symbols to TradingView symbols
  const getTradingViewSymbol = (asset: string) => {
    switch (asset.toUpperCase()) {
      case 'ETH':
        return 'BINANCE:ETHUSDT'
      case 'BTC':
        return 'BINANCE:BTCUSDT'
      case 'SOL':
        return 'BINANCE:SOLUSDT'
      default:
        return 'BINANCE:ETHUSDT'
    }
  }

  useEffect(() => {
    if (!containerRef.current) return

    // Clear previous widget
    containerRef.current.innerHTML = ''

    // Create TradingView widget
    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/tv.js'
    script.async = true
    script.onload = () => {
      if (typeof window !== 'undefined' && (window as any).TradingView) {
        new (window as any).TradingView.widget({
          autosize: true,
          symbol: getTradingViewSymbol(symbol),
          interval: '5',
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#0a0e27',
          enable_publishing: false,
          hide_side_toolbar: true,
          allow_symbol_change: false,
          container_id: containerRef.current?.id || 'tradingview_chart',
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          backgroundColor: '#0a0e27',
          gridColor: '#1a1f3a',
          studies: [],
          disabled_features: [
            'use_localstorage_for_settings',
            'header_symbol_search',
            'header_compare',
            'header_undo_redo',
            'header_screenshot',
            'header_chart_type',
          ],
          enabled_features: [],
          overrides: {
            'paneProperties.background': '#0a0e27',
            'paneProperties.backgroundType': 'solid',
          },
        })
      }
    }

    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [symbol])

  return (
    <div className="h-full w-full bg-arc-card rounded-lg overflow-hidden border border-arc-primary/20">
      <div
        id="tradingview_chart"
        ref={containerRef}
        className="w-full h-full"
      />
    </div>
  )
}

export default memo(TradingViewChart)
