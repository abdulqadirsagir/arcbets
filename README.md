# Arc Binary Options - Decentralized Trading Platform

A complete decentralized binary options trading platform where users can bet on ETH/USD price movements with 60-second windows. Built on Arc Testnet with a dual-token system (USDC + ARCS).

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)

## 🎯 Features

- **60-Second Binary Options**: Fast-paced UP/DOWN betting on ETH/USD
- **Dual Token System**: USDC for betting, ARCS tokens for liquidity provision
- **House Pool**: Automated liquidity pool that takes opposite side of bets
- **Real-time Price Feeds**: Oracle service with CoinGecko integration
- **Modern UI**: Gradient design with TradingView charts
- **Admin Panel**: Oracle management and system monitoring

## 🏗️ Architecture

### Smart Contracts (Arc Testnet)
- **ARCSTokenV2**: Governance/liquidity token for house pool
- **DepositVaultV2**: ARCS token staking vault with shares system
- **BettingEngineARCSV2**: Core betting logic and settlement
- **PriceOracle**: On-chain price feed management

### Frontend (Next.js)
- Modern gradient UI with responsive design
- TradingView chart integration
- Real-time stats and active bets display
- Wallet integration with Wagmi/Viem

### Backend (Node.js + Supabase)
- Oracle service for price updates and bet settlement
- Historical price data storage
- Automated bet monitoring

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MetaMask wallet
- Arc Testnet USDC (for gas - [Arc faucet](https://faucet.testnet.arc.network))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/arc-binary-options.git
cd arc-binary-options

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies
cd backend
npm install
cd ..
```

### Configuration

1. **Create environment file**:
```bash
cp .env.example .env
```

2. **Fill in `.env`** with your values:
```env
ARC_RPC_URL=https://rpc.testnet.arc.network
PRIVATE_KEY=your_deployer_wallet_private_key

# Supabase (for backend)
SUPABASE_URL=your_supabase_url
SUPABASE_SECRET_KEY=your_supabase_secret_key

# Oracle wallet (different from deployer)
ORACLE_PRIVATE_KEY=your_oracle_wallet_private_key
```

3. **Set up Supabase**:
   - Create account at [supabase.com](https://supabase.com)
   - Run `backend/supabase-schema.sql` in SQL editor
   - Copy URL and service key to `.env`

### Deployment

```bash
# Deploy all V2 contracts
npx hardhat run scripts/deploy-arcs.js --network arc-testnet

# Copy output addresses to frontend/lib/contracts.ts
```

### Running the Application

```bash
# Terminal 1: Start oracle service
cd backend
npm start

# Terminal 2: Start frontend
cd frontend
npm run dev
```

Visit `http://localhost:3000`

## 📁 Project Structure

```
├── contracts/              # Solidity smart contracts
│   ├── ARCSTokenV2.sol
│   ├── DepositVaultV2.sol
│   ├── BettingEngineARCSV2.sol
│   └── PriceOracle.sol
├── scripts/               # Deployment scripts
│   ├── deploy-arcs.js
│   └── authorize-oracle.js
├── frontend/              # Next.js application
│   ├── app/              # App router pages
│   ├── components/       # React components
│   ├── lib/              # Contract configs & utils
│   └── styles/           # Global styles
├── backend/               # Oracle service
│   ├── oracle-service.js
│   └── supabase-schema.sql
└── test/                  # Contract tests
```

## 🎮 How to Use

1. **Connect Wallet**: Connect MetaMask to Arc Testnet
2. **Get Test Tokens**: Deposit ARCS tokens to house pool (admin)
3. **Place Bet**: Choose UP/DOWN, enter amount, confirm
4. **Wait 60s**: Watch the live countdown
5. **Settle**: Click settle button to claim winnings

## 🔧 Development

### Run Tests
```bash
npx hardhat test
```

### Deploy to Different Network
Update `hardhat.config.js` and run:
```bash
npx hardhat run scripts/deploy-arcs.js --network <network-name>
```

### Frontend Development
```bash
cd frontend
npm run dev
```

## 📊 Contract Addresses (Arc Testnet)

Current V2 deployment addresses can be found in `frontend/lib/contracts.ts`

## 🛡️ Security

- ⚠️ **Testnet Only**: This is deployed on testnet for testing purposes
- 🔐 **Audits**: Not audited - use at your own risk
- 🚫 **Not for Production**: This is a proof of concept

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

MIT License - see [LICENSE](LICENSE) file

## 🔗 Links

- **Arc Testnet Explorer**: https://testnet.arcscan.app
- **Arc Faucet**: https://faucet.testnet.arc.network
- **Supabase**: https://supabase.com
- **Hardhat**: https://hardhat.org

## 📧 Support

For issues and questions, please open a GitHub issue.

---

Built with ❤️ using Solidity, Next.js, and Arc Network
