-- 1. Enable Citext for case-insensitive address lookups (standard in Stacks/DeFi)
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS defi_events (
    id SERIAL PRIMARY KEY,
    
    -- Using CITEXT for addresses so 'ST123...' and 'st123...' match automatically
    tx_id TEXT UNIQUE NOT NULL,
    protocol VARCHAR(50) DEFAULT 'STACKS',
    event_type VARCHAR(50) NOT NULL,
    sender CITEXT NOT NULL,
    
    -- Stacks (STX) has 6 decimals. 
    -- NUMERIC(38, 0) is a DeFi standard for storing 'micro-units' (raw integers)
    -- to avoid any floating point math errors.
    amount NUMERIC(38, 0) DEFAULT 0,
    asset TEXT DEFAULT 'STX',
    
    block_height BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. ADVANCED INDEXING STRATEGY
-- Essential for the "Recent Activity" and "Wallet Page" speed

-- Fast lookup for individual wallet history
CREATE INDEX IF NOT EXISTS idx_events_sender ON defi_events USING btree (sender);

-- Fast lookup for the dashboard's "Recent Events" table
CREATE INDEX IF NOT EXISTS idx_events_created_at ON defi_events (created_at DESC);

-- Fast aggregation for TVL (Total Value Locked) calculations
CREATE INDEX IF NOT EXISTS idx_events_type_amount ON defi_events (event_type) INCLUDE (amount);
