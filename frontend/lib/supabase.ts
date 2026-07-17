import { createClient } from '@supabase/supabase-js'

let _supabase: ReturnType<typeof createClient> | null = null

function getSupabase() {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    if (!supabaseUrl || !supabasePublishableKey) {
      throw new Error('Supabase credentials not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
    }

    _supabase = createClient(supabaseUrl, supabasePublishableKey)
  }
  return _supabase
}

// Export a proxy that initializes on first use
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop, receiver) {
    const client = getSupabase()
    const value = Reflect.get(client, prop, receiver)
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  }
})

export interface PriceHistory {
  id: number
  asset: string
  price: string
  price_usd: number
  timestamp: string
  created_at: string
}

export interface Bet {
  bet_id: number
  user_address: string
  asset: string
  amount: string
  entry_price: string
  entry_price_usd: number
  duration: number
  multiplier: number
  is_long: boolean
  start_time: string
  end_time: string
  settled: boolean
  won: boolean | null
  final_price: string | null
  final_price_usd: number | null
  payout: string | null
  settled_at: string | null
  tx_hash: string | null
  created_at: string
}

export interface UserStats {
  user_address: string
  total_bets: number
  total_wagered: string
  total_won: number
  total_lost: number
  total_payout: string
  win_rate: number | null
  last_bet_at: string | null
  created_at: string
  updated_at: string
}

// Get latest prices
export async function getLatestPrices() {
  const { data, error } = await supabase
    .from('latest_prices')
    .select('*')
  
  if (error) throw error
  return data as PriceHistory[]
}

// Get user bets
export async function getUserBets(userAddress: string) {
  const { data, error } = await supabase
    .from('bets')
    .select('*')
    .eq('user_address', userAddress.toLowerCase())
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as Bet[]
}

// Get user stats
export async function getUserStats(userAddress: string) {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_address', userAddress.toLowerCase())
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data as UserStats | null
}

// Get leaderboard
export async function getLeaderboard(limit: number = 10) {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .limit(limit)
  
  if (error) throw error
  return data as UserStats[]
}

// Get active bets
export async function getActiveBets() {
  const { data, error } = await supabase
    .from('active_bets')
    .select('*')
    .limit(50)
  
  if (error) throw error
  return data as Bet[]
}
