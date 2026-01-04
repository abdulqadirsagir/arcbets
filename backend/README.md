# Backend Oracle Service

This service fetches cryptocurrency prices from CoinGecko, stores them in Supabase, and updates the on-chain oracle.

## Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Supabase:**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL schema from `supabase-schema.sql` in the SQL editor
   - Copy your project URL and service key to `.env`

3. **Configure environment variables:**
   - Copy `.env.example` to `.env` in the root directory
   - Fill in all required values:
     - `ARC_RPC_URL`: Arc testnet RPC endpoint
     - `ORACLE_PRIVATE_KEY`: Private key for updating oracle (needs ETH for gas)
     - `ORACLE_ADDRESS`: Deployed oracle contract address
     - `SUPABASE_URL`: Your Supabase project URL
     - `SUPABASE_SECRET_KEY`: Your Supabase secret key
     - `COINGECKO_API_KEY`: (Optional) CoinGecko Pro API key

4. **Run the service:**
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

## How It Works

1. **Fetches prices** from CoinGecko API every 5 minutes
2. **Stores prices** in Supabase `price_history` table
3. **Updates on-chain oracle** with latest prices
4. **Tracks bets** and user statistics in Supabase

## Database Schema

- `price_history`: Historical price data
- `bets`: All placed bets with outcomes
- `user_stats`: Aggregated user statistics
- `house_pool_history`: House pool size over time

## API Endpoints (Future)

Can extend this to create REST API endpoints for:
- Get latest prices
- Get user bet history
- Get leaderboard
- Get house pool stats

## Monitoring

The service logs all operations to console. In production, consider adding:
- Proper logging (Winston, Pino)
- Error alerting (Sentry)
- Metrics (Prometheus)
- Health check endpoint
