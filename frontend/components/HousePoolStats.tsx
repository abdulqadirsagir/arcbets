'use client'

import { useReadContract } from 'wagmi'
import { CONTRACTS, BINARY_OPTIONS_ABI } from '@/lib/contracts'
import { formatUSDC } from '@/lib/utils'

export default function HousePoolStats() {
  const { data: housePool } = useReadContract({
    address: CONTRACTS.BINARY_OPTIONS as `0x${string}`,
    abi: BINARY_OPTIONS_ABI,
    functionName: 'housePool',
  })

  const { data: totalActiveBets } = useReadContract({
    address: CONTRACTS.BINARY_OPTIONS as `0x${string}`,
    abi: BINARY_OPTIONS_ABI,
    functionName: 'totalActiveBets',
  })

  const { data: availablePool } = useReadContract({
    address: CONTRACTS.BINARY_OPTIONS as `0x${string}`,
    abi: BINARY_OPTIONS_ABI,
    functionName: 'getAvailableHousePool',
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
        <div className="text-sm text-gray-400 mb-2">Total House Pool</div>
        <div className="text-2xl font-bold text-arc-primary">
          {housePool ? formatUSDC(housePool) : '---'} USDC
        </div>
      </div>
      
      <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
        <div className="text-sm text-gray-400 mb-2">Active Bets</div>
        <div className="text-2xl font-bold text-yellow-400">
          {totalActiveBets ? formatUSDC(totalActiveBets) : '---'} USDC
        </div>
      </div>
      
      <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
        <div className="text-sm text-gray-400 mb-2">Available Liquidity</div>
        <div className="text-2xl font-bold text-green-400">
          {availablePool ? formatUSDC(availablePool) : '---'} USDC
        </div>
      </div>
    </div>
  )
}
