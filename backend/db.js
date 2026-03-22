import pg from 'pg';
const { Pool } = pg;

// Configuration for high-performance pooling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { 
    // Required for Vercel Postgres / Neon / AWS RDS
    rejectUnauthorized: false 
  },
  // Advanced pooling settings for DeFi apps (Prevents "Too many clients" errors)
  max: 20,                // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait before timing out when connecting a new client
});

/**
 * Diagnostic: Listen for unexpected errors on idle clients
 * Essential for maintaining a "Beautiful & Robust" backend
 */
pool.on('error', (err) => {
  console.error('[Database] Unexpected error on idle client:', err.message);
  // Do not exit the process; let the pool handle reconnection
});

/**
 * Startup Check: Verify connection to Stacks Data Store
 */
const checkConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ [Database] Connected to Postgres: Ready for Chainhook events.');
    client.release();
  } catch (err) {
    console.error('❌ [Database] Connection failed:', err.message);
  }
};

checkConnection();

export default pool;
