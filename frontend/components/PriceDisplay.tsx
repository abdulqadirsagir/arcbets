'use client'

import { useEffect, useState } from 'react'
import { createPublicClient, http } from 'viem'
import { CONTRACTS, ORACLE_ABI, ASSETS } from '@/lib/contracts'
import { arcTestnet } from '@/lib/web3Config'

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
      } catch (error) {
        console.error(`Error fetching ${asset.symbol} price:`, error)
      }
    }

    fetchPrice()
    const interval = setInterval(fetchPrice, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
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

  return (
    <div className="gradient-border rounded-xl p-5 hover:scale-105 transition-transform">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-3xl">{asset.icon}</span>
          <div>
            <div className="font-bold text-lg">{asset.symbol}</div>
            <div className="text-xs text-gray-400">{asset.name}</div>
          </div>
        </div>
        {priceChange !== null && (
          <div className={`px-2 py-1 rounded text-sm font-semibold ${isPositive ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
            }`}>
            {isPositive ? '↗' : '↘'} {Math.abs(priceChange).toFixed(2)}%
          </div>
        )}
      </div>

      <div className="text-2xl font-bold mb-1">{formattedPrice}</div>

      {lastUpdated && (
        <div className="text-xs text-gray-500">
          Updated {new Date(Number(lastUpdated) * 1000).toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}
