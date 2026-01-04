import { formatUnits } from 'ethers'

export function formatUSDC(amount: bigint | string): string {
  const value = typeof amount === 'string' ? BigInt(amount) : amount
  return formatUnits(value, 18) // Native USDC on Arc has 18 decimals
}

export function formatPrice(price: bigint | string): string {
  const value = typeof price === 'string' ? BigInt(price) : price
  return formatUnits(value, 8)
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatDuration(seconds: number): string {
  if (seconds < 3600) {
    return `${seconds / 60}m`
  } else if (seconds < 86400) {
    return `${seconds / 3600}h`
  } else {
    return `${seconds / 86400}d`
  }
}

export function formatTimeRemaining(endTime: number): string {
  const now = Math.floor(Date.now() / 1000)
  const remaining = endTime - now
  
  if (remaining <= 0) {
    return 'Ended'
  }
  
  const days = Math.floor(remaining / 86400)
  const hours = Math.floor((remaining % 86400) / 3600)
  const minutes = Math.floor((remaining % 3600) / 60)
  
  if (days > 0) {
    return `${days}d ${hours}h`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
