'use client'

import { useEffect, useState } from 'react'
import { createPublicClient, http } from 'viem'
import { CONTRACTS, ORACLE_ABI, ASSETS } from '@/lib/contracts'
import { arcTestnet } from '@/lib/web3Config'
import { supabase } from '@/lib/supabase'

export default function PriceDisplay() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {ASSETS.map((asset) => (
        <PriceCard key={asset.symbol} asset={asset} />
      ))}
    </div>
  )
}

function PriceCard({ asset }: { asset: typeof ASSETS[0] }) {
  const [priceChange, setPriceChange] = useState<number | null>(null)
  const [prevPrice, setPrevPrice] = useState<bigint | null>(null)
  const [price, setPrice] = useState<bigint | null>(null)
  const [lastUpdated, setLastUpdated] = useState<bigint | null>(null)
  const [isStale, setIsStale] = useState(false)
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const publicClient = createPublicClient({
          chain: arcTestnet,
          transport: http('https://rpc.testnet.arc.network'),
        })

        // Call getPrice which returns [price, lastUpdated]
        const result = await publicClient.readContract({
          address: CONTRACTS.ORACLE as `0x${string}`,
          abi: ORACLE_ABI,
          functionName: 'getPrice',
          args: [asset.symbol],
        }) as [bigint, bigint]

        const [priceValue, timestampValue] = result

        console.log(`${asset.symbol} - Price: ${priceValue.toString()}, Updated: ${timestampValue.toString()}`)
        setPrice(priceValue)
        setLastUpdated(timestampValue)
        
        // Check if price is stale (older than 10 minutes)
        const now = Math.floor(Date.now() / 1000)
        const age = now - Number(timestampValue)
        setIsStale(age > 600) // 10 minutes
      } catch (error) {
        console.error(`Error fetching ${asset.symbol} price:`, error)
      }
    }

    // Initial fetch
    fetchPrice()
    
    // Poll every 10 seconds for on-chain updates
    const interval = setInterval(fetchPrice, 10000)

    // Subscribe to real-time Supabase updates for instant UI updates
    const channel = supabase
      .channel(`price_${asset.symbol}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'price_history',
          filter: `asset=eq.${asset.symbol}`,
        },
        (payload) => {
          console.log(`Real-time price update for ${asset.symbol}:`, payload.new)
          const newPrice = BigInt(payload.new.price)
          setPrice(newPrice)
          setLastUpdated(BigInt(Math.floor(new Date(payload.new.timestamp).getTime() / 1000)))
          setIsStale(false)
          
          // Show "LIVE" indicator briefly
          setIsLive(true)
          setTimeout(() => setIsLive(false), 2000)
        }
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [asset.symbol])

  useEffect(() => {
    if (price && prevPrice && prevPrice !== 0n) {
      const change = ((Number(price) - Number(prevPrice)) / Number(prevPrice)) * 100
      setPriceChange(change)
    }
    if (price && price !== prevPrice) {
      setPrevPrice(price)
    }
  }, [price, prevPrice])

  const formattedPrice = price ? `$${(Number(price) / 1e8).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '---'
  const isPositive = priceChange !== null && priceChange >= 0

  // Calculate time since last update
  const getTimeSinceUpdate = () => {
    if (!lastUpdated) return ''
    const now = Math.floor(Date.now() / 1000)
    const seconds = now - Number(lastUpdated)
    
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return `${Math.floor(seconds / 3600)}h ago`
  }

  return (
    <div className={`gradient-border rounded-xl p-5 hover:scale-105 transition-all ${isLive ? 'ring-2 ring-green-500 animate-pulse' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-3xl">{asset.icon}</span>
          <div>
            <div className="font-bold text-lg">{asset.symbol}</div>
            <div className="text-xs text-gray-400">{asset.name}</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {priceChange !== null && (
            <div className={`px-2 py-1 rounded text-sm font-semibold ${isPositive ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
              {isPositive ? '↗' : '↘'} {Math.abs(priceChange).toFixed(2)}%
            </div>
          )}
          {isLive && (
            <div className="px-2 py-0.5 rounded text-xs font-bold bg-green-500 text-white animate-pulse">
              LIVE
            </div>
          )}
        </div>
      </div>

      <div className="text-2xl font-bold mb-1">{formattedPrice}</div>

      <div className="flex items-center justify-between">
        {lastUpdated && (
          <div className={`text-xs ${isStale ? 'text-red-400' : 'text-gray-500'}`}>
            Updated {getTimeSinceUpdate()}
            {isStale && ' ⚠️'}
          </div>
        )}
        <div className={`w-2 h-2 rounded-full ${isStale ? 'bg-red-500' : 'bg-green-500'} ${!isStale && 'animate-pulse'}`} />
      </div>
    </div>
  )
}
