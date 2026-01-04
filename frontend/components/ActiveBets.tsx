'use client'

import { useState } from 'react'
import { useAccount, useReadContract, useWriteContract } from 'wagmi'
import { CONTRACTS, BETTING_ENGINE_ABI } from '@/lib/contracts'
import { formatTimeRemaining } from '@/lib/utils'
import toast from 'react-hot-toast'
import { formatEther } from 'viem'

interface BetDetails {
  user: string
  asset: string
  amountARCS: bigint
  entryPrice: bigint
  exitPrice: bigint
  startTime: bigint
  endTime: bigint
  multiplier: bigint
  payoutARCS: bigint
  settled: boolean
  won: boolean
  isLong: boolean
}

export default function ActiveBets() {
  const { address } = useAccount()
  const [activeTab, setActiveTab] = useState<'live' | 'past'>('live')
  const { writeContractAsync: settleBet } = useWriteContract()

  // Read user bets - using getUserBets to get bet IDs
  const { data: userBetIds, refetch, isLoading, error } = useReadContract({
    address: CONTRACTS.BETTING_ENGINE as `0x${string}`,
    abi: BETTING_ENGINE_ABI,
    functionName: 'getUserBets',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10000 }
  })

  const handleSettleBet = async (betId: bigint) => {
    const toastId = toast.loading('Settling bet...')
    try {
      await settleBet({
        address: CONTRACTS.BETTING_ENGINE as `0x${string}`,
        abi: BETTING_ENGINE_ABI,
        functionName: 'settleBet',
        args: [betId],
      })
      toast.success('Bet settled successfully!', { id: toastId })
      // Refetch bets after settlement
      refetch()
    } catch (error: any) {
      const errorMessage = error?.shortMessage || error?.message || 'Failed to settle bet'
      toast.error(errorMessage, { id: toastId })
    }
  }

  if (!address) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Connect your wallet to view your bets</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Loading your bets...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">Error loading bets</p>
        <p className="text-sm text-gray-500 mt-2">{error.message}</p>
      </div>
    )
  }

  if (!userBetIds || userBetIds.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No bets placed yet</p>
        <p className="text-sm text-gray-500 mt-2">Place your first bet to get started!</p>
      </div>
    )
  }

  // Count bets by type
  const liveBetCount = (userBetIds as bigint[]).filter(id => {
    // We'll check this in BetCard, but this is for display
    return true // Will be filtered by BetCard component
  }).length

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Your Bets</h2>
      
      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('live')}
          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'live'
              ? 'bg-neon-purple text-white shadow-neon'
              : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
          }`}
        >
          🔴 Live Bets
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'past'
              ? 'bg-neon-purple text-white shadow-neon'
              : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
          }`}
        >
          📜 Past Bets
        </button>
      </div>

      {/* Bet Lists */}
      <div className="space-y-4">
        {userBetIds.map((betId) => (
          <BetCard 
            key={betId.toString()} 
            betId={betId} 
            onSettle={handleSettleBet}
            filterType={activeTab}
          />
        ))}
      </div>
    </div>
  )
}

function BetCard({ betId, onSettle, filterType }: { betId: bigint; onSettle: (betId: bigint) => void; filterType: 'live' | 'past' }) {
  const { data: betData, isLoading, error } = useReadContract({
    address: CONTRACTS.BETTING_ENGINE as `0x${string}`,
    abi: BETTING_ENGINE_ABI,
    functionName: 'getBet',
    args: [betId],
    query: { refetchInterval: 10000 }
  })

  if (isLoading) {
    return (
      <div className="gradient-border rounded-xl p-5">
        <p className="text-gray-400">Loading bet #{betId.toString()}...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="gradient-border rounded-xl p-5">
        <p className="text-red-400">Error loading bet #{betId.toString()}</p>
        <p className="text-xs text-gray-500">{error.message}</p>
      </div>
    )
  }

  if (!betData) return null

  // Wagmi returns the struct as an object with named properties matching the ABI
  const bet: BetDetails = {
    user: (betData as any).user,
    asset: (betData as any).asset,
    isLong: (betData as any).isLong,
    amountARCS: (betData as any).amountARCS,
    entryPrice: (betData as any).entryPrice,
    exitPrice: (betData as any).exitPrice,
    startTime: (betData as any).startTime,
    endTime: (betData as any).endTime,
    multiplier: (betData as any).multiplier,
    payoutARCS: (betData as any).payoutARCS,
    settled: (betData as any).settled,
    won: (betData as any).won,
  }

  const now = Math.floor(Date.now() / 1000)
  const canSettle = !bet.settled && Number(bet.endTime) <= now
  const timeRemaining = formatTimeRemaining(Number(bet.endTime))

  // Filter based on tab
  if (filterType === 'live' && bet.settled) return null
  if (filterType === 'past' && !bet.settled) return null

  return (
    <div className="gradient-border rounded-xl p-5">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl font-bold">{bet.asset}</span>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${
              bet.isLong ? 'bg-green-600' : 'bg-red-600'
            }`}>
              {bet.isLong ? '📈 LONG' : '📉 SHORT'}
            </span>
          </div>
          <div className="text-sm text-gray-400">
            Bet #{betId.toString()}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Status</div>
          <div className={`font-semibold ${
            bet.settled 
              ? bet.won ? 'text-green-400' : 'text-red-400'
              : 'text-yellow-400'
          }`}>
            {bet.settled 
              ? bet.won ? '✅ Won' : '❌ Lost'
              : timeRemaining === 'Ended' ? '⏳ Ready to Settle' : `⏱️ ${timeRemaining}`
            }
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-400 mb-1">Bet Amount</div>
          <div className="font-semibold">{parseFloat(formatEther(bet.amountARCS)).toFixed(2)} ARCS</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Potential Win</div>
          <div className="font-semibold text-green-400">
            {parseFloat(formatEther((bet.amountARCS * bet.multiplier) / 100n)).toFixed(2)} ARCS
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Entry Price</div>
          <div className="font-semibold">${(Number(bet.entryPrice) / 1e8).toFixed(2)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Multiplier</div>
          <div className="font-semibold text-arc-primary">{Number(bet.multiplier) / 100}x</div>
        </div>
      </div>

      {bet.settled && (
        <div className="bg-slate-800/50 rounded-lg p-3 mb-3">
          <div className="text-xs text-gray-400 mb-1">Payout</div>
          <div className="text-lg font-bold text-green-400">
            {bet.won ? `+${parseFloat(formatEther(bet.payoutARCS)).toFixed(2)} ARCS` : '0 ARCS'}
          </div>
        </div>
      )}

      {canSettle && (
        <button
          onClick={() => onSettle(betId)}
          className="w-full bg-arc-primary hover:bg-arc-secondary text-white font-semibold py-2 rounded-lg transition-colors"
        >
          Settle Bet
        </button>
      )}
    </div>
  )
}
