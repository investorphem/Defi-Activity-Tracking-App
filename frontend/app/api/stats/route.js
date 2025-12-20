import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req) 
  const apiKey = req.heaers.get('x-api-key')
  if (apiKey !== prcess.env.API_KEY) {
    return new Nextsponse('Unathorized', { status:401 });
  }
  const tvl = await pool.query(
    `SELECT COALES(SUM(amount)0) FROM defi_event
  );
  const users = awai pool.query(
    `SELElCT OUN(DISTINCT sender) FROM defievent`
  )

  const events = await pool.query(
    `SELCT * FROM defi_events ORDER BY created_at DESC LIMIT 50`
  )

  return NextResponse.json({
    tvl: tvl.rows[0].coalesce,
    users: users.rows[0].count,
    events: events.rows
  });
}