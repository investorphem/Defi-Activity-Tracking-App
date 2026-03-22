import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pool from './db.js';

const app = express();
const httpServer = createServer(app);

// 1. High-End Security & Middleware
app.use(helmet()); // Protects against common web vulnerabilities
app.use(cors());   // Allows your Vercel frontend to talk to this backend
app.use(express.json());

// 2. Premium WebSocket Architecture
const wss = new WebSocketServer({ server: httpServer });

function broadcast(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(message);
  });
}

wss.on('connection', (ws) => {
  console.log('⚡ [WS] Client connected to live stream');
});

// 3. API Key & Rate Limiting (Protects your Stacks Data)
const apiGate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Invalid API Key' });
  }
  next();
};

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});

// 4. Advanced Analytics Routes
app.get('/api/stats', limiter, apiGate, async (req, res) => {
  try {
    // Parallel execution for maximum speed
    const [tvlRes, userRes, eventRes] = await Promise.all([
      pool.query(`SELECT SUM(amount) as total FROM defi_events WHERE event_type ILIKE 'deposit'`),
      pool.query(`SELECT COUNT(DISTINCT sender) as count FROM defi_events`),
      pool.query(`SELECT * FROM defi_events ORDER BY created_at DESC LIMIT 15`)
    ]);

    res.json({
      tvl: parseFloat(tvlRes.rows[0].total || 0),
      users: parseInt(userRes.rows[0].count || 0),
      events: eventRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Analytics Engine Error' });
  }
});

app.get('/api/tvl-history', limiter, apiGate, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') as day, 
        SUM(amount) OVER (ORDER BY DATE(created_at)) as tvl
      FROM defi_events
      GROUP BY DATE(created_at), amount, created_at
      ORDER BY day ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'History Engine Error' });
  }
});

app.get('/api/wallet/:address', limiter, apiGate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM defi_events WHERE sender = $1 OR tx_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.params.address]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Wallet Lookup Error' });
  }
});

// 5. Chainhook/Webhook Ingestion
app.post('/webhook/:type', apiGate, async (req, res) => {
  const { type } = req.params;
  const payload = req.body;

  try {
    // Process the event (simplified for brevity)
    const tx = payload.apply?.[0]?.transactions?.[0];
    if (!tx) return res.status(400).send('No TX found');

    const event = {
      tx_id: tx.transaction_identifier.hash,
      protocol: 'STACKS-DEFI',
      event_type: type.toUpperCase(),
      sender: tx.metadata.sender,
      amount: payload.metadata?.amount || 0,
      asset: payload.metadata?.asset || 'STX',
      block_height: payload.apply[0].block_identifier.index
    };

    await pool.query(
      `INSERT INTO defi_events (tx_id, protocol, event_type, sender, amount, asset, block_height)
       VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`,
      Object.values(event)
    );

    broadcast({ type: 'NEW_EVENT', ...event });
    res.status(200).send('Event Logged');
  } catch (err) {
    console.error('Webhook Error:', err);
    res.status(500).send('Processing Failed');
  }
});

// Start Server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`
  🚀 Stacks DeFi Engine Online
  📡 API: http://localhost:${PORT}/api
  ⚡ WS:  ws://localhost:${PORT}
  `);
});
