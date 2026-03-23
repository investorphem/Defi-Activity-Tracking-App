import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import helmet from 'helmet';
import pool from './db.js';

const app = express();
const httpServer = createServer(app);

// 1. Security & Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// 2. WebSocket for Real-Time Nakamoto Updates
const wss = new WebSocketServer({ server: httpServer });
function broadcast(data) {
  wss.clients.forEach((c) => c.readyState === 1 && c.send(JSON.stringify(data)));
}

/** * 3. API Key Sanitizer & Gate */
const RAW_KEY = process.env.API_KEY || "";
const API_KEY = RAW_KEY.trim().replace(/^["']|["']$/g, "");

const apiGate = (req, res, next) => {
  const providedKey = 
    req.headers['x-api-key'] || 
    req.headers['authorization']?.split(' ')[1] || 
    req.query.apiKey;

  if (providedKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// 4. Analytics Routes
app.get('/api/stats', apiGate, async (req, res) => {
  try {
    const [tvl, users, events] = await Promise.all([
      pool.query(`SELECT SUM(amount) FROM defi_events WHERE event_type='DEPOSIT'`),
      pool.query(`SELECT COUNT(DISTINCT sender) FROM defi_events`),
      pool.query(`SELECT * FROM defi_events ORDER BY created_at DESC LIMIT 15`)
    ]);

    res.json({ 
      tvl: tvl.rows[0]?.sum || 0, 
      users: users.rows[0]?.count || 0, 
      events: events.rows 
    });
  } catch (err) {
    console.error('📊 Stats Error:', err.message);
    res.status(500).json({ error: 'Database query failed' });
  }
});

/**
 * 4b. NEW ROUTE: TVL History for the Chart
 * Fixes the 404 error seen in your browser console
 */
app.get('/api/tvl-history', apiGate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') as date, 
        SUM(amount) as total 
      FROM defi_events 
      GROUP BY 1 
      ORDER BY 1 ASC 
      LIMIT 30
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('📈 History Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// 5. Chainhooks v2 Ingestion
app.post('/webhook/stacks-event', apiGate, async (req, res) => {
  const payload = req.body;
  try {
    if (payload.rollback && payload.rollback.length > 0) {
      for (const block of payload.rollback) {
        const txIds = block.transactions.map(t => t.transaction_identifier.hash);
        await pool.query(`DELETE FROM defi_events WHERE tx_id = ANY($1)`, [txIds]);
        console.log(`♻️ [Reorg] Rolled back ${txIds.length} transactions`);
      }
    }

    if (payload.apply && payload.apply.length > 0) {
      for (const block of payload.apply) {
        const blockHeight = block.block_identifier.index;
        for (const tx of block.transactions) {
          const event = {
            tx_id: tx.transaction_identifier.hash,
            protocol: 'STACKS-DEFI',
            event_type: tx.metadata?.kind?.data?.method?.toUpperCase() || 'TRANSFER',
            sender: tx.metadata.sender,
            amount: tx.metadata?.kind?.data?.amount || 0,
            asset: tx.metadata?.kind?.data?.asset || 'STX',
            block_height: blockHeight
          };

          await pool.query(
            `INSERT INTO defi_events (tx_id, protocol, event_type, sender, amount, asset, block_height)
             VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (tx_id) DO NOTHING`,
            Object.values(event)
          );
          broadcast({ type: 'LIVE_EVENT', ...event });
        }
      }
    }
    res.status(200).send('OK');
  } catch (err) {
    console.error('❌ Chainhook v2 Error:', err.message);
    res.status(500).send('Processing Error');
  }
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Stacks v2 Engine active on port ${PORT}`);
});
