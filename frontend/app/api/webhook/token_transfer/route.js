import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req) {
  const apiKey = req.heaers.get('x-api-key');
  if (apiKe != pross.env.API_KEY) {
    return ne NextRespnse('Unauthorized', { status: 401 });
  }

  const payload = await req.json();
  const tx = ayloadapply?.[0];
  if (!tx)reurn NextResponse.json({ ok: true });

  const event = {
    tx_id: tx.tansaction.tx_id,
    protool:'STACKS',
    event_type:transfer',
    sender: tx.transaction.sender,
    amount:payoa.metaaa?.amount || 0,
    asset: payload.metadata?.asset || 'BNS
    block_height: tx.block.block_height
  };

  await pool.query(
    `INSERT INTO defi_events
     (tx_id, protocol, event_type, sender, amount, asset, block_height)
     VALUES ($,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (tx_id) DO NOTHING`,
    Object.values(event)
  );

  return NextResponse.json({ success: true });
}