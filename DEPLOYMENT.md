# Deployment Guide

## Prerequisites

Before deploying, ensure you have:
- ✅ Arbitrum Sepolia testnet ETH for gas
- ✅ Supabase account and project set up
- ✅ Private keys for deployer and oracle wallets
- ✅ GitHub repository created

## Step 1: Deploy Smart Contracts

### 1.1 Configure Environment

Create `.env` file in root:
```bash
ARC_RPC_URL=https://rpc.testnet.arc.network
PRIVATE_KEY=your_deployer_private_key
ORACLE_PRIVATE_KEY=your_oracle_private_key

SUPABASE_URL=your_supabase_url
SUPABASE_SECRET_KEY=your_supabase_secret_key
```

### 1.2 Deploy Contracts

```bash
# Compile contracts
npm run compile

# Deploy to Arc Testnet
npm run deploy
```

### 1.3 Update Frontend Addresses

Copy the deployed contract addresses from terminal output and update `frontend/lib/contracts.ts`:

```typescript
export const CONTRACTS = {
  ARCS_TOKEN: '0x...', // ARCSTokenV2 address
  DEPOSIT_VAULT: '0x...', // DepositVaultV2 address
  BETTING_ENGINE: '0x...', // BettingEngineARCSV2 address
  ORACLE: '0x...', // PriceOracle address
}
```

### 1.4 Authorize Oracle

```bash
npm run authorize-oracle
```

## Step 2: Set Up Backend (Oracle Service)

### 2.1 Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a project
2. In SQL Editor, run `backend/supabase-schema.sql`
3. Get your project URL and service key from Settings > API

### 2.2 Deploy Oracle Service

Options:
- **Railway**: Deploy from GitHub, set env variables
- **Heroku**: Deploy as Node.js app
- **VPS**: Run with PM2 or systemd

Environment variables needed:
```
ARC_RPC_URL=https://rpc.testnet.arc.network
ORACLE_PRIVATE_KEY=your_oracle_private_key
ORACLE_ADDRESS=deployed_oracle_contract_address
BETTING_ENGINE_ADDRESS=deployed_betting_engine_address
SUPABASE_URL=your_supabase_url
SUPABASE_SECRET_KEY=your_supabase_secret_key
UPDATE_INTERVAL=60000
```

### 2.3 Test Oracle

```bash
cd backend
npm start
```

Check logs for successful price updates.

## Step 3: Deploy Frontend to Vercel

### 3.1 Push to GitHub

```bash
# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit"

# Add remote and push
git remote add origin https://github.com/yourusername/arc-binary-options.git
git branch -M main
git push -u origin main
```

### 3.2 Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

5. Click "Deploy"

### 3.3 Environment Variables (Optional)

Vercel doesn't need environment variables since contract addresses are hardcoded in `contracts.ts`. 

If you want to use Supabase in frontend (optional):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3.4 Custom Domain (Optional)

In Vercel project settings:
1. Go to Settings > Domains
2. Add your custom domain
3. Update DNS records as instructed

## Step 4: Post-Deployment Testing

### 4.1 Test Smart Contracts

Visit Arc Testnet explorer and verify:
- ✅ All contracts deployed
- ✅ Oracle is authorized
- ✅ ARCS tokens minted
- ✅ House pool funded

### 4.2 Test Frontend

Visit your Vercel URL and test:
- ✅ Connect wallet works
- ✅ Price display updates
- ✅ Place bet works
- ✅ Settle bet works
- ✅ Stats display correctly

### 4.3 Test Oracle Service

Check oracle service logs:
- ✅ Fetching prices every minute
- ✅ Updating on-chain oracle
- ✅ Settling expired bets
- ✅ No errors

## Step 5: Monitoring

### Smart Contracts
- Monitor on [ArcScan Testnet](https://testnet.arcscan.app)
- Check transaction history
- Watch gas usage

### Oracle Service
- Monitor logs for errors
- Set up alerts for downtime
- Check Supabase for data consistency

### Frontend
- Vercel Analytics for usage
- Check browser console for errors
- Monitor user feedback

## Troubleshooting

### Deployment Fails
- Check all environment variables are set
- Ensure wallet has enough ETH for gas
- Verify RPC URL is correct

### Frontend Can't Connect
- Check contract addresses in `contracts.ts`
- Verify network is Arc Testnet (5042002)
- Check MetaMask network settings

### Oracle Service Issues
- Verify oracle is authorized on-chain
- Check oracle wallet has ETH for gas
- Verify Supabase connection

### Bets Not Settling
- Check oracle service is running
- Verify oracle has gas
- Check oracle authorization

## Security Checklist

- ✅ `.env` file is in `.gitignore`
- ✅ No private keys in code
- ✅ No secrets in frontend
- ✅ Environment variables secure
- ✅ Oracle wallet has limited funds
- ⚠️ This is testnet only - NOT production ready

## Next Steps

After successful deployment:
1. Fund house pool with ARCS tokens
2. Test with small bets first
3. Monitor for 24 hours
4. Gather user feedback
5. Iterate and improve

---

**Need Help?**
- Check GitHub Issues
- Review code documentation
- Test on local environment first
