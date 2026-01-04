'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import toast from 'react-hot-toast'
import { CONTRACTS, BETTING_ENGINE_ABI, ARCS_TOKEN_ABI, ASSETS, DURATIONS } from '@/lib/contracts'

interface BettingInterfaceARCSProps {
  onAssetChange?: (asset: string) => void
}

export default function BettingInterfaceARCS({ onAssetChange }: BettingInterfaceARCSProps) {
  const { address, isConnected } = useAccount()
  const [selectedAsset, setSelectedAsset] = useState('ETH')
  const [isLong, setIsLong] = useState(true)
  const [duration, setDuration] = useState(3600) // 1 hour default
  const [betAmount, setBetAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Get user's ARCS balance
  const { data: arcsBalance } = useReadContract({
    address: CONTRACTS.ARCS_TOKEN as `0x${string}`,
    abi: ARCS_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 }
  })

  // Check allowance for BettingEngine
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.ARCS_TOKEN as `0x${string}`,
    abi: ARCS_TOKEN_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.BETTING_ENGINE as `0x${string}`] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 }
  })

  // Get min/max bet limits (V2 uses MIN_BET/MAX_BET constants)
  const { data: minBet } = useReadContract({
    address: CONTRACTS.BETTING_ENGINE as `0x${string}`,
    abi: BETTING_ENGINE_ABI,
    functionName: 'MIN_BET',
  })

  const { data: maxBet } = useReadContract({
    address: CONTRACTS.BETTING_ENGINE as `0x${string}`,
    abi: BETTING_ENGINE_ABI,
    functionName: 'MAX_BET',
  })

  // Separate hooks for approval and betting
  const { writeContract: approveARCS, data: approveHash, isPending: isApprovePending } = useWriteContract()
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash })
  
  const { writeContract: placeBet, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const formattedBalance = arcsBalance ? formatEther(arcsBalance as bigint) : '0'
  const formattedMinBet = minBet ? formatEther(minBet as bigint) : '1'
  const formattedMaxBet = maxBet ? formatEther(maxBet as bigint) : '100'

  // Get multiplier for selected duration
  const selectedDuration = DURATIONS.find(d => d.value === duration)
  const multiplier = selectedDuration?.multiplier || 1.5
  const potentialPayout = betAmount ? (parseFloat(betAmount) * multiplier).toFixed(2) : '0'

  // Handle approval
  const handleApprove = async () => {
    if (!betAmount || parseFloat(betAmount) <= 0) {
      toast.error('Please enter a bet amount first')
      return
    }

    setIsProcessing(true)

    try {
      const amountInWei = parseEther(betAmount)
      
      await approveARCS({
        address: CONTRACTS.ARCS_TOKEN as `0x${string}`,
        abi: ARCS_TOKEN_ABI,
        functionName: 'approve',
        args: [CONTRACTS.BETTING_ENGINE as `0x${string}`, amountInWei],
      })

      toast.success('Approving ARCS for betting...')
    } catch (error: any) {
      console.error('Approval error:', error)
      toast.error(error.message || 'Approval failed')
      setIsProcessing(false)
    }
  }

  const handlePlaceBet = async () => {
    if (!betAmount || parseFloat(betAmount) <= 0) {
      toast.error('Please enter a valid bet amount')
      return
    }

    if (parseFloat(betAmount) < parseFloat(formattedMinBet)) {
      toast.error(`Minimum bet is ${formattedMinBet} ARCS`)
      return
    }

    if (parseFloat(betAmount) > parseFloat(formattedMaxBet)) {
      toast.error(`Maximum bet is ${formattedMaxBet} ARCS`)
      return
    }

    if (parseFloat(betAmount) > parseFloat(formattedBalance)) {
      toast.error('Insufficient ARCS balance')
      return
    }

    // Check if approval is needed
    const amountInWei = parseEther(betAmount)
    const currentAllowance = allowance as bigint || 0n
    
    if (currentAllowance < amountInWei) {
      toast.error('Please approve ARCS first')
      return
    }

    setIsProcessing(true)

    try {
      console.log('🎲 Placing bet with:', {
        contract: CONTRACTS.BETTING_ENGINE,
        asset: selectedAsset,
        duration: duration,
        isLong: isLong,
        amount: betAmount,
        amountInWei: amountInWei.toString()
      })

      await placeBet({
        address: CONTRACTS.BETTING_ENGINE as `0x${string}`,
        abi: BETTING_ENGINE_ABI,
        functionName: 'placeBet',
        args: [selectedAsset, isLong, amountInWei, BigInt(duration)],
      })

      toast.success(`Placing ${betAmount} ARCS bet on ${selectedAsset}...`)
    } catch (error: any) {
      console.error('Bet placement error:', error)
      toast.error(error.message || 'Failed to place bet')
      setIsProcessing(false)
    }
  }

  // Handle approval success
  useEffect(() => {
    if (isApproveSuccess) {
      setIsProcessing(false)
      refetchAllowance()
      toast.success('ARCS approved! Now you can place your bet. 🎉')
    }
  }, [isApproveSuccess, refetchAllowance])

  // Handle bet placement success
  useEffect(() => {
    if (isSuccess) {
      setIsProcessing(false)
      setBetAmount('')
      toast.success('Bet placed successfully! 🎉')
    }
  }, [isSuccess])

  if (!isConnected) {
    return (
      <div className="bg-arc-card border border-arc-primary/20 rounded-lg p-8 text-center">
        <div className="text-4xl mb-4">🎲</div>
        <h3 className="text-xl font-bold text-white mb-2">Connect Wallet to Start</h3>
        <p className="text-gray-400">Connect your wallet to place bets</p>
      </div>
    )
  }

  return (
    <div className="bg-arc-card border border-arc-primary/20 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-6">🎲 Place Your Bet</h2>

      {/* Asset Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Select Asset
        </label>
        <div className="grid grid-cols-3 gap-3">
          {ASSETS.map((asset) => (
            <button
              key={asset.symbol}
              onClick={() => {
                setSelectedAsset(asset.symbol)
                onAssetChange?.(asset.symbol)
              }}
              disabled={isProcessing || isConfirming}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all disabled:opacity-50 ${
                selectedAsset === asset.symbol
                  ? 'bg-neon-purple border-neon-purple text-white shadow-neon'
                  : 'bg-arc-bg border-transparent text-gray-400 hover:border-neon-purple/50'
              }`}
            >
              <span className="text-2xl mb-1">{asset.icon}</span>
              <span className="font-bold">{asset.symbol}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Direction */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Direction
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setIsLong(true)}
            disabled={isProcessing || isConfirming}
            className={`p-4 rounded-lg border-2 transition-all disabled:opacity-50 ${
              isLong
                ? 'bg-neon-green border-neon-green text-white shadow-neon-green'
                : 'bg-arc-bg border-transparent text-gray-400 hover:border-neon-green/50'
            }`}
          >
            <div className="flex items-center justify-center mb-1">
              <span className="text-2xl">📈</span>
            </div>
            <div className="font-bold">Long / Up</div>
            <div className="text-xs opacity-75">Price will go UP</div>
          </button>
          <button
            onClick={() => setIsLong(false)}
            disabled={isProcessing || isConfirming}
            className={`p-4 rounded-lg border-2 transition-all disabled:opacity-50 ${
              !isLong
                ? 'bg-neon-red border-neon-red text-white shadow-neon-red'
                : 'bg-arc-bg border-transparent text-gray-400 hover:border-neon-red/50'
            }`}
          >
            <div className="flex items-center justify-center mb-1">
              <span className="text-2xl">📉</span>
            </div>
            <div className="font-bold">Short / Down</div>
            <div className="text-xs opacity-75">Price will go DOWN</div>
          </button>
        </div>
      </div>

      {/* Duration */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Duration
        </label>
        <div className="grid grid-cols-3 gap-3">
          {DURATIONS.slice(0, 6).map((dur) => (
            <button
              key={dur.value}
              onClick={() => setDuration(dur.value)}
              disabled={isProcessing || isConfirming}
              className={`p-3 rounded-lg border-2 transition-all disabled:opacity-50 ${
                duration === dur.value
                  ? 'bg-neon-purple border-neon-purple text-white shadow-neon'
                  : 'bg-arc-bg border-transparent text-gray-400 hover:border-neon-purple/50'
              }`}
            >
              <div className="font-bold text-sm">{dur.label}</div>
              <div className="text-xs text-arc-secondary">{dur.multiplier}x</div>
            </button>
          ))}
        </div>
      </div>

      {/* Bet Amount */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Bet Amount (ARCS)
        </label>
        <div className="relative">
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            placeholder="0"
            step="1"
            min={formattedMinBet}
            max={formattedMaxBet}
            disabled={isProcessing || isConfirming}
            className="w-full bg-arc-bg border border-arc-primary/20 rounded-lg py-4 px-4 pr-20 text-white text-2xl focus:outline-none focus:border-arc-primary disabled:opacity-50"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
            ARCS
          </div>
        </div>
        <div className="flex justify-between items-center mt-2">
          <div className="text-xs text-gray-400">
            Balance: {parseFloat(formattedBalance).toFixed(2)} ARCS
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              console.log('Max clicked! Setting to:', formattedBalance)
              setBetAmount(formattedBalance)
            }}
            disabled={isProcessing || !isConnected}
            className="text-xs text-arc-primary hover:text-arc-secondary font-medium transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed hover:underline"
          >
            Max
          </button>
        </div>
        {betAmount && parseFloat(betAmount) > parseFloat(formattedBalance) && (
          <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
            <span>⚠️</span>
            <span>Insufficient balance! You only have {formattedBalance} ARCS</span>
          </div>
        )}
      </div>

      {/* Potential Payout */}
      <div className="mb-6 bg-arc-bg rounded-lg p-4 border border-arc-primary/20">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-gray-400">Potential Payout</div>
            <div className="text-xs text-gray-500 mt-1">Multiplier</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-arc-primary">{potentialPayout} ARCS</div>
            <div className="text-sm text-arc-secondary">{multiplier}x</div>
          </div>
        </div>
      </div>

      {/* Approve & Place Bet Buttons */}
      {betAmount && parseFloat(betAmount) > 0 && (
        <>
          {/* Check if approval is needed */}
          {(() => {
            const amountInWei = parseEther(betAmount)
            const currentAllowance = allowance as bigint || 0n
            const needsApproval = currentAllowance < amountInWei

            return needsApproval ? (
              <div className="space-y-3">
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-500">
                  <div className="flex items-center gap-2">
                    <span>⚠️</span>
                    <span>You need to approve ARCS before betting</span>
                  </div>
                </div>
                <button
                  onClick={handleApprove}
                  disabled={isApprovePending || isApproveConfirming}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-4 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg flex items-center justify-center gap-2"
                >
                  {isApprovePending || isApproveConfirming ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Approving...
                    </>
                  ) : (
                    <>
                      <span>🔓</span>
                      Approve {betAmount} ARCS
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={handlePlaceBet}
                disabled={isProcessing || isConfirming}
                className="w-full bg-gradient-to-r from-neon-purple to-neon-pink hover:shadow-neon-strong text-white font-bold py-4 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg flex items-center justify-center gap-2 transform hover:scale-105"
              >
                {isProcessing || isConfirming ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Processing...
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    Place Bet
                  </>
                )}
              </button>
            )
          })()}
        </>
      )}
      
      {/* Show disabled button if no amount entered */}
      {(!betAmount || parseFloat(betAmount) <= 0) && (
        <button
          disabled
          className="w-full bg-gradient-to-r from-neon-purple to-neon-pink opacity-50 cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg text-lg flex items-center justify-center gap-2"
        >
          <span>🚀</span>
          Place Bet
        </button>
      )}

      {/* Info */}
      <div className="mt-4 text-xs text-gray-400 text-center">
        <p>Min: {formattedMinBet} ARCS • Max: {formattedMaxBet} ARCS</p>
      </div>
    </div>
  )
}
