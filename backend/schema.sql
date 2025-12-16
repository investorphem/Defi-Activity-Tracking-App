CREATE TABLE defi_events (
  id SERIAL PRIMARY KEY,
  tx_id TEXT UNIQUE,
  protocol TEXT,
  event_type TEXT,
  sender TEXT,
  amount NUMERIC,
  asset TEXT,
  block_height INT,
  created_at TIMESTAMP DEFAULT NOW()
);
