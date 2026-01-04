'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useBalance } from 'wagmi'
import { parseEther } from 'viem'
import toast from 'react-hot-toast'
import { CONTRACTS, BINARY_OPTIONS_ABI, ASSETS, DURATIONS } from '@/lib/contracts'

export default function BettingInterface() {
  const { address, isConnected } = useAccount()
  const [selectedAsset, setSelectedAsset] = useState('ETH')
  const [betAmount, setBetAmount] = useState('')
  const [duration, setDuration] = useState(3600)
  const [isLong, setIsLong] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  const { writeContractAsync: placeBet } = useWriteContract()

  // Read NATIVE USDC balance (18 decimals on Arc)
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address: address,
  })

  // Format balance for display
  const formattedBalance = balanceData ? Number(balanceData.formatted).toFixed(2) : '0.00'

  // Debug logging
  useEffect(() => {
    if (address && balanceData) {
      console.log('🔍 Native USDC Balance Debug:', {
        address,
        rawBalance: balanceData.value.toString(),
        formatted: balanceData.formatted,
        symbol: balanceData.symbol,
        decimals: balanceData.decimals
      })
    }
  }, [address, balanceData])

  const selectedDuration = DURATIONS.find(d => d.value === duration)
  const potentialPayout = betAmount ? (parseFloat(betAmount) * (selectedDuration?.multiplier || 1)).toFixed(2) : '0.00'

  const handlePlaceBet = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet')
      return
    }

    if (!betAmount || parseFloat(betAmount) < 1) {
      toast.error('Minimum bet is 1 USDC')
      return
    }

    if (parseFloat(betAmount) > parseFloat(formattedBalance)) {
      toast.error('Insufficient USDC balance')
      return
    }

    setIsProcessing(true)
    const toastId = toast.loading('Placing bet...')

    try {
      // Convert to wei (18 decimals for native USDC)
      const amountInWei = parseEther(betAmount)
      
      console.log('🎲 Placing bet with:', {
        contract: CONTRACTS.BINARY_OPTIONS,
        asset: selectedAsset,
        duration: duration,
        isLong: isLong,
        amount: betAmount,
        amountInWei: amountInWei.toString()
      })
      
      // Place bet with native USDC - NO APPROVAL NEEDED! 🎉
      const betTx = await placeBet({
        address: CONTRACTS.BINARY_OPTIONS as `0x${string}`,
        abi: BINARY_OPTIONS_ABI,
        functionName: 'placeBet',
        args: [selectedAsset, BigInt(duration), isLong],
        value: amountInWei, // Send native USDC with the transaction!
      })

      toast.success('Bet placed successfully! 🎉', { id: toastId })
      setBetAmount('')
      
      // Refetch balance after bet
      await refetchBalance()
    } catch (error: any) {
      console.error('Error placing bet:', error)
      const errorMessage = error?.shortMessage || error?.message || 'Failed to place bet'
      toast.error(errorMessage, { id: toastId })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="gradient-border rounded-2xl p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Header with Balance */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-arc-primary to-arc-secondary bg-clip-text text-transparent mb-2">
          Place Your Bet
        </h2>
        {isConnected && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700">
              <span className="text-sm text-gray-400">Your Balance:</span>
              <span className="text-lg font-bold text-green-400">{formattedBalance} USDC</span>
            </div>
          </div>
        )}
      </div>

      {/* Asset Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3 text-gray-300">Select Asset</label>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {ASSETS.map((asset) => (
            <button
              key={asset.symbol}
              onClick={() => setSelectedAsset(asset.symbol)}
              disabled={isProcessing}
              className={`p-3 sm:p-4 rounded-xl transition-all transform hover:scale-105 active:scale-95 ${
                selectedAsset === asset.symbol
                  ? 'bg-arc-primary text-white glow shadow-lg'
                  : 'bg-slate-800 hover:bg-slate-700 text-gray-300'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="text-2xl sm:text-3xl mb-1">{asset.icon}</div>
              <div className="font-semibold text-sm sm:text-base">{asset.symbol}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Direction Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3 text-gray-300">Direction</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setIsLong(true)}
            disabled={isProcessing}
            className={`p-3 sm:p-4 rounded-xl transition-all transform hover:scale-105 active:scale-95 ${
              isLong
                ? 'bg-green-600 text-white glow shadow-lg'
                : 'bg-slate-800 hover:bg-slate-700 text-gray-300'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="text-xl sm:text-2xl mb-1">📈</div>
            <div className="font-semibold text-sm sm:text-base">Long / Up</div>
            <div className="text-xs opacity-75">Price will go UP</div>
          </button>
          <button
            onClick={() => setIsLong(false)}
            disabled={isProcessing}
            className={`p-3 sm:p-4 rounded-xl transition-all transform hover:scale-105 active:scale-95 ${
              !isLong
                ? 'bg-red-600 text-white glow shadow-lg'
                : 'bg-slate-800 hover:bg-slate-700 text-gray-300'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="text-xl sm:text-2xl mb-1">📉</div>
            <div className="font-semibold text-sm sm:text-base">Short / Down</div>
            <div className="text-xs opacity-75">Price will go DOWN</div>
          </button>
        </div>
      </div>

      {/* Duration Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3 text-gray-300">Duration</label>
        <div className="grid grid-cols-4 gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              onClick={() => setDuration(d.value)}
              disabled={isProcessing}
              className={`p-2 sm:p-3 rounded-lg transition-all transform hover:scale-105 active:scale-95 ${
                duration === d.value
                  ? 'bg-arc-secondary text-white shadow-lg'
                  : 'bg-slate-800 hover:bg-slate-700 text-gray-300'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="font-semibold text-xs sm:text-sm">{d.label}</div>
              <div className={`text-xs font-bold ${
                duration === d.value ? 'text-yellow-300' : 'text-arc-primary'
              }`}>
                {d.multiplier}x
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bet Amount */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3 text-gray-300">Bet Amount (USDC)</label>
        <div className="relative">
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            placeholder="Enter amount"
            disabled={isProcessing}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 pr-16 text-white focus:outline-none focus:ring-2 focus:ring-arc-primary focus:border-transparent transition-all disabled:opacity-50"
            min="1"
            step="1"
          />
          <div className="absolute right-3 top-3 text-gray-400 font-medium">USDC</div>
        </div>
        <div className="flex justify-between items-center mt-2">
          <div className="text-xs text-gray-400">
            Balance: {formattedBalance} USDC
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
            <span>Insufficient balance! You only have {formattedBalance} USDC</span>
          </div>
        )}
      </div>

      {/* Bet Summary */}
      <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400">Potential Payout</span>
          <span className="text-xl font-bold text-green-400">{potentialPayout} USDC</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">Multiplier</span>
          <span className="text-arc-primary font-semibold">{selectedDuration?.multiplier}x</span>
        </div>
      </div>

      {/* Place Bet Button */}
      {!isConnected ? (
        <w3m-button />
      ) : (
        <button
          onClick={handlePlaceBet}
          disabled={!betAmount || isProcessing}
          className="w-full bg-gradient-to-r from-arc-primary to-arc-secondary text-white font-bold py-4 rounded-xl hover:opacity-90 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {isProcessing ? 'Processing...' : 'Place Bet 🚀'}
        </button>
      )}
    </div>
  )
}
