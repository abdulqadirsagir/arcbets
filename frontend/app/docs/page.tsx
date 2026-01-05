'use client'

import Link from 'next/link'

export default function DocsPage() {
  return (
    <div className="bg-gray-50">
      {/* Navigation */}
      <nav className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-4 px-6 sticky top-0 z-50 border-b border-gray-700">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg flex items-center justify-center font-bold text-white">
              A
            </div>
            <span className="text-xl font-bold">ArcSettle Docs</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-sm hover:text-purple-400 transition">Home</Link>
            <a href="https://docs.arc.network/" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-r from-purple-600 to-purple-800 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition">
              Arc Network Docs →
            </a>
          </div>
        </div>
      </nav>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen sticky top-16 p-6 hidden md:block">
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Getting Started</h3>
            <a href="#introduction" className="sidebar-link block py-2 px-4 text-gray-700 rounded hover:bg-purple-50 hover:text-purple-700 transition">Introduction</a>
            <a href="#quick-start" className="sidebar-link block py-2 px-4 text-gray-700 rounded hover:bg-purple-50 hover:text-purple-700 transition">Quick Start</a>
            
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3 mt-6">Core Features</h3>
            <a href="#betting" className="sidebar-link block py-2 px-4 text-gray-700 rounded hover:bg-purple-50 hover:text-purple-700 transition">Binary Options Trading</a>
            <a href="#deposit-redeem" className="sidebar-link block py-2 px-4 text-gray-700 rounded hover:bg-purple-50 hover:text-purple-700 transition">Deposit & Redeem</a>
            <a href="#house-pool" className="sidebar-link block py-2 px-4 text-gray-700 rounded hover:bg-purple-50 hover:text-purple-700 transition">House Pool</a>
            
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3 mt-6">Technical</h3>
            <a href="#contracts" className="sidebar-link block py-2 px-4 text-gray-700 rounded hover:bg-purple-50 hover:text-purple-700 transition">Smart Contracts</a>
            <a href="#architecture" className="sidebar-link block py-2 px-4 text-gray-700 rounded hover:bg-purple-50 hover:text-purple-700 transition">Architecture</a>
            
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3 mt-6">Resources</h3>
            <a href="#faq" className="sidebar-link block py-2 px-4 text-gray-700 rounded hover:bg-purple-50 hover:text-purple-700 transition">FAQ</a>
            <a href="#support" className="sidebar-link block py-2 px-4 text-gray-700 rounded hover:bg-purple-50 hover:text-purple-700 transition">Support</a>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 pb-20">
          {/* Hero Banner */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-8 mb-8 text-white">
            <h1 className="text-4xl font-bold mb-3">Welcome to ArcSettle Documentation</h1>
            <p className="text-lg opacity-90 mb-4">Learn how to trade binary options on Arc Network L1 with deterministic finality and native USDC gas fees.</p>
            <a href="https://docs.arc.network/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center bg-white text-purple-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
              <span>View Arc Network Official Docs</span>
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
              </svg>
            </a>
          </div>

          {/* Introduction */}
          <section id="introduction" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Introduction</h2>
            <div className="prose max-w-none">
              <p className="text-gray-600 mb-4">
                ArcSettle is a decentralized binary options trading platform built on <strong>Arc Network L1</strong>. 
                It allows users to speculate on the price movements of BTC and ETH with transparent, on-chain settlements.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                <p className="text-blue-800">
                  <strong>Note:</strong> ArcSettle is currently deployed on <strong>Arc Network Testnet</strong>. 
                  All transactions use testnet USDC and ARCS tokens.
                </p>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">Key Features</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li><strong>Deterministic Finality:</strong> Instant settlement with Arc Network&apos;s fast finality</li>
                <li><strong>Native USDC Gas Fees:</strong> Pay gas fees in USDC, not ETH</li>
                <li><strong>Real-time Oracle Pricing:</strong> CoinGecko price feeds updated every 5 minutes</li>
                <li><strong>House Pool System:</strong> Deposit ARCS tokens to earn yield as a liquidity provider</li>
                <li><strong>Transparent On-Chain:</strong> All bets and settlements recorded on Arc Network blockchain</li>
              </ul>
            </div>
          </section>

          {/* Quick Start Section - Continuing... */}
          <section id="quick-start" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Quick Start</h2>
            
            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">1. Connect Your Wallet</h3>
            <p className="text-gray-600 mb-4">
              Connect your Web3 wallet (MetaMask, WalletConnect, etc.) to Arc Network Testnet.
            </p>
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Arc Network Testnet Details:</p>
              <div className="bg-slate-900 rounded-lg p-4">
                <code className="text-gray-200 text-sm">
                  Network Name: Arc Testnet<br/>
                  RPC URL: https://rpc.testnet.arc.network<br/>
                  Chain ID: 5555<br/>
                  Currency Symbol: ARC<br/>
                  Block Explorer: https://explorer.testnet.arc.network
                </code>
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">2. Get Testnet USDC</h3>
            <p className="text-gray-600 mb-4">
              You&apos;ll need testnet USDC to deposit and get ARCS tokens for trading.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">3. Deposit USDC for ARCS</h3>
            <p className="text-gray-600 mb-4">
              Use the Deposit interface to exchange USDC for ARCS tokens at a 1:1 ratio.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">4. Start Trading</h3>
            <p className="text-gray-600 mb-4">
              Choose an asset (BTC/ETH), select UP or DOWN, set duration, and place your bet!
            </p>
          </section>

          {/* Contracts Section with Real Addresses */}
          <section id="contracts" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Smart Contracts</h2>
            
            <p className="text-gray-600 mb-4">
              All ArcSettle contracts are deployed on Arc Network Testnet and verified on the block explorer.
            </p>

            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
              <h4 className="font-bold text-gray-900 mb-3">Contract Addresses (Arc Network Testnet):</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-gray-700">ARCS Token:</p>
                  <div className="bg-slate-900 rounded p-2 mt-1">
                    <code className="text-gray-200 text-xs">0x7f326a2c29B8dF38E162AC99E63Bfa3d8860aF4e</code>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Betting Engine:</p>
                  <div className="bg-slate-900 rounded p-2 mt-1">
                    <code className="text-gray-200 text-xs">0x3E2D445b11D988Ac411a324a6b73A9A925f5D1AC</code>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Deposit Vault:</p>
                  <div className="bg-slate-900 rounded p-2 mt-1">
                    <code className="text-gray-200 text-xs">0x1412DA1926A1831D53B77Be8C841DAcf7C7E646C</code>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Price Oracle:</p>
                  <div className="bg-slate-900 rounded p-2 mt-1">
                    <code className="text-gray-200 text-xs">0xa97B0b72234EF7aE9934D836581B4771fc3D3247</code>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Treasury:</p>
                  <div className="bg-slate-900 rounded p-2 mt-1">
                    <code className="text-gray-200 text-xs">0x8E4d5727ba14f1C877610B36f39D9BC935a15D94</code>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-gray-600 mb-4">
              <a href="https://github.com/abdulqadirsagir/arcsettle" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                View source code on GitHub →
              </a>
            </p>
          </section>

          {/* FAQ */}
          <section id="faq" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-bold text-gray-900 mb-2">Is this on mainnet?</h4>
                <p className="text-gray-600">No, ArcSettle is currently deployed on Arc Network Testnet. All tokens are testnet tokens with no real value.</p>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-bold text-gray-900 mb-2">How do I get testnet USDC?</h4>
                <p className="text-gray-600">You can request testnet USDC through Arc Network faucets or community channels.</p>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-bold text-gray-900 mb-2">What&apos;s the minimum bet amount?</h4>
                <p className="text-gray-600">The minimum bet amount is 1 ARCS token.</p>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-bold text-gray-900 mb-2">Can I cancel a bet?</h4>
                <p className="text-gray-600">No, once a bet is placed on-chain, it cannot be cancelled. It will settle automatically at expiry.</p>
              </div>
            </div>
          </section>

          {/* Support */}
          <section id="support" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Support</h2>
            
            <p className="text-gray-600 mb-6">
              Need help? Have questions? We&apos;re here to assist!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-bold text-gray-900 mb-3">📚 Documentation</h4>
                <p className="text-gray-600 mb-4">Visit Arc Network&apos;s official documentation for network details.</p>
                <a href="https://docs.arc.network/" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                  Arc Network Docs →
                </a>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-bold text-gray-900 mb-3">💻 GitHub</h4>
                <p className="text-gray-600 mb-4">View source code, report issues, and contribute.</p>
                <a href="https://github.com/abdulqadirsagir/arcsettle" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                  GitHub Repository →
                </a>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-gray-200 pt-8 mt-12 text-center text-gray-500 text-sm">
            <p>&copy; 2026 ArcSettle. Built on Arc Network L1 with deterministic finality.</p>
          </div>
        </main>
      </div>
    </div>
  )
}