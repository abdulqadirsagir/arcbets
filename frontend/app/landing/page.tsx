'use client'

import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="bg-gray-50">
      {/* Navigation */}
      <nav className="bg-gradient-to-b from-slate-900 to-slate-800 text-white py-4 px-6 fixed w-full top-0 z-50 border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg flex items-center justify-center font-bold text-white">
              A
            </div>
            <span className="text-xl font-bold">ArcSettle</span>
          </div>
          <div className="hidden md:flex space-x-8 text-sm">
            <a href="#home" className="hover:text-purple-400 transition">HOME</a>
            <a href="#about" className="hover:text-purple-400 transition">ABOUT</a>
            <a href="#features" className="hover:text-purple-400 transition">FEATURES</a>
            <Link href="/docs" className="hover:text-purple-400 transition">DOCS</Link>
          </div>
          <Link href="/">
            <button className="bg-gradient-to-r from-purple-600 to-purple-800 px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition">
              Launch App
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-slate-900 to-slate-800 text-white pt-32 pb-20 px-6 overflow-hidden" id="home">
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-white/5 backdrop-blur-sm border border-white/10 px-4 py-2 rounded-full mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-sm">Live on Arc Network Testnet</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Decentralized Binary Options<br/>
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Trading on Arc Network
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            Trade BTC & ETH price movements with transparent, on-chain settlements on Arc Network L1. 
            Powered by deterministic finality and native USDC for gas fees.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link href="/">
              <button className="bg-gradient-to-r from-purple-600 to-purple-800 px-8 py-4 rounded-lg font-semibold text-lg hover:opacity-90 transition transform hover:scale-105 shadow-lg">
                Launch App →
              </button>
            </Link>
            <a href="#about">
              <button className="border-2 border-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-gray-900 transition">
                Learn More
              </button>
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-xl hover:bg-white/10 transition cursor-pointer">
              <div className="text-2xl font-bold mb-2">Deposit USDC</div>
              <div className="text-gray-400 text-sm">Get ARCS Tokens</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-xl">
              <div className="text-3xl font-bold mb-2">Testnet</div>
              <div className="text-gray-400 text-sm">Arc Network Phase</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-xl">
              <div className="text-3xl font-bold mb-2">24/7</div>
              <div className="text-gray-400 text-sm">Market Availability</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-gray-50" id="features">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose ArcSettle?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built for traders who demand transparency, speed, and fairness in every trade.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl flex items-center justify-center mb-6 text-3xl">
                ⚡
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Instant Settlement</h3>
              <p className="text-gray-600 leading-relaxed">
                Win or lose, all bets are settled instantly with Arc Network's deterministic finality. 
                Real-time oracle pricing ensures fair outcomes. No delays, no disputes, no middlemen.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl flex items-center justify-center mb-6 text-3xl">
                🏦
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">House Pool System</h3>
              <p className="text-gray-600 leading-relaxed">
                Liquidity providers earn yield by backing the house. Deposit ARCS tokens and 
                earn a share of platform profits with transparent returns.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl flex items-center justify-center mb-6 text-3xl">
                🔒
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Transparent & Fair</h3>
              <p className="text-gray-600 leading-relaxed">
                Smart contract-powered betting with verifiable outcomes. All transactions 
                recorded on Arc Network L1 blockchain. Gas fees paid in native USDC for seamless trading.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Built With Industry-Leading Technology</h2>
            <p className="text-gray-600">Powered by the most trusted infrastructure in Web3</p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-12">
            <div className="flex flex-col items-center">
              <div className="text-4xl mb-2">⛓️</div>
              <div className="font-semibold text-gray-900">Arc Network</div>
              <div className="text-sm text-gray-500">L1 Blockchain</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-4xl mb-2">📊</div>
              <div className="font-semibold text-gray-900">CoinGecko</div>
              <div className="text-sm text-gray-500">Price Oracle</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-4xl mb-2">⚙️</div>
              <div className="font-semibold text-gray-900">Solidity</div>
              <div className="text-sm text-gray-500">Smart Contracts</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-4xl mb-2">⚛️</div>
              <div className="font-semibold text-gray-900">Next.js</div>
              <div className="text-sm text-gray-500">Frontend</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-4xl mb-2">🗄️</div>
              <div className="font-semibold text-gray-900">Supabase</div>
              <div className="text-sm text-gray-500">Database</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6 bg-gray-50" id="about">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">Simple, transparent, and decentralized</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-800 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Connect Wallet</h3>
              <p className="text-gray-600">Connect your Web3 wallet to get started</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-800 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Choose Asset</h3>
              <p className="text-gray-600">Select BTC or ETH and prediction direction</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-800 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Place Bet</h3>
              <p className="text-gray-600">Set duration and amount, then place your bet</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-800 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                4
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Auto Settle</h3>
              <p className="text-gray-600">Win or lose, settlement happens automatically</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-gradient-to-b from-slate-900 to-slate-800 text-white py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Start Trading?
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            Join the future of decentralized binary options trading today.
          </p>
          <Link href="/">
            <button className="bg-gradient-to-r from-purple-600 to-purple-800 px-10 py-4 rounded-lg font-semibold text-lg hover:opacity-90 transition transform hover:scale-105 shadow-2xl">
              Launch App Now →
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg flex items-center justify-center font-bold text-white">
                  A
                </div>
                <span className="text-xl font-bold text-white">ArcSettle</span>
              </div>
              <p className="text-sm">Decentralized binary options trading on Arc Network.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Documentation</a></li>
                <li><a href="https://github.com/abdulqadirsagir/arcsettle" className="hover:text-white transition">GitHub</a></li>
                <li><a href="#" className="hover:text-white transition">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition">Discord</a></li>
                <li><a href="#" className="hover:text-white transition">Telegram</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 ArcSettle. Built on Arc Network L1 with deterministic finality. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}