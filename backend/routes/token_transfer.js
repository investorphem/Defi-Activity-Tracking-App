import express from "express";
import pool from "../db.js";

const router = express.Router();

/**
 * HIRO CHAINHOOK RECEIVER
 * Processes incoming Stacks blockchain events in real-time
 */
router.post("/", async (req, res) => {
  const apiKey = req.headers["x-api-key"];

  // 1. Enhanced Security Check
  if (!apiKey || apiKey !== process.env.API_KEY) {
    console.error(`[Security] Unauthorized access attempt from IP: ${req.ip}`);
    return res.status(444).json({ error: "Connection Refused" }); // 444 is a "No Response" style error
  }

  const payload = req.body;

  // 2. Validate Chainhook Structure
  // Chainhooks can send multiple 'apply' blocks in one payload
  const transactions = payload.apply || [];
  
  if (transactions.length === 0) {
    return res.json({ status: "skipped", message: "No blocks found in payload" });
  }

  try {
    console.log(`[Chainhook] Processing ${transactions.length} blocks...`);

    for (const blockData of transactions) {
      const blockHeight = blockData.block_identifier.index;
      const txs = blockData.transactions || [];

      for (const tx of txs) {
        const txId = tx.transaction_identifier.hash;
        const sender = tx.metadata.sender;
        
        // Chainhooks often store transfer details in 'metadata' or 'operations'
        // We'll extract the amount and asset safely
        const amount = payload.metadata?.amount || 0;
        const asset = payload.metadata?.asset || "STX";

        const event = {
          tx_id: txId,
          protocol: "STACKS",
          event_type: "TRANSFER",
          sender: sender,
          amount: amount,
          asset: asset,
          block_height: blockHeight,
        };

        // 3. Robust Database Upsert
        await pool.query(
          `INSERT INTO defi_events 
           (tx_id, protocol, event_type, sender, amount, asset, block_height, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
           ON CONFLICT (tx_id) 
           DO UPDATE SET block_height = EXCLUDED.block_height
           WHERE defi_events.block_height < EXCLUDED.block_height`,
          [
            event.tx_id,
            event.protocol,
            event.event_type,
            event.sender,
            event.amount,
            event.asset,
            event.block_height
          ]
        );
      }
    }

    // 4. Send "Success" early to prevent Chainhook timeouts
    return res.status(200).json({ 
      success: true, 
      processed_at: new Date().toISOString() 
    });

  } catch (error) {
    console.error("[Database Error] Failed to index Stacks event:", error.message);
    // Even on error, we return 200/202 to Hiro to prevent them from 
    // retrying indefinitely and flooding your server.
    return res.status(202).json({ error: "Partial processing failure" });
  }
});

export default router;
