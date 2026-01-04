'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatEther, parseEther } from 'viem'
import { CONTRACTS, DEPOSIT_VAULT_ABI, ARCS_TOKEN_ABI, BETTING_ENGINE_ABI } from '@/lib/contracts'
import { isAdminAddress } from '@/lib/admin'

/**
 * Admin Panel Component
 * 
 * Only accessible by contract owner (admin wallet)
 * Provides house management functions:
 * - View house ARCS balance
 * - Redeem house ARCS to USDC (Option A)
 * - View house capital stats
 * - Withdraw house capital
 */
export default function AdminPanel() {
  const { address, isConnected } = useAccount()
  const [isAdmin, setIsAdmin] = useState(false)
  const [redeemAmount, setRedeemAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [mintAmount, setMintAmount] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Read contract owner
  const { data: contractOwner } = useReadContract({
    address: CONTRACTS.HOUSE_VAULT as `0x${string}`,
    abi: [
      {
        inputs: [],
        name: 'owner',
        outputs: [{ name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'owner',
    query: { refetchInterval: 30000 }
  })

  // Check if connected wallet is admin
  useEffect(() => {
    if (address && contractOwner) {
      const isOwner = address.toLowerCase() === (contractOwner as string).toLowerCase()
      setIsAdmin(isOwner)
    } else {
      setIsAdmin(false)
    }
  }, [address, contractOwner])

  // Read house stats
  const { data: houseStats, refetch: refetchStats } = useReadContract({
    address: CONTRACTS.HOUSE_VAULT as `0x${string}`,
    abi: [
      {
        inputs: [],
        name: 'getHouseStats',
        outputs: [
          { name: 'capitalUSDC', type: 'uint256' },
          { name: 'arcsBalance', type: 'uint256' },
          { name: 'totalPayouts', type: 'uint256' },
          { name: 'totalRake', type: 'uint256' },
          { name: 'netProfit', type: 'uint256' },
        ],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'getHouseStats',
    query: { enabled: isAdmin, refetchInterval: 10000 }
  })

  // Parse house stats
  const houseCapital = houseStats ? parseFloat(formatEther((houseStats as any)[0])) : 0
  const houseARCS = houseStats ? parseFloat(formatEther((houseStats as any)[1])) : 0
  const totalPayouts = houseStats ? parseFloat(formatEther((houseStats as any)[2])) : 0
  const totalRake = houseStats ? parseFloat(formatEther((houseStats as any)[3])) : 0
  const netProfit = houseStats ? parseFloat(formatEther((houseStats as any)[4])) : 0

  // Read treasury ARCS balance
  const { data: treasuryBalance, refetch: refetchTreasury } = useReadContract({
    address: CONTRACTS.ARCS_TOKEN as `0x${string}`,
    abi: [
      {
        inputs: [{ name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'balanceOf',
    args: [CONTRACTS.TREASURY as `0x${string}`],
    query: { enabled: isAdmin, refetchInterval: 10000 }
  })

  const treasuryARCS = treasuryBalance ? parseFloat(formatEther(treasuryBalance as bigint)) : 0

  // Read vault stats for solvency calculation
  const { data: vaultStats } = useReadContract({
    address: CONTRACTS.DEPOSIT_VAULT as `0x${string}`,
    abi: DEPOSIT_VAULT_ABI,
    functionName: 'getVaultStats',
    query: { enabled: isAdmin, refetchInterval: 10000 }
  })

  // Read ARCS total supply
  const { data: totalSupply } = useReadContract({
    address: CONTRACTS.ARCS_TOKEN as `0x${string}`,
    abi: ARCS_TOKEN_ABI,
    functionName: 'totalSupply',
    query: { enabled: isAdmin, refetchInterval: 10000 }
  })

  // Calculate solvency metrics
  const userReserve = vaultStats ? parseFloat(formatEther((vaultStats as any)[0])) : 0
  const vaultHouseCapital = vaultStats ? parseFloat(formatEther((vaultStats as any)[3])) : 0
  const totalARCS = totalSupply ? parseFloat(formatEther(totalSupply as bigint)) : 0
  const requiredUSDC = totalARCS / 10 // 10:1 ARCS:USDC ratio
  const availableUSDC = userReserve + vaultHouseCapital
  const isSolvent = availableUSDC >= requiredUSDC
  const solvencyRatio = requiredUSDC > 0 ? (availableUSDC / requiredUSDC) * 100 : 100

  // Contract write hooks
  const { data: redeemHash, writeContract: redeemARCS, isPending: isRedeemPending } = useWriteContract()
  const { data: withdrawHash, writeContract: withdrawCapital, isPending: isWithdrawPending } = useWriteContract()
  const { data: depositHash, writeContract: depositToHouse, isPending: isDepositPending } = useWriteContract()
  const { data: mintHash, writeContract: mintARCS, isPending: isMintPending } = useWriteContract()

  // Wait for transactions
  const { isSuccess: redeemSuccess } = useWaitForTransactionReceipt({ hash: redeemHash })
  const { isSuccess: withdrawSuccess } = useWaitForTransactionReceipt({ hash: withdrawHash })
  const { isSuccess: depositSuccess } = useWaitForTransactionReceipt({ hash: depositHash })
  const { isSuccess: mintSuccess } = useWaitForTransactionReceipt({ hash: mintHash })

  // Handle success
  useEffect(() => {
    if (redeemSuccess) {
      setSuccessMessage(`Successfully redeemed ${redeemAmount} ARCS to USDC!`)
      setShowSuccess(true)
      setRedeemAmount('')
      refetchStats()
      setTimeout(() => setShowSuccess(false), 5000)
    }
  }, [redeemSuccess, redeemAmount, refetchStats])

  useEffect(() => {
    if (withdrawSuccess) {
      setSuccessMessage(`Successfully withdrew ${withdrawAmount} USDC!`)
      setShowSuccess(true)
      setWithdrawAmount('')
      refetchStats()
      setTimeout(() => setShowSuccess(false), 5000)
    }
  }, [withdrawSuccess, withdrawAmount, refetchStats])

  useEffect(() => {
    if (depositSuccess) {
      setSuccessMessage(`Successfully deposited ${depositAmount} USDC to house pool!`)
      setShowSuccess(true)
      setDepositAmount('')
      refetchStats()
      setTimeout(() => setShowSuccess(false), 5000)
    }
  }, [depositSuccess, depositAmount, refetchStats])

  useEffect(() => {
    if (mintSuccess) {
      setSuccessMessage(`Successfully minted ${mintAmount} ARCS to treasury!`)
      setShowSuccess(true)
      setMintAmount('')
      refetchTreasury()
      setTimeout(() => setShowSuccess(false), 5000)
    }
  }, [mintSuccess, mintAmount, refetchTreasury])

  // Handle redeem ARCS
  const handleRedeemARCS = () => {
    if (!redeemAmount || parseFloat(redeemAmount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    if (parseFloat(redeemAmount) > houseARCS) {
      alert(`Insufficient house ARCS. Available: ${houseARCS.toFixed(2)}`)
      return
    }

    try {
      redeemARCS({
        address: CONTRACTS.HOUSE_VAULT as `0x${string}`,
        abi: [
          {
            inputs: [{ name: 'arcsAmount', type: 'uint256' }],
            name: 'redeemHouseARCS',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ],
        functionName: 'redeemHouseARCS',
        args: [parseEther(redeemAmount)],
      })
    } catch (error) {
      console.error('Error redeeming ARCS:', error)
      alert('Failed to redeem ARCS. Check console for details.')
    }
  }

  // Handle withdraw capital
  const handleWithdrawCapital = () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    if (parseFloat(withdrawAmount) > houseCapital) {
      alert(`Insufficient house capital. Available: ${houseCapital.toFixed(2)}`)
      return
    }

    try {
      withdrawCapital({
        address: CONTRACTS.HOUSE_VAULT as `0x${string}`,
        abi: [
          {
            inputs: [{ name: 'amount', type: 'uint256' }],
            name: 'withdrawHouseCapital',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ],
        functionName: 'withdrawHouseCapital',
        args: [parseEther(withdrawAmount)],
      })
    } catch (error) {
      console.error('Error withdrawing capital:', error)
      alert('Failed to withdraw capital. Check console for details.')
    }
  }

  // Handle deposit to house pool
  const handleDepositToHouse = () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    try {
      depositToHouse({
        address: CONTRACTS.HOUSE_VAULT as `0x${string}`,
        abi: [
          {
            inputs: [],
            name: 'depositHouseCapital',
            outputs: [],
            stateMutability: 'payable',
            type: 'function',
          },
        ],
        functionName: 'depositHouseCapital',
        value: parseEther(depositAmount),
      })
    } catch (error) {
      console.error('Error depositing to house:', error)
      alert('Failed to deposit to house pool. Check console for details.')
    }
  }

  const handleMintARCS = () => {
    if (!mintAmount || parseFloat(mintAmount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    try {
      mintARCS({
        address: CONTRACTS.ARCS_TOKEN as `0x${string}`,
        abi: [
          {
            inputs: [{ name: 'amount', type: 'uint256' }],
            name: 'mint',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ],
        functionName: 'mint',
        args: [parseEther(mintAmount)],
      })
    } catch (error) {
      console.error('Error minting ARCS:', error)
      alert('Failed to mint ARCS. Check console for details.')
    }
  }

  // Not connected
  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-arc-card rounded-lg p-8 border border-arc-primary/20 text-center">
          <div className="text-4xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-arc-primary mb-2">Admin Panel</h2>
          <p className="text-gray-400">Please connect your wallet to access admin functions</p>
        </div>
      </div>
    )
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-arc-card rounded-lg p-8 border border-red-500/30 text-center">
          <div className="text-4xl mb-4">⛔</div>
          <h2 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-4">This panel is only accessible to the contract owner.</p>
          <div className="bg-arc-dark/50 rounded p-4 text-left">
            <p className="text-xs text-gray-500 mb-2">Your Address:</p>
            <p className="text-sm font-mono text-gray-300 mb-4">{address}</p>
            <p className="text-xs text-gray-500 mb-2">Contract Owner:</p>
            <p className="text-sm font-mono text-gray-300">{contractOwner as string || 'Loading...'}</p>
          </div>
        </div>
      </div>
    )
  }

  // Admin interface
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-arc-primary/20 to-purple-500/20 rounded-lg p-6 border border-arc-primary/30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-arc-primary mb-2">🛠️ Admin Panel</h1>
            <p className="text-gray-400">House Capital Management & ARCS Redemption</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">Logged in as:</div>
            <div className="text-sm font-mono text-green-400">{address?.slice(0, 6)}...{address?.slice(-4)}</div>
            <div className="text-xs text-green-400 mt-1">✅ Admin</div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-center">
          <div className="text-green-400 font-bold">✅ {successMessage}</div>
        </div>
      )}

      {/* System Solvency Banner */}
      <div className={`bg-arc-card border rounded-lg p-4 ${
        isSolvent ? 'border-green-500/30' : 'border-red-500/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{isSolvent ? '✅' : '🚨'}</span>
            <div>
              <div className="font-bold text-white">System Solvency Status</div>
              <div className={`text-sm ${isSolvent ? 'text-green-400' : 'text-red-400'}`}>
                {isSolvent 
                  ? 'System is solvent - all ARCS backed by USDC' 
                  : 'Critical: System insolvent!'}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">Solvency Ratio</div>
            <div className={`text-2xl font-bold ${isSolvent ? 'text-green-400' : 'text-red-400'}`}>
              {solvencyRatio.toFixed(0)}%
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Total ARCS Supply</div>
            <div className="text-white font-semibold">{totalARCS.toLocaleString()} ARCS</div>
          </div>
          <div>
            <div className="text-gray-400">Required USDC</div>
            <div className="text-yellow-400 font-semibold">{requiredUSDC.toFixed(2)} USDC</div>
          </div>
          <div>
            <div className="text-gray-400">Available USDC</div>
            <div className={`font-semibold ${availableUSDC >= requiredUSDC ? 'text-green-400' : 'text-red-400'}`}>
              {availableUSDC.toFixed(2)} USDC
            </div>
          </div>
        </div>
      </div>

      {/* House Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-arc-card rounded-lg p-4 border border-green-500/30">
          <div className="text-xs text-gray-400 mb-1">House Capital</div>
          <div className="text-2xl font-bold text-green-400">{houseCapital.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-1">USDC available</div>
        </div>

        <div className="bg-arc-card rounded-lg p-4 border border-purple-500/30">
          <div className="text-xs text-gray-400 mb-1">House ARCS</div>
          <div className="text-2xl font-bold text-purple-400">{houseARCS.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-1">{(houseARCS / 10).toFixed(2)} USDC value</div>
        </div>

        <div className="bg-arc-card rounded-lg p-4 border border-red-500/30">
          <div className="text-xs text-gray-400 mb-1">Total Payouts</div>
          <div className="text-2xl font-bold text-red-400">{totalPayouts.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-1">USDC paid out</div>
        </div>

        <div className="bg-arc-card rounded-lg p-4 border border-yellow-500/30">
          <div className="text-xs text-gray-400 mb-1">Total Rake</div>
          <div className="text-2xl font-bold text-yellow-400">{totalRake.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-1">USDC collected</div>
        </div>

        <div className="bg-arc-card rounded-lg p-4 border border-arc-primary/30">
          <div className="text-xs text-gray-400 mb-1">Net Profit</div>
          <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {netProfit >= 0 ? '+' : ''}{netProfit.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">USDC profit/loss</div>
        </div>
      </div>

      {/* Redeem House ARCS Section */}
      <div className="bg-arc-card rounded-lg p-6 border border-purple-500/30">
        <div className="flex items-center mb-4">
          <div className="text-3xl mr-3">💎</div>
          <div>
            <h2 className="text-xl font-bold text-purple-400">Redeem House ARCS (Option A)</h2>
            <p className="text-sm text-gray-400">Convert house ARCS back to USDC in one transaction</p>
          </div>
        </div>

        <div className="bg-arc-dark/50 rounded p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Available House ARCS:</span>
              <span className="text-purple-400 font-bold ml-2">{houseARCS.toFixed(2)} ARCS</span>
            </div>
            <div>
              <span className="text-gray-500">USDC Value:</span>
              <span className="text-green-400 font-bold ml-2">{(houseARCS / 10).toFixed(2)} USDC</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Amount to Redeem (ARCS)</label>
            <input
              type="number"
              value={redeemAmount}
              onChange={(e) => setRedeemAmount(e.target.value)}
              placeholder="Enter ARCS amount"
              className="w-full bg-arc-dark border border-purple-500/30 rounded px-4 py-3 text-white focus:outline-none focus:border-purple-400"
              disabled={isRedeemPending}
            />
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Min: 1 ARCS</span>
              <button
                onClick={() => setRedeemAmount(houseARCS.toString())}
                className="text-purple-400 hover:text-purple-300"
                disabled={isRedeemPending}
              >
                Max: {houseARCS.toFixed(2)} ARCS
              </button>
            </div>
          </div>

          {redeemAmount && parseFloat(redeemAmount) > 0 && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded p-3 text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-gray-400">You will receive:</span>
                <span className="text-green-400 font-bold">{(parseFloat(redeemAmount) / 10).toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Exchange Rate:</span>
                <span className="text-gray-300">10 ARCS = 1 USDC</span>
              </div>
            </div>
          )}

          <button
            onClick={handleRedeemARCS}
            disabled={isRedeemPending || !redeemAmount || parseFloat(redeemAmount) <= 0 || parseFloat(redeemAmount) > houseARCS}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-500 hover:to-purple-400 transition-all"
          >
            {isRedeemPending ? '⏳ Redeeming...' : '💎 Redeem ARCS to USDC'}
          </button>
        </div>
      </div>

      {/* Deposit to House Pool Section */}
      <div className="bg-arc-card rounded-lg p-6 border border-blue-500/30">
        <div className="flex items-center mb-4">
          <div className="text-3xl mr-3">🏦</div>
          <div>
            <h2 className="text-xl font-bold text-blue-400">Add to House Pool</h2>
            <p className="text-sm text-gray-400">Deposit more USDC to increase house liquidity</p>
          </div>
        </div>

        {/* House Pool Address */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded p-4 mb-4">
          <div className="text-xs text-gray-400 mb-2">💼 House Pool Address (Send USDC here)</div>
          <div className="flex items-center gap-2 bg-arc-dark rounded p-3">
            <code className="text-sm text-blue-400 font-mono flex-1 break-all">{CONTRACTS.DEPOSIT_VAULT}</code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(CONTRACTS.DEPOSIT_VAULT)
                alert('House pool address copied to clipboard!')
              }}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white text-sm font-semibold transition-colors whitespace-nowrap"
            >
              📋 Copy
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            💡 You can send USDC directly to this address from any wallet to add to the house pool
          </div>
        </div>

        <div className="bg-arc-dark/50 rounded p-4 mb-4">
          <div className="text-sm">
            <span className="text-gray-500">Current House Pool:</span>
            <span className="text-blue-400 font-bold ml-2">{houseCapital.toFixed(2)} USDC</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Amount to Deposit (USDC)</label>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Enter USDC amount"
              className="w-full bg-arc-dark border border-blue-500/30 rounded px-4 py-3 text-white focus:outline-none focus:border-blue-400"
              disabled={isDepositPending}
            />
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Min: 0.1 USDC</span>
              <div className="space-x-2">
                <button
                  onClick={() => setDepositAmount('10')}
                  className="text-blue-400 hover:text-blue-300"
                  disabled={isDepositPending}
                >
                  +10 USDC
                </button>
                <button
                  onClick={() => setDepositAmount('50')}
                  className="text-blue-400 hover:text-blue-300"
                  disabled={isDepositPending}
                >
                  +50 USDC
                </button>
                <button
                  onClick={() => setDepositAmount('100')}
                  className="text-blue-400 hover:text-blue-300"
                  disabled={isDepositPending}
                >
                  +100 USDC
                </button>
              </div>
            </div>
          </div>

          {depositAmount && parseFloat(depositAmount) > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-gray-400">Current Pool:</span>
                <span className="text-white font-bold">{houseCapital.toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-400">Adding:</span>
                <span className="text-blue-400 font-bold">+{parseFloat(depositAmount).toFixed(2)} USDC</span>
              </div>
              <div className="border-t border-blue-500/30 mt-2 pt-2 flex justify-between">
                <span className="text-gray-400">New Pool Size:</span>
                <span className="text-green-400 font-bold">{(houseCapital + parseFloat(depositAmount)).toFixed(2)} USDC</span>
              </div>
            </div>
          )}

          <button
            onClick={handleDepositToHouse}
            disabled={isDepositPending || !depositAmount || parseFloat(depositAmount) <= 0}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-500 hover:to-blue-400 transition-all"
          >
            {isDepositPending ? '⏳ Depositing...' : '🏦 Add to House Pool'}
          </button>
        </div>

        <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded p-3 text-xs text-gray-400">
          <strong className="text-blue-400">💡 Tip:</strong> Larger house pool = can accept bigger bets and more simultaneous bets. Your deposited USDC is always withdrawable (except amount covering active bets).
        </div>
      </div>

      {/* Withdraw House Capital Section */}
      <div className="bg-arc-card rounded-lg p-6 border border-green-500/30">
        <div className="flex items-center mb-4">
          <div className="text-3xl mr-3">💰</div>
          <div>
            <h2 className="text-xl font-bold text-green-400">Withdraw House Capital</h2>
            <p className="text-sm text-gray-400">Transfer USDC from house vault to your wallet</p>
          </div>
        </div>

        <div className="bg-arc-dark/50 rounded p-4 mb-4">
          <div className="text-sm">
            <span className="text-gray-500">Available to Withdraw:</span>
            <span className="text-green-400 font-bold ml-2">{houseCapital.toFixed(2)} USDC</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Amount to Withdraw (USDC)</label>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Enter USDC amount"
              className="w-full bg-arc-dark border border-green-500/30 rounded px-4 py-3 text-white focus:outline-none focus:border-green-400"
              disabled={isWithdrawPending}
            />
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Min: 0.1 USDC</span>
              <button
                onClick={() => setWithdrawAmount(houseCapital.toString())}
                className="text-green-400 hover:text-green-300"
                disabled={isWithdrawPending}
              >
                Max: {houseCapital.toFixed(2)} USDC
              </button>
            </div>
          </div>

          <button
            onClick={handleWithdrawCapital}
            disabled={isWithdrawPending || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > houseCapital}
            className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-500 hover:to-green-400 transition-all"
          >
            {isWithdrawPending ? '⏳ Withdrawing...' : '💰 Withdraw USDC'}
          </button>
        </div>
      </div>

      {/* Mint ARCS Section */}
      <div className="bg-arc-card rounded-lg p-6 border border-purple-500/30">
        <div className="flex items-center mb-4">
          <div className="text-3xl mr-3">🪙</div>
          <div>
            <h2 className="text-xl font-bold text-purple-400">Mint ARCS Tokens</h2>
            <p className="text-sm text-gray-400">Increase ARCS supply in treasury wallet</p>
          </div>
        </div>

        <div className="bg-arc-dark/50 rounded p-4 mb-4">
          <div className="text-sm">
            <span className="text-gray-500">Current Treasury Balance:</span>
            <span className="text-purple-400 font-bold ml-2">{treasuryARCS.toLocaleString()} ARCS</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Amount to Mint (ARCS)</label>
            <input
              type="number"
              value={mintAmount}
              onChange={(e) => setMintAmount(e.target.value)}
              placeholder="Enter ARCS amount (e.g., 1000000)"
              className="w-full bg-arc-dark border border-purple-500/30 rounded px-4 py-3 text-white focus:outline-none focus:border-purple-400"
              disabled={isMintPending}
            />
            <div className="mt-2 text-xs text-gray-500">
              <span>Suggested: 1,000,000 ARCS or more</span>
            </div>
          </div>

          <button
            onClick={handleMintARCS}
            disabled={isMintPending || !mintAmount || parseFloat(mintAmount) <= 0}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-500 hover:to-purple-400 transition-all"
          >
            {isMintPending ? '⏳ Minting...' : '🪙 Mint ARCS to Treasury'}
          </button>
        </div>

        <div className="mt-4 bg-purple-500/10 border border-purple-500/20 rounded p-3 text-xs text-gray-400">
          <strong className="text-purple-400">💡 Note:</strong> Minted ARCS go directly to treasury wallet. Use this when you need more ARCS for user deposits/withdrawals or betting payouts.
        </div>
      </div>

      {/* Contract Addresses Section */}
      <div className="bg-arc-card rounded-lg p-6 border border-arc-primary/30">
        <div className="flex items-center mb-4">
          <div className="text-3xl mr-3">📋</div>
          <div>
            <h2 className="text-xl font-bold text-arc-primary">Contract Addresses</h2>
            <p className="text-sm text-gray-400">Important addresses for manual transactions</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-arc-dark/50 rounded p-3">
            <div className="text-xs text-gray-500 mb-1">DepositVault (Fund with USDC for redemptions)</div>
            <div className="flex items-center justify-between">
              <code className="text-sm text-green-400 font-mono">{CONTRACTS.DEPOSIT_VAULT}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(CONTRACTS.DEPOSIT_VAULT)
                  alert('DepositVault address copied!')
                }}
                className="text-xs bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-white transition-colors"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="bg-arc-dark/50 rounded p-3">
            <div className="text-xs text-gray-500 mb-1">Treasury Wallet (Holds all ARCS)</div>
            <div className="flex items-center justify-between">
              <code className="text-sm text-purple-400 font-mono">{CONTRACTS.TREASURY}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(CONTRACTS.TREASURY)
                  alert('Treasury address copied!')
                }}
                className="text-xs bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-white transition-colors"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="bg-arc-dark/50 rounded p-3">
            <div className="text-xs text-gray-500 mb-1">ARCS Token Contract</div>
            <div className="flex items-center justify-between">
              <code className="text-sm text-arc-primary font-mono">{CONTRACTS.ARCS_TOKEN}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(CONTRACTS.ARCS_TOKEN)
                  alert('ARCS Token address copied!')
                }}
                className="text-xs bg-arc-primary hover:bg-arc-secondary px-3 py-1 rounded text-white transition-colors"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="bg-arc-dark/50 rounded p-3">
            <div className="text-xs text-gray-500 mb-1">BettingEngine Contract</div>
            <div className="flex items-center justify-between">
              <code className="text-sm text-yellow-400 font-mono">{CONTRACTS.BETTING_ENGINE}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(CONTRACTS.BETTING_ENGINE)
                  alert('BettingEngine address copied!')
                }}
                className="text-xs bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-white transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded p-3 text-xs text-gray-400">
          <strong className="text-blue-400">💡 Tip:</strong> To fund DepositVault for user redemptions, send USDC directly to the DepositVault address from your wallet.
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="text-sm text-blue-400 font-bold mb-2">ℹ️ How It Works:</div>
        <ul className="text-sm text-gray-400 space-y-2">
          <li>✅ <strong>Add to House Pool:</strong> Deposit USDC to increase house liquidity and accept bigger bets</li>
          <li>✅ <strong>Redeem ARCS:</strong> Converts house ARCS (from winning bets) back to USDC automatically</li>
          <li>✅ <strong>Withdraw Capital:</strong> Transfers USDC from house vault to your wallet</li>
          <li>✅ <strong>Mint ARCS:</strong> Increase ARCS supply in treasury when needed</li>
          <li>✅ <strong>One Transaction:</strong> Option A redemption completes in a single step</li>
          <li>✅ <strong>Secure:</strong> Only contract owner can perform these actions</li>
        </ul>
      </div>
    </div>
  )
}
