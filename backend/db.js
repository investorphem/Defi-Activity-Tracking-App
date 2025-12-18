const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Vercel/Postgres URL
  ssl: { rejectUnauthorized: false }
});

module.exports = pool;