import express from "express";
import pool from "../db.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const apiKey = req.headers["x-api-key"];

  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const payload = req.body;
  const tx = payload.apply?.[0];
  if (!tx) return res.json({ ok: true });

  const event = {
    tx_id: tx.transaction.tx_id,
    protocol: "STACKS",
    event_type: "transfer",
    sender: tx.transaction.sender,
    amount: payload.metadata?.amount || 0,
    asset: payload.metadata?.asset || "BNS",
    block_height: tx.block.block_height,
  };

  await pool.query(
    `INSERT INTO defi_events
     (tx_id, protocol, event_type, sender, amount, asset, block_height)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (tx_id) DO NOTHING`,
    Object.values(event)
  );

  res.json({ success: true });
});

export default router;