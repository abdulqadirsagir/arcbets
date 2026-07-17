'use client'

export const dynamic = 'force-dynamic'

import Header from '@/components/Header'
import PriceDisplay from '@/components/PriceDisplay'
import HousePoolStatsARCS from '@/components/HousePoolStatsARCS'
import BettingInterfaceARCS from '@/components/BettingInterfaceARCS'
import DepositRedeem from '@/components/DepositRedeem'
import ActiveBets from '@/components/ActiveBets'
import AdminPanel from '@/components/AdminPanel'
import TradingViewChart from '@/components/TradingViewChart'
import { useState } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { CONTRACTS } from '@/lib/contracts'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'deposit' | 'bet' | 'history' | 'admin'>('deposit')
  const [selectedAsset, setSelectedAsset] = useState<string>('ETH')
  const { address } = useAccount()

  // Check if user is admin
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
  })

  const isAdmin = address && contractOwner && address.toLowerCase() === (contractOwner as string).toLowerCase()

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 pb-12">
        {/* Price Display */}
        <PriceDisplay />

        {/* House Pool Stats */}
        <HousePoolStatsARCS />

        {/* Tabs */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab('deposit')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'deposit'
                ? 'bg-neon-purple text-white shadow-neon'
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            💰 Deposit/Redeem
          </button>
          <button
            onClick={() => setActiveTab('bet')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'bet'
                ? 'bg-neon-purple text-white shadow-neon'
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            🎲 Place Bet
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-neon-purple text-white shadow-neon'
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            📊 My Bets
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-neon-purple to-neon-pink text-white shadow-neon-strong'
                  : 'bg-gradient-to-r from-purple-800 to-pink-800 text-gray-300 hover:from-purple-700 hover:to-pink-700'
              }`}
            >
              🛠️ Admin Panel
            </button>
          )}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeTab === 'deposit' && (
            <>
              <DepositRedeem />
              <div className="bg-arc-card border border-arc-primary/20 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">ℹ️ How It Works</h3>
                <div className="space-y-4 text-sm text-gray-300">
                  <div>
                    <div className="font-semibold text-arc-primary mb-1">1. Deposit USDC</div>
                    <p>Convert your USDC to ARCS chips at a fixed rate of 1 USDC = 10 ARCS</p>
                  </div>
                  <div>
                    <div className="font-semibold text-arc-primary mb-1">2. Place Bets</div>
                    <p>Use ARCS to bet on BTC, ETH, or SOL price movements</p>
                  </div>
                  <div>
                    <div className="font-semibold text-arc-primary mb-1">3. Win & Redeem</div>
                    <p>Redeem your ARCS back to USDC anytime (10 ARCS = 1 USDC)</p>
                  </div>
                  <div className="pt-4 border-t border-arc-primary/20">
                    <div className="text-xs text-gray-400">
                      💡 <strong>Tip:</strong> ARCS chips isolate your betting from real money, making it easier to manage risk and track performance.
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
          {activeTab === 'bet' && (
            <>
              <BettingInterfaceARCS onAssetChange={setSelectedAsset} />
              <div className="flex flex-col h-full min-h-[800px]">
                {/* Chart: 2/3 of height */}
                <div className="flex-[2]">
                  <TradingViewChart symbol={selectedAsset} />
                </div>
                {/* Quick Tips: 1/3 of height */}
                <div className="flex-[1] bg-arc-card border border-arc-primary/20 rounded-lg p-6 mt-4">
                  <h3 className="text-2xl font-bold text-white mb-6">📈 Quick Tips</h3>
                  <ul className="space-y-4 text-base text-gray-300">
                    <li className="flex items-start gap-3">
                      <span className="text-arc-primary text-lg">•</span>
                      <span>Choose your asset and predict if the price will go UP or DOWN</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-arc-primary text-lg">•</span>
                      <span>Longer durations = higher multipliers (up to 4x)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-arc-primary text-lg">•</span>
                      <span>Bets are settled automatically when the duration expires</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-arc-primary text-lg">•</span>
                      <span>All bets use ARCS chips, not USDC directly</span>
                    </li>
                  </ul>
                </div>
              </div>
            </>
          )}
          {activeTab === 'history' && (
            <div className="lg:col-span-2">
              <ActiveBets />
            </div>
          )}
          {activeTab === 'admin' && isAdmin && (
            <div className="lg:col-span-2">
              <AdminPanel />
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Arc Binary Options - Testnet Version</p>
          <p className="mt-1">Trade responsibly. This is experimental software on testnet.</p>
        </div>
      </main>
    </div>
  )
}
