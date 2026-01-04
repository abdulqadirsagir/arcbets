require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { ethers } = require('ethers');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron');

// Configuration
const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';
const UPDATE_INTERVAL = process.env.UPDATE_INTERVAL || 300000; // 5 minutes default
const ASSETS = {
  'ETH': 'ethereum',
  'BTC': 'bitcoin',
  'SOL': 'solana'
};

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

// Initialize ethers provider and wallet
const provider = new ethers.JsonRpcProvider(process.env.ARC_RPC_URL);
const wallet = new ethers.Wallet(process.env.ORACLE_PRIVATE_KEY, provider);

// Oracle contract ABI (minimal)
const oracleABI = [
  "function updatePrice(string memory asset, uint256 price) external",
  "function updatePrices(string[] memory assets, uint256[] memory priceList) external",
  "function getPrice(string memory asset) external view returns (uint256, uint256)"
];

const oracleContract = new ethers.Contract(
  process.env.ORACLE_ADDRESS,
  oracleABI,
  wallet
);

/**
 * Fetch prices from CoinGecko
 */
async function fetchPricesFromCoinGecko() {
  try {
    const ids = Object.values(ASSETS).join(',');
    const response = await axios.get(COINGECKO_API, {
      params: {
        ids,
        vs_currencies: 'usd'
      },
      headers: process.env.COINGECKO_API_KEY ? {
        'x-cg-pro-api-key': process.env.COINGECKO_API_KEY
      } : {}
    });

    const prices = {};
    for (const [symbol, coinId] of Object.entries(ASSETS)) {
      if (response.data[coinId] && response.data[coinId].usd) {
        // Convert to 8 decimals format (like Chainlink)
        prices[symbol] = Math.floor(response.data[coinId].usd * 1e8);
      }
    }

    console.log('Fetched prices:', prices);
    return prices;
  } catch (error) {
    console.error('Error fetching prices from CoinGecko:', error.message);
    throw error;
  }
}

/**
 * Store prices in Supabase
 */
async function storePricesInSupabase(prices) {
  try {
    const timestamp = new Date().toISOString();
    const records = [];

    for (const [asset, price] of Object.entries(prices)) {
      records.push({
        asset,
        price: price.toString(),
        price_usd: price / 1e8, // Store human-readable price too
        timestamp
      });
    }

    const { data, error } = await supabase
      .from('price_history')
      .insert(records);

    if (error) throw error;
    console.log('Stored prices in Supabase');
  } catch (error) {
    console.error('Error storing prices in Supabase:', error.message);
  }
}

/**
 * Update prices on-chain
 */
async function updateOracleOnChain(prices) {
  try {
    const assets = Object.keys(prices);
    const priceValues = Object.values(prices);

    console.log('Updating oracle on-chain...');
    console.log('Assets:', assets);
    console.log('Prices:', priceValues);

    const tx = await oracleContract.updatePrices(assets, priceValues);
    console.log('Transaction sent:', tx.hash);

    const receipt = await tx.wait();
    console.log('Transaction confirmed in block:', receipt.blockNumber);
    console.log('Gas used:', receipt.gasUsed.toString());

    return receipt;
  } catch (error) {
    console.error('Error updating oracle on-chain:', error.message);
    throw error;
  }
}

/**
 * Main update function
 */
async function updatePrices() {
  console.log('\n' + '='.repeat(60));
  console.log(`[${new Date().toISOString()}] Starting price update...`);
  console.log('='.repeat(60));

  try {
    // 1. Fetch prices from CoinGecko
    const prices = await fetchPricesFromCoinGecko();

    // 2. Store in Supabase
    await storePricesInSupabase(prices);

    // 3. Update on-chain oracle
    await updateOracleOnChain(prices);

    console.log('✅ Price update completed successfully\n');
  } catch (error) {
    console.error('❌ Price update failed:', error.message, '\n');
  }
}

/**
 * Get latest prices from Supabase
 */
async function getLatestPrices() {
  try {
    const { data, error } = await supabase
      .from('price_history')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(3);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching latest prices:', error.message);
    return null;
  }
}

/**
 * Initialize service
 */
async function init() {
  console.log('🚀 Arc Binary Options Oracle Service');
  console.log('=====================================');
  console.log('Network:', process.env.ARC_RPC_URL);
  console.log('Oracle Address:', process.env.ORACLE_ADDRESS);
  console.log('Update Interval:', UPDATE_INTERVAL, 'ms');
  console.log('Wallet Address:', wallet.address);
  console.log('=====================================\n');

  // Check wallet balance
  const balance = await provider.getBalance(wallet.address);
  console.log('Wallet balance:', ethers.formatEther(balance), 'ETH');

  if (balance === 0n) {
    console.warn('⚠️  WARNING: Wallet has no funds for gas fees!');
  }

  // Run initial update
  await updatePrices();

  // Schedule recurring updates (every 5 minutes)
  cron.schedule('*/5 * * * *', async () => {
    await updatePrices();
  });

  console.log('✅ Oracle service started successfully');
  console.log('📊 Prices will be updated every 5 minutes\n');
}

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down oracle service...');
  process.exit(0);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});

// Start the service
init().catch((error) => {
  console.error('Failed to start oracle service:', error);
  process.exit(1);
});

// Export for testing
module.exports = {
  fetchPricesFromCoinGecko,
  storePricesInSupabase,
  updateOracleOnChain,
  getLatestPrices
};
