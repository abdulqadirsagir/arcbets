'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import toast from 'react-hot-toast'
import { CONTRACTS, DEPOSIT_VAULT_ABI, ARCS_TOKEN_ABI, ARCS_PER_USDC } from '@/lib/contracts'

export default function DepositRedeem() {
  const { address, isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState<'deposit' | 'redeem'>('deposit')
  const [usdcAmount, setUsdcAmount] = useState('')
  const [arcsAmount, setArcsAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Get user's native USDC balance using useBalance hook
  const { data: nativeBalanceData } = useBalance({
    address: address,
    query: { enabled: !!address, refetchInterval: 5000 }
  })
  
  const nativeBalance = nativeBalanceData?.value

  // Get user's ARCS balance
  const { data: arcsBalance } = useReadContract({
    address: CONTRACTS.ARCS_TOKEN as `0x${string}`,
    abi: ARCS_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 }
  })

  // Check allowance for DepositVault
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.ARCS_TOKEN as `0x${string}`,
    abi: ARCS_TOKEN_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.DEPOSIT_VAULT as `0x${string}`] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 }
  })

  // Get user deposit info (V2 uses userDepositsUSDC mapping)
  const { data: userDeposits } = useReadContract({
    address: CONTRACTS.DEPOSIT_VAULT as `0x${string}`,
    abi: DEPOSIT_VAULT_ABI,
    functionName: 'userDepositsUSDC',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 }
  })

  // Separate hooks for approval and redemption
  const { writeContract: approveARCS, data: approveHash, isPending: isApprovePending } = useWriteContract()
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash })
  
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // Format balances
  const formattedNativeBalance = nativeBalance ? formatEther(nativeBalance as bigint) : '0'
  const formattedArcsBalance = arcsBalance ? formatEther(arcsBalance as bigint) : '0'
  const totalDeposited = userDeposits ? formatEther(userDeposits as bigint) : '0'

  // Calculate conversion
  const calculateArcsFromUsdc = (usdc: string) => {
    if (!usdc || isNaN(parseFloat(usdc))) return '0'
    return (parseFloat(usdc) * ARCS_PER_USDC).toFixed(2)
  }

  const calculateUsdcFromArcs = (arcs: string) => {
    if (!arcs || isNaN(parseFloat(arcs))) return '0'
    return (parseFloat(arcs) / ARCS_PER_USDC).toFixed(4)
  }

  // Handle deposit
  const handleDeposit = async () => {
    if (!usdcAmount || parseFloat(usdcAmount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (parseFloat(usdcAmount) < 0.1) {
      toast.error('Minimum deposit is 0.1 USDC')
      return
    }

    if (parseFloat(usdcAmount) > parseFloat(formattedNativeBalance)) {
      toast.error('Insufficient balance')
      return
    }

    setIsProcessing(true)

    try {
      const amountWei = parseEther(usdcAmount)
      
      await writeContract({
        address: CONTRACTS.DEPOSIT_VAULT as `0x${string}`,
        abi: DEPOSIT_VAULT_ABI,
        functionName: 'deposit',
        value: amountWei,
      })

      toast.success(`Depositing ${usdcAmount} USDC for ${calculateArcsFromUsdc(usdcAmount)} ARCS...`)
    } catch (error: any) {
      console.error('Deposit error:', error)
      toast.error(error.message || 'Deposit failed')
      setIsProcessing(false)
    }
  }

  // Handle approve for redemption
  const handleApproveRedeem = async () => {
    if (!arcsAmount || parseFloat(arcsAmount) <= 0) {
      toast.error('Please enter an amount first')
      return
    }

    setIsProcessing(true)

    try {
      const amountWei = parseEther(arcsAmount)
      
      await approveARCS({
        address: CONTRACTS.ARCS_TOKEN as `0x${string}`,
        abi: ARCS_TOKEN_ABI,
        functionName: 'approve',
        args: [CONTRACTS.DEPOSIT_VAULT as `0x${string}`, amountWei],
      })

      toast.success('Approving ARCS for redemption...')
    } catch (error: any) {
      console.error('Approval error:', error)
      toast.error(error.message || 'Approval failed')
      setIsProcessing(false)
    }
  }

  // Handle redeem
  const handleRedeem = async () => {
    if (!arcsAmount || parseFloat(arcsAmount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (parseFloat(arcsAmount) < 1) {
      toast.error('Minimum redemption is 1 ARCS')
      return
    }

    if (parseFloat(arcsAmount) > parseFloat(formattedArcsBalance)) {
      toast.error('Insufficient ARCS balance')
      return
    }

    // Check if approval is needed
    const amountWei = parseEther(arcsAmount)
    const currentAllowance = allowance as bigint || 0n
    
    if (currentAllowance < amountWei) {
      toast.error('Please approve ARCS first')
      return
    }

    setIsProcessing(true)

    try {
      await writeContract({
        address: CONTRACTS.DEPOSIT_VAULT as `0x${string}`,
        abi: DEPOSIT_VAULT_ABI,
        functionName: 'redeem',
        args: [amountWei],
      })

      toast.success(`Redeeming ${arcsAmount} ARCS for ${calculateUsdcFromArcs(arcsAmount)} USDC...`)
    } catch (error: any) {
      console.error('Redeem error:', error)
      toast.error(error.message || 'Redemption failed')
      setIsProcessing(false)
    }
  }

  // Handle approval success
  useEffect(() => {
    if (isApproveSuccess) {
      setIsProcessing(false)
      refetchAllowance()
      toast.success('ARCS approved! Now you can redeem. 🎉')
    }
  }, [isApproveSuccess, refetchAllowance])

  // Handle transaction success
  useEffect(() => {
    if (isSuccess) {
      setIsProcessing(false)
      setUsdcAmount('')
      setArcsAmount('')
      toast.success('Transaction confirmed! 🎉')
    }
  }, [isSuccess])

  if (!isConnected) {
    return (
      <div className="bg-arc-card border border-arc-primary/20 rounded-lg p-6 text-center">
        <p className="text-gray-400">Connect your wallet to deposit or redeem ARCS</p>
      </div>
    )
  }

  return (
    <div className="bg-arc-card border border-arc-primary/20 rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-2">💰 ARCS Chips</h2>
        <p className="text-sm text-gray-400">
          Deposit USDC to receive ARCS betting chips (1 USDC = 10 ARCS)
        </p>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-arc-bg rounded-lg p-4 border border-arc-primary/10">
          <div className="text-xs text-gray-400 mb-1">USDC Balance</div>
          <div className="text-lg font-bold text-white">{parseFloat(formattedNativeBalance).toFixed(2)}</div>
        </div>
        <div className="bg-arc-bg rounded-lg p-4 border border-arc-primary/10">
          <div className="text-xs text-gray-400 mb-1">ARCS Balance</div>
          <div className="text-lg font-bold text-arc-primary">{parseFloat(formattedArcsBalance).toFixed(2)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('deposit')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            activeTab === 'deposit'
              ? 'bg-arc-primary text-white'
              : 'bg-arc-bg text-gray-400 hover:text-white'
          }`}
        >
          Deposit
        </button>
        <button
          onClick={() => setActiveTab('redeem')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            activeTab === 'redeem'
              ? 'bg-arc-primary text-white'
              : 'bg-arc-bg text-gray-400 hover:text-white'
          }`}
        >
          Redeem
        </button>
      </div>

      {/* Deposit Tab */}
      {activeTab === 'deposit' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              USDC Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={usdcAmount}
                onChange={(e) => setUsdcAmount(e.target.value)}
                placeholder="0.00"
                step="0.1"
                min="0.1"
                disabled={isProcessing || isConfirming}
                className="w-full bg-arc-bg border border-arc-primary/20 rounded-lg py-3 px-4 text-white text-lg focus:outline-none focus:border-arc-primary disabled:opacity-50"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                USDC
              </div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <div className="text-xs text-gray-400">
                Min: 0.1 USDC
              </div>
              <button
                onClick={() => {
                  // Reserve 0.1 USDC for gas fees
                  const maxDeposit = Math.max(0, parseFloat(formattedNativeBalance) - 0.1)
                  setUsdcAmount(maxDeposit.toFixed(2))
                }}
                disabled={isProcessing || isConfirming}
                className="text-xs text-arc-primary hover:text-arc-secondary font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                Max
              </button>
            </div>
          </div>

          {usdcAmount && parseFloat(usdcAmount) > 0 && (
            <div className="bg-arc-bg rounded-lg p-4 border border-arc-primary/20">
              <div className="text-sm text-gray-400 mb-1">You will receive</div>
              <div className="text-2xl font-bold text-arc-primary">
                {calculateArcsFromUsdc(usdcAmount)} ARCS
              </div>
            </div>
          )}

          <button
            onClick={handleDeposit}
            disabled={isProcessing || isConfirming || !usdcAmount}
            className="w-full bg-arc-primary hover:bg-arc-secondary text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing || isConfirming ? 'Processing...' : 'Deposit USDC'}
          </button>
        </div>
      )}

      {/* Redeem Tab */}
      {activeTab === 'redeem' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              ARCS Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={arcsAmount}
                onChange={(e) => setArcsAmount(e.target.value)}
                placeholder="0.00"
                step="1"
                min="1"
                disabled={isProcessing || isConfirming}
                className="w-full bg-arc-bg border border-arc-primary/20 rounded-lg py-3 px-4 text-white text-lg focus:outline-none focus:border-arc-primary disabled:opacity-50"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                ARCS
              </div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <div className="text-xs text-gray-400">
                Min: 1 ARCS
              </div>
              <button
                onClick={() => setArcsAmount(formattedArcsBalance)}
                disabled={isProcessing || isConfirming}
                className="text-xs text-arc-primary hover:text-arc-secondary font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                Max
              </button>
            </div>
          </div>

          {arcsAmount && parseFloat(arcsAmount) > 0 && (
            <div className="bg-arc-bg rounded-lg p-4 border border-arc-primary/20">
              <div className="text-sm text-gray-400 mb-1">You will receive</div>
              <div className="text-2xl font-bold text-green-400">
                {calculateUsdcFromArcs(arcsAmount)} USDC
              </div>
            </div>
          )}

          {/* Approve or Redeem Button */}
          {arcsAmount && parseFloat(arcsAmount) > 0 ? (
            (() => {
              const amountInWei = parseEther(arcsAmount)
              const currentAllowance = allowance as bigint || 0n
              const needsApproval = currentAllowance < amountInWei

              return needsApproval ? (
                <div className="space-y-3">
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-500">
                    <div className="flex items-center gap-2">
                      <span>⚠️</span>
                      <span>You need to approve ARCS before redeeming</span>
                    </div>
                  </div>
                  <button
                    onClick={handleApproveRedeem}
                    disabled={isApprovePending || isApproveConfirming}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isApprovePending || isApproveConfirming ? 'Approving...' : `Approve ${arcsAmount} ARCS`}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleRedeem}
                  disabled={isProcessing || isConfirming}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing || isConfirming ? 'Processing...' : 'Redeem for USDC'}
                </button>
              )
            })()
          ) : (
            <button
              disabled
              className="w-full bg-green-600 opacity-50 cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg"
            >
              Redeem for USDC
            </button>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="mt-6 pt-6 border-t border-arc-primary/10">
        <div className="text-xs text-gray-400 mb-2">Total Deposited</div>
        <div className="text-sm text-white">{parseFloat(totalDeposited).toFixed(4)} USDC</div>
      </div>
    </div>
  )
}
