import pg from 'pg';
const { Pool } = pg;

// 1. THE CRITICAL FIX: Clean the string before the Pool sees it
const rawUrl = process.env.DATABASE_URL || "";
const cleanUrl = rawUrl.trim().replace(/^["']|["']$/g, "");

const pool = new Pool({
  connectionString: cleanUrl, // Use the cleaned version here
  ssl: { 
    rejectUnauthorized: false 
  },
  max: 20,
  idleTimeoutMillis: 30000,
  // Increased to 5000ms because TCP Proxies (centerbeam.proxy) 
  // can be slightly slower to wake up than internal URLs
  connectionTimeoutMillis: 5000, 
});

/**
 * Diagnostic & Startup Check (Keep these - they are great!)
 */
pool.on('error', (err) => {
  console.error('[Database] Unexpected error on idle client:', err.message);
});

const checkConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ [Database] Connected to Postgres: Ready for Chainhook events.');
    client.release();
  } catch (err) {
    console.error('❌ [Database] Connection failed:', err.message);
    console.log('💡 Current URL being used (first 15 chars):', cleanUrl.substring(0, 15));
  }
};

checkConnection();

export default pool;
