-- Arc Binary Options Supabase Schema

-- Create price_history table
CREATE TABLE IF NOT EXISTS price_history (
    id BIGSERIAL PRIMARY KEY,
    asset VARCHAR(10) NOT NULL,
    price VARCHAR(50) NOT NULL, -- Store as string to handle big numbers
    price_usd DECIMAL(20, 8) NOT NULL, -- Human-readable price
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on timestamp for faster queries
CREATE INDEX IF NOT EXISTS idx_price_history_timestamp ON price_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_asset ON price_history(asset);
CREATE INDEX IF NOT EXISTS idx_price_history_asset_timestamp ON price_history(asset, timestamp DESC);

-- Create bets table (for tracking and analytics)
CREATE TABLE IF NOT EXISTS bets (
    bet_id BIGINT PRIMARY KEY,
    user_address VARCHAR(42) NOT NULL,
    asset VARCHAR(10) NOT NULL,
    amount VARCHAR(50) NOT NULL,
    entry_price VARCHAR(50) NOT NULL,
    entry_price_usd DECIMAL(20, 8) NOT NULL,
    duration BIGINT NOT NULL,
    multiplier INTEGER NOT NULL,
    is_long BOOLEAN NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    settled BOOLEAN NOT NULL DEFAULT FALSE,
    won BOOLEAN,
    final_price VARCHAR(50),
    final_price_usd DECIMAL(20, 8),
    payout VARCHAR(50),
    settled_at TIMESTAMPTZ,
    tx_hash VARCHAR(66),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for bets
CREATE INDEX IF NOT EXISTS idx_bets_user ON bets(user_address);
CREATE INDEX IF NOT EXISTS idx_bets_settled ON bets(settled);
CREATE INDEX IF NOT EXISTS idx_bets_end_time ON bets(end_time);
CREATE INDEX IF NOT EXISTS idx_bets_created_at ON bets(created_at DESC);

-- Create user_stats table
CREATE TABLE IF NOT EXISTS user_stats (
    user_address VARCHAR(42) PRIMARY KEY,
    total_bets INTEGER NOT NULL DEFAULT 0,
    total_wagered VARCHAR(50) NOT NULL DEFAULT '0',
    total_won INTEGER NOT NULL DEFAULT 0,
    total_lost INTEGER NOT NULL DEFAULT 0,
    total_payout VARCHAR(50) NOT NULL DEFAULT '0',
    win_rate DECIMAL(5, 2),
    last_bet_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create house_pool_history table
CREATE TABLE IF NOT EXISTS house_pool_history (
    id BIGSERIAL PRIMARY KEY,
    pool_size VARCHAR(50) NOT NULL,
    active_bets VARCHAR(50) NOT NULL,
    available_liquidity VARCHAR(50) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_house_pool_timestamp ON house_pool_history(timestamp DESC);

-- Create function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update when bet is settled
    IF NEW.settled = TRUE AND OLD.settled = FALSE THEN
        INSERT INTO user_stats (user_address, total_bets, total_wagered, total_won, total_lost, total_payout, last_bet_at)
        VALUES (
            NEW.user_address,
            1,
            NEW.amount,
            CASE WHEN NEW.won THEN 1 ELSE 0 END,
            CASE WHEN NOT NEW.won THEN 1 ELSE 0 END,
            COALESCE(NEW.payout, '0'),
            NEW.settled_at
        )
        ON CONFLICT (user_address) DO UPDATE SET
            total_bets = user_stats.total_bets + 1,
            total_wagered = (user_stats.total_wagered::BIGINT + NEW.amount::BIGINT)::VARCHAR,
            total_won = user_stats.total_won + CASE WHEN NEW.won THEN 1 ELSE 0 END,
            total_lost = user_stats.total_lost + CASE WHEN NOT NEW.won THEN 1 ELSE 0 END,
            total_payout = (user_stats.total_payout::BIGINT + COALESCE(NEW.payout::BIGINT, 0))::BIGINT::VARCHAR,
            win_rate = ROUND((user_stats.total_won + CASE WHEN NEW.won THEN 1 ELSE 0 END)::NUMERIC / (user_stats.total_bets + 1) * 100, 2),
            last_bet_at = NEW.settled_at,
            updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user stats
DROP TRIGGER IF EXISTS trigger_update_user_stats ON bets;
CREATE TRIGGER trigger_update_user_stats
    AFTER UPDATE ON bets
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats();

-- Create view for latest prices
CREATE OR REPLACE VIEW latest_prices AS
SELECT DISTINCT ON (asset) 
    asset,
    price,
    price_usd,
    timestamp
FROM price_history
ORDER BY asset, timestamp DESC;

-- Create view for active bets
CREATE OR REPLACE VIEW active_bets AS
SELECT *
FROM bets
WHERE settled = FALSE
ORDER BY end_time ASC;

-- Create view for leaderboard
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
    user_address,
    total_bets,
    total_won,
    total_lost,
    win_rate,
    total_payout,
    last_bet_at
FROM user_stats
WHERE total_bets > 0
ORDER BY total_payout::BIGINT DESC
LIMIT 100;

-- Enable Row Level Security (optional, for production)
-- ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE house_pool_history ENABLE ROW LEVEL SECURITY;

-- Create policies (example - adjust based on your needs)
-- CREATE POLICY "Allow public read access" ON price_history FOR SELECT USING (true);
-- CREATE POLICY "Allow public read access" ON bets FOR SELECT USING (true);
-- CREATE POLICY "Allow public read access" ON user_stats FOR SELECT USING (true);
