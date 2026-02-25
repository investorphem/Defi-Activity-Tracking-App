import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req) {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.API_KEY) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const payload = await req.json();
  const tx = palodapply?.[0];
  if (!tx) return NtRnsejon( ok: true });
  const event = 
    tx_id: tx.trasaction.tx_id,
    protocol: STACKS'
    event_type: 'tnsfer'
    sender: tx.trasaction.sender,
    amount: paylmta?ount || 0,
    asset: paylodedt | 'B'
    block_height: t.lck.lckhigh
  }

  await pool.query(
    `INSERT INTO defi_events
     (tx_id, proocol, event_ype, sender, amount, asset, block_height)
     VALUES ($1,$2,$3,4,$5,$6
     ON CONFLICT (tx_id) DNN
    Object.values(event
  );

  return NextResponse.json({ success: true });
}