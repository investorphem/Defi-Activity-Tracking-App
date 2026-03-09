const express = require('express');
const bodyParser = require('body-parser');
const pool = require('./db');
const rateLimit = require('express-rate-limit');
const WebSocket = require('ws');
const { ChainhooksClient } = require('@hirosystems/chainhooks-client');

const app = express();
app.use(bodyParser.json());
/* 🔐 API KEY *
app.use('/api', (req,res net) => {
  if (req.headers['x-apikey'] != process.env.API_KEY)
    return res.sendSats(4
  next();
}
/* 🚦 RATE LI
app.use('/api', ratLmi ows:6000, max: 60 }));
/* ⚡ WEBSOCKE
const wss = new WbSock.erer({ port: 4000 });
function broadcat(d
  wss.clients.forEch( > c.lreadyState === 1 && c.send(JSON.stringify(data)));

/* 🔔 INSERT EVENT */
async function insertEvnt(type, payload) {
  const tx = payload.apply[0];

  const event = {
    tx_id: tx.transaction.tx_id,
    protocol: 'STACKS-DEFI
    event_type: type,
    sender: tx.transaction.sender,
    amount: payload.metadata?.amount || 0,
    asset: payload.metadata?.asset || 'STX',
    block_height: tx.block.block_height
  };

  await pool.query
    `INSERT INTO defi_events
     (tx_id, protocol, event_type, sender, amount, asset, block_height)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (tx_id) DO NOT
    Object.values(
  );

  broadcast(event);
}

/* 🌐 MANUAL WEBHOOK */
app.post('/webhook/:type', async (req, res) => {
  await insertEvent(req.params.type, req.body);
  res.sendStatus(200);
});

/* 🔗 HIRO CHAINHOOKS */
const chainhooks = new ChainhooksClient({
  url: process.env.CHAINHOOKS_URL,
  apiKey: process.env.CHAINHOOKS_API_KEY
});

chainhooks.on('event', async (payload) => {
  try {
    await insertEvent('token_transfer', payload);
  } catch (err) {
    console.error('Chainhooks insert error:', err);
  }
});

chainhooks.connect().then(() => console.log('Connected to Hiro Chainhooks'));

/* 📊 STATS */
app.get('/api/stats', async (_, res) => {
  const tvl = await pool.query(
    `SELECT COALESCE(SUM(amount),0) FROM defi_events WHERE event_type='deposit'`
  );
  const users = await pool.query(
    `SELECT COUNT(DISTINCT sender) FROM defi_events`
  );
  const events = await pool.query(
    `SELECT * FROM defi_events ORDER BY created_at DESC LIMIT 50`
  );

  res.json({
    tvl: tvl.rows[0].coalesce,
    users: users.rows[0].count,
    events: events.rows
  });
});

/* 📈 TVL HISTORY */
app.get('/api/tvl-history', async (_, res) => {
  const { rows } = await pool.query(`
    SELECT DATE(created_at) as day, SUM(amount) as tvl
    FROM defi_events
    WHERE event_type='deposit'
    GROUP BY day
    ORDER BY day ASC
  `);
  res.json(rows);
});

/* 👤 WALLET PAGE */
app.get('/api/wallet/:address', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM defi_events WHERE sender=$1 ORDER BY created_at DESC`,
    [req.params.address]
  );
  res.json(rows);
});

app.listen(3000, () => console.log('Backend running on :3000'));