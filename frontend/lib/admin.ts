/**
 * Admin Authentication Utilities
 * 
 * Uses wallet-based authentication - only contract owner can access admin functions
 */

import { CONTRACTS } from './contracts'

/**
 * Check if connected wallet is the admin (contract owner)
 * @param address Connected wallet address
 * @returns Promise<boolean> True if address is owner of any admin contract
 */
export async function isAdmin(address: string | undefined): Promise<boolean> {
  if (!address) return false
  
  try {
    // We'll check against HouseRiskVault owner (since that's what has admin functions)
    // This will be populated after we read from contract
    return false // Will be implemented with actual contract call
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

/**
 * Admin wallet addresses (for quick check without contract call)
 * Add your admin wallet addresses here after deployment
 */
export const ADMIN_ADDRESSES: Set<string> = new Set([
  // Add admin addresses in lowercase after deployment
  // Example: '0x1234...'.toLowerCase()
])

/**
 * Quick check if address is in admin list (client-side only, not secure)
 * @param address Wallet address to check
 */
export function isAdminAddress(address: string | undefined): boolean {
  if (!address) return false
  return ADMIN_ADDRESSES.has(address.toLowerCase())
}

/**
 * Format admin-only error message
 */
export function getAdminOnlyMessage(): string {
  return 'This action requires admin privileges. Please connect with the contract owner wallet.'
}
