import { createConfig, http } from 'wagmi'
import { defineChain } from 'viem'
import { injected } from 'wagmi/connectors'

// Arc Testnet official RPC only
const ARC_RPC = 'https://rpc.testnet.arc.network'

// Define Arc Testnet chain
export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  network: 'arc-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'USDC',
    symbol: 'USDC',
  },
  rpcUrls: {
    default: {
      http: [ARC_RPC],
    },
    public: {
      http: [ARC_RPC],
    },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
})

export const config = createConfig({
  chains: [arcTestnet],
  connectors: [
    injected({
      target() {
        return {
          id: 'injected',
          name: 'Injected',
          provider: typeof window !== 'undefined' ? window.ethereum : undefined,
        }
      },
    }),
  ],
  transports: {
    [arcTestnet.id]: http(ARC_RPC, {
      batch: false,
      retryCount: 5,
      retryDelay: 2000,
      timeout: 30000, // 30 seconds
    }),
  },
  ssr: true,
})
