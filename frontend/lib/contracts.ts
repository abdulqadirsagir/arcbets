// ARCS Betting System Contract Configuration

export const CONTRACTS = {
  // V2 - Treasury Model (with Mint Function) - January 4, 2026
  // CORRECTED: Using actual deployed ARCS token that DepositVault and BettingEngine reference
  ARCS_TOKEN: process.env.NEXT_PUBLIC_ARCS_TOKEN_ADDRESS || '0x7f326a2c29B8dF38E162AC99E63Bfa3d8860aF4e',
  DEPOSIT_VAULT: process.env.NEXT_PUBLIC_DEPOSIT_VAULT_ADDRESS || '0x1412DA1926A1831D53B77Be8C841DAcf7C7E646C',
  BETTING_ENGINE: process.env.NEXT_PUBLIC_BETTING_ENGINE_ADDRESS || '0x3E2D445b11D988Ac411a324a6b73A9A925f5D1AC',
  ORACLE: process.env.NEXT_PUBLIC_ORACLE_ADDRESS || '0xa97B0b72234EF7aE9934D836581B4771fc3D3247',
  
  // Treasury (holds all ARCS, can mint more)
  TREASURY: '0x8E4d5727ba14f1C877610B36f39D9BC935a15D94',
  
  // Old contracts (V1 - no longer used)
  HOUSE_VAULT: process.env.NEXT_PUBLIC_HOUSE_VAULT_ADDRESS || '0x8c7754FA7011c94e2D4b93f6c63017661B2B9EFe',
  SYSTEM_SOLVENCY: process.env.NEXT_PUBLIC_SYSTEM_SOLVENCY_ADDRESS || '0x430f00C1DdAD58E3ceE9c8B3FC807048Ec0F07fF',
}

// ARCSTokenV2 ABI (ERC20-like with approve and mint)
export const ARCS_TOKEN_ABI = [
  {
    "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "address", "name": "spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

// DepositVaultV2 ABI - Treasury Model (V2)
export const DEPOSIT_VAULT_ABI = [
  {
    "inputs": [],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "arcsAmount", "type": "uint256" }],
    "name": "redeem",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "userDepositsUSDC",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalDepositsUSDC",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalPayoutsUSDC",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getContractBalance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTreasuryARCSBalance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getVaultStats",
    "outputs": [
      { "internalType": "uint256", "name": "deposits", "type": "uint256" },
      { "internalType": "uint256", "name": "payouts", "type": "uint256" },
      { "internalType": "int256", "name": "profit", "type": "int256" },
      { "internalType": "uint256", "name": "contractUSDC", "type": "uint256" },
      { "internalType": "uint256", "name": "treasuryARCS", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// BettingEngineARCS ABI
export const BETTING_ENGINE_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "asset", "type": "string" },
      { "internalType": "bool", "name": "isLong", "type": "bool" },
      { "internalType": "uint256", "name": "amountARCS", "type": "uint256" },
      { "internalType": "uint256", "name": "duration", "type": "uint256" }
    ],
    "name": "placeBet",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "betId", "type": "uint256" }],
    "name": "settleBet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "getUserBets",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "getUserActiveBets",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "betId", "type": "uint256" }],
    "name": "getBet",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "user", "type": "address" },
          { "internalType": "string", "name": "asset", "type": "string" },
          { "internalType": "bool", "name": "isLong", "type": "bool" },
          { "internalType": "uint256", "name": "amountARCS", "type": "uint256" },
          { "internalType": "uint256", "name": "entryPrice", "type": "uint256" },
          { "internalType": "uint256", "name": "exitPrice", "type": "uint256" },
          { "internalType": "uint256", "name": "startTime", "type": "uint256" },
          { "internalType": "uint256", "name": "endTime", "type": "uint256" },
          { "internalType": "uint256", "name": "multiplier", "type": "uint256" },
          { "internalType": "uint256", "name": "payoutARCS", "type": "uint256" },
          { "internalType": "bool", "name": "settled", "type": "bool" },
          { "internalType": "bool", "name": "won", "type": "bool" }
        ],
        "internalType": "struct BettingEngineARCSV2.Bet",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalActiveBetsARCS",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MIN_BET",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_BET",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// SystemSolvency ABI
export const SYSTEM_SOLVENCY_ABI = [
  {
    "inputs": [],
    "name": "getSystemOverview",
    "outputs": [
      { "internalType": "uint256", "name": "totalARCSCirculating", "type": "uint256" },
      { "internalType": "uint256", "name": "userReserveUSDC", "type": "uint256" },
      { "internalType": "uint256", "name": "houseCapitalUSDC", "type": "uint256" },
      { "internalType": "uint256", "name": "totalBackingUSDC", "type": "uint256" },
      { "internalType": "uint256", "name": "requiredUSDC", "type": "uint256" },
      { "internalType": "bool", "name": "isSolvent", "type": "bool" },
      { "internalType": "uint256", "name": "solvencyRatio", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getSystemHealth",
    "outputs": [
      { "internalType": "uint8", "name": "status", "type": "uint8" },
      { "internalType": "string", "name": "message", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "getUserInfo",
    "outputs": [
      { "internalType": "uint256", "name": "arcsBalance", "type": "uint256" },
      { "internalType": "uint256", "name": "usdcValue", "type": "uint256" },
      { "internalType": "uint256", "name": "totalDeposited", "type": "uint256" },
      { "internalType": "uint256", "name": "activeBetsCount", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// Oracle ABI (unchanged)
export const ORACLE_ABI = [
  {
    name: "getPrice",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "asset", type: "string" }],
    outputs: [
      { name: "price", type: "uint256" },
      { name: "lastUpdated", type: "uint256" }
    ],
  }
] as const

// Constants
export const DURATIONS = [
  { label: '1 Hour', value: 3600, multiplier: 1.5 },
  { label: '3 Hours', value: 10800, multiplier: 1.8 },
  { label: '6 Hours', value: 21600, multiplier: 2.0 },
  { label: '12 Hours', value: 43200, multiplier: 2.5 },
  { label: '24 Hours', value: 86400, multiplier: 3.0 },
  { label: '48 Hours', value: 172800, multiplier: 3.5 },
  { label: '7 Days', value: 604800, multiplier: 4.0 },
]

export const ASSETS = [
  { symbol: 'ETH', name: 'Ethereum', icon: '⟠' },
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
  { symbol: 'SOL', name: 'Solana', icon: '◎' },
]

// Exchange rate constant
export const ARCS_PER_USDC = 10
export const USDC_DECIMALS = 18
