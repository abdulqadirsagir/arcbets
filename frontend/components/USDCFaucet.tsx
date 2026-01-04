'use client'

import { useAccount } from 'wagmi'

export default function USDCFaucet() {
  const { isConnected } = useAccount()

  const handleGetUSDC = () => {
    window.open('https://faucet.circle.com', '_blank')
  }

  if (!isConnected) return null

  return (
    <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold mb-1">Need testnet USDC?</div>
          <div className="text-sm text-gray-400">Limit: One request per pairing of stablecoin and test network every 2 hours</div>
        </div>
        <button
          onClick={handleGetUSDC}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap"
        >
          Get USDC
        </button>
      </div>
    </div>
  )
}
