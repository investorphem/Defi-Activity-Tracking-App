import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import helmet from 'helmet';
import crypto from 'crypto'; // 1. Added for signature verification
import pool from './db.js';

const app = express();
const httpServer = createServer(app);

// 2. Middleware Upgrade: We need the raw body buffer to verify the signature
app.use(helmet());
app.use(cors());
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// 3. WebSocket for Real-Time Updates
const wss = new WebSocketServer({ server: httpServer });
function broadcast(data) {
  wss.clients.forEach((c) => c.readyState === 1 && c.send(JSON.stringify(data)));
}

/** * 4. THE SECURITY GATE
 * Uses your secret: 75d45cf84b5395ed87fdc627b08d46d2aebf02ae4debeefb4050daad684fbb60
 */
const API_KEY = (process.env.API_KEY || "").trim().replace(/^["']|["']$/g, "");

const apiGate = (req, res, next) => {
  const signature = req.headers['x-chainhook-signature']; // Hiro v2 Signature
  const browserKey = req.headers['x-api-key'] || req.query.apiKey; // Frontend fallback

  // CASE A: It's a GET request from your Vercel Dashboard
  if (req.method === 'GET') {
    if (browserKey === API_KEY) return next();
    console.log("⚠️ UI Auth Blocked");
    return res.status(401).json({ error: 'Unauthorized UI Access' });
  }

  // CASE B: It's a POST from Hiro (Signature Verification)
  if (signature && req.rawBody) {
    const hmac = crypto.createHmac('sha256', API_KEY);
    const digest = hmac.update(req.rawBody).digest('hex');

    if (signature === digest) {
      return next(); // SUCCESS! The signature is valid.
    } else {
      console.log("❌ Signature Mismatch! Keys do not match.");
      return res.status(401).json({ error: 'Invalid Signature' });
    }
  }

  console.log("❌ No Credentials Provided");
  return res.status(401).json({ error: 'Unauthorized' });
};

// 5. Analytics Routes
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
    console.error('📊 Stats Error:', err.message);
    res.status(500).json({ error: 'Database query failed' });
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
    res.status(500).json({ error: 'History Error' });
  }
});

// 6. Chainhooks v2 Ingestion
app.post('/webhook/stacks-event', apiGate, async (req, res) => {
  const payload = req.body;
  try {
    if (payload.apply && payload.apply.length > 0) {
      for (const block of payload.apply) {
        const blockHeight = block.block_identifier.index;
        for (const tx of block.transactions) {
          const meta = tx.metadata?.kind?.data || tx.metadata || {};
          const event = {
            tx_id: tx.transaction_identifier.hash,
            protocol: 'STACKS-DEFI',
            event_type: (meta.method || tx.metadata?.kind?.type || 'TRANSACTION').toUpperCase(),
            sender: tx.metadata?.sender || 'STX_ACCOUNT',
            amount: parseFloat(meta.amount || meta.value || 0),
            asset: meta.asset || 'STX',
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
      console.log(`📦 Verified & Processed ${payload.apply.length} blocks from Hiro`);
    }
    res.status(200).send('OK');
  } catch (err) {
    console.error('❌ Chainhook Error:', err.message);
    res.status(500).send('Processing Error');
  }
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Engine active. Key starting with: ${API_KEY.substring(0,4)}`);
});
