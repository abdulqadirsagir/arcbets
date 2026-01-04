'use client'

import { useReadContract } from 'wagmi'
import { CONTRACTS, BETTING_ENGINE_ABI, DEPOSIT_VAULT_ABI, ARCS_TOKEN_ABI } from '@/lib/contracts'
import { formatEther } from 'viem'

export default function HousePoolStatsARCS() {
  // Get vault stats (V2)
  const { data: vaultStats } = useReadContract({
    address: CONTRACTS.DEPOSIT_VAULT as `0x${string}`,
    abi: DEPOSIT_VAULT_ABI,
    functionName: 'getVaultStats',
    query: { refetchInterval: 10000 }
  })

  // Get active bets in ARCS
  const { data: activeBetsARCS } = useReadContract({
    address: CONTRACTS.BETTING_ENGINE as `0x${string}`,
    abi: BETTING_ENGINE_ABI,
    functionName: 'totalActiveBetsARCS',
    query: { refetchInterval: 10000 }
  })

  // Get ARCS total supply
  const { data: totalSupply } = useReadContract({
    address: CONTRACTS.ARCS_TOKEN as `0x${string}`,
    abi: ARCS_TOKEN_ABI,
    functionName: 'totalSupply',
    query: { refetchInterval: 10000 }
  })

  // Parse vault stats: [deposits, payouts, profit, contractUSDC, treasuryARCS]
  const userReserve = vaultStats ? parseFloat(formatEther((vaultStats as any)[0])) : 0
  const totalPayouts = vaultStats ? parseFloat(formatEther((vaultStats as any)[1])) : 0
  const profit = vaultStats ? parseFloat(formatEther((vaultStats as any)[2])) : 0
  const houseCapital = vaultStats ? parseFloat(formatEther((vaultStats as any)[3])) : 0
  const treasuryARCS = vaultStats ? parseFloat(formatEther((vaultStats as any)[4])) : 0

  const totalARCS = totalSupply ? parseFloat(formatEther(totalSupply as bigint)) : 0
  const activeBets = activeBetsARCS ? parseFloat(formatEther(activeBetsARCS as bigint)) : 0

  return (
    <div className="mb-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Treasury ARCS */}
        <div className="bg-arc-card rounded-lg p-4 border border-arc-primary/20">
          <div className="text-xs text-gray-400 mb-1">Treasury ARCS</div>
          <div className="text-lg font-bold text-arc-primary">
            {treasuryARCS.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Total: {totalARCS.toFixed(2)} ARCS
          </div>
        </div>

        <div className="bg-arc-card rounded-lg p-4 border border-arc-primary/20">
          <div className="text-xs text-gray-400 mb-1">House Capital Pool</div>
          <div className="text-lg font-bold text-green-400">
            {houseCapital.toFixed(2)} USDC
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Risk capital
          </div>
        </div>

        <div className="bg-arc-card rounded-lg p-4 border border-arc-primary/20">
          <div className="text-xs text-gray-400 mb-1">User Reserve</div>
          <div className="text-lg font-bold text-blue-400">
            {userReserve.toFixed(2)} USDC
          </div>
          <div className="text-xs text-gray-500 mt-1">
            User deposits
          </div>
        </div>

        <div className="bg-arc-card rounded-lg p-4 border border-arc-primary/20">
          <div className="text-xs text-gray-400 mb-1">Active Bets</div>
          <div className="text-lg font-bold text-yellow-400">
            {activeBets.toFixed(2)} ARCS
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Live on platform
          </div>
        </div>
      </div>
    </div>
  )
}
