import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import helmet from 'helmet';
import crypto from 'crypto';
import pool from './db.js';

const app = express();
const httpServer = createServer(app);

/**
 * 1. MIDDLEWARE CONFIGURATION
 * We increase the limit to 20mb to fix the "413 Payload Too Large" error.
 * We also capture the rawBody buffer for Hiro's signature verification.
 */
app.use(helmet());
app.use(cors());
app.use(express.json({
  limit: '20mb', 
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// 2. WebSocket for Real-Time Dashboard Updates
const wss = new WebSocketServer({ server: httpServer });
function broadcast(data) {
  wss.clients.forEach((c) => c.readyState === 1 && c.send(JSON.stringify(data)));
}

/** * 3. SECURITY GATE (v2 Signing Secret)
 * Railway Variable: API_KEY 
 * Value: 75d45cf84b5395ed87fdc627b08d46d2aebf02ae4debeefb4050daad684fbb60
 */
const SIGNING_SECRET = (process.env.API_KEY || "").trim().replace(/^["']|["']$/g, "");

const apiGate = (req, res, next) => {
  const signature = req.headers['x-chainhook-signature']; // From Hiro
  const browserKey = req.headers['x-api-key'] || req.query.apiKey; // From Vercel

  // CASE A: GET request from your Vercel Website
  if (req.method === 'GET') {
    if (browserKey === SIGNING_SECRET) return next();
    return res.status(401).json({ error: 'Unauthorized Dashboard Access' });
  }

  // CASE B: POST request from Hiro Chainhooks
  if (signature && req.rawBody) {
    const hmac = crypto.createHmac('sha256', SIGNING_SECRET);
    const digest = hmac.update(req.rawBody).digest('hex');

    if (signature === digest) {
      return next(); // Key matches!
    }
    console.log("❌ Signature Mismatch! Data rejected.");
    return res.status(401).json({ error: 'Invalid Signature' });
  }

  return res.status(401).json({ error: 'No Credentials' });
};

// 4. ANALYTICS ROUTES
app.get('/api/stats', apiGate, async (req, res) => {
  try {
    const [tvl, users, events] = await Promise.all([
      pool.query(`SELECT COALESCE(SUM(amount), 0) as sum FROM defi_events`),
      pool.query(`SELECT COUNT(DISTINCT sender) as count FROM defi_events`),
      pool.query(`SELECT * FROM defi_events ORDER BY created_at DESC LIMIT 15`)
    ]);
    res.json({ 
      tvl: parseFloat(tvl.rows[0]?.sum || 0), 
      users: parseInt(users.rows[0]?.count || 0), 
      events: events.rows 
    });
  } catch (err) {
    res.status(500).json({ error: 'Stats Sync Failed' });
  }
});

app.get('/api/tvl-history', apiGate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as date, SUM(amount) as total 
      FROM defi_events GROUP BY 1 ORDER BY 1 ASC LIMIT 30
    `);
    res.json(result.rows.map(row => ({ date: row.date, total: parseFloat(row.total || 0) })));
  } catch (err) {
    res.status(500).json({ error: 'History Sync Failed' });
  }
});

/**
 * 🚀 NEW: PERSONAL ACTIVITY ROUTE
 * Gets transactions for a specific connected wallet
 */
app.get('/api/my-activity', apiGate, async (req, res) => {
  const userAddress = req.query.address;

  if (!userAddress) {
    return res.status(400).json({ error: 'Missing address' });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM defi_events 
       WHERE sender = $1 
       ORDER BY created_at DESC 
       LIMIT 50`, 
      [userAddress]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ User Activity Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch your transactions' });
  }
});

// 5. CHAINHOOK WEBHOOK (The Data Ingestion)
app.post('/webhook/stacks-event', apiGate, async (req, res) => {
  const payload = req.body;
  try {
    if (payload.apply && payload.apply.length > 0) {
      let count = 0;
      for (const block of payload.apply) {
        for (const tx of block.transactions) {
          const meta = tx.metadata?.kind?.data || tx.metadata || {};
          const event = {
            tx_id: tx.transaction_identifier.hash,
            protocol: 'STACKS-DEFI',
            event_type: (meta.method || tx.metadata?.kind?.type || 'TRANSACTION').toUpperCase(),
            sender: tx.metadata?.sender || 'STX_ACCOUNT',
            amount: parseFloat(meta.amount || meta.value || 0),
            asset: meta.asset || 'STX',
            block_height: block.block_identifier.index
          };

          await pool.query(
            `INSERT INTO defi_events (tx_id, protocol, event_type, sender, amount, asset, block_height)
             VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (tx_id) DO NOTHING`,
            Object.values(event)
          );
          count++;
          broadcast({ type: 'LIVE_EVENT', ...event });
        }
      }
      console.log(`✅ Success: Processed ${count} transactions from Hiro.`);
    }
    res.status(200).send('OK');
  } catch (err) {
    console.error('❌ Webhook Error:', err.message);
    res.status(500).send('Processing Error');
  }
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Stacks Backend Live on port ${PORT}`);
  console.log(`🛡️ Payload limit set to 20MB.`);
});
