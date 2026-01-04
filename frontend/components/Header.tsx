'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { formatAddress } from '@/lib/utils'
import { useEffect, useState } from 'react'

export default function Header() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="border-b border-slate-800 mb-8">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🎲</div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-arc-primary to-arc-secondary bg-clip-text text-transparent">
                Arc Binary Options
              </h1>
              <p className="text-xs text-gray-400">Trade crypto price movements</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {!mounted ? (
              <div className="h-10 w-32 bg-slate-800 animate-pulse rounded-lg"></div>
            ) : isConnected && address ? (
              <>
                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
                  <span>Connected:</span>
                  <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg">
                    <span className="text-base">👛</span>
                    <span className="text-white font-mono">{formatAddress(address)}</span>
                  </div>
                </div>
                <button
                  onClick={() => disconnect()}
                  className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={() => connect({ connector: injected() })}
                className="bg-gradient-to-r from-arc-primary to-arc-secondary hover:opacity-90 px-6 py-2 rounded-lg font-semibold transition-opacity"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
