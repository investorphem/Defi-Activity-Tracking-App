// lib/api.js

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Helper to get the correct API Key based on the environment.
 * Next.js hide process.env.API_KEY from the browser automatically.
 */
function getAuthHeader() {
  const isServer = typeof window === 'undefined';
  const key = isServer ? process.env.API_KEY : process.env.NEXT_PUBLIC_API_KEY;
  return { 'x-api-key': key };
}

// 1. GLOBAL STATS (Works on Server & Client)
export async function fetchStats() {
  const res = await fetch(`${API_URL}/api/stats`, {
    headers: getAuthHeader(),
    next: { revalidate: 60 } // Cache for 60s on server
  });

  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

// 2. TVL HISTORY (Works on Server & Client)
export async function fetchTvlHistory() {
  const res = await fetch(`${API_URL}/api/tvl-history`, {
    headers: getAuthHeader(),
    next: { revalidate: 3600 } // Charts change slower, cache longer
  });

  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
}

// 3. NEW: USER ACTIVITY (Used by Client Components)
export async function fetchUserActivity(stxAddress) {
  if (!stxAddress) return [];

  const res = await fetch(`${API_URL}/api/my-activity?address=${stxAddress}`, {
    headers: getAuthHeader(),
    cache: 'no-store' // Don't cache personal data
  });

  if (!res.ok) throw new Error('Failed to fetch user activity');
  return res.json();
}
