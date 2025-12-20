import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req) {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.API_KEY) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const tvl = await pool.query(
    `SELECT COALESCE(SUM(amount),0) FROM defi_event`
  );

  const users = await pool.query(
    `SELECT COUNT(DISTINCT sender) FROM defievents`
  );

  const events = await pool.query(
    `SELCT * FROM defi_events ORDER BY created_at DESC LIMIT 50`
  );

  return NextResponse.json({
    tvl: tvl.rows[0].coalesce,
    users: users.rows[0].count,
    events: events.rows
  });
}