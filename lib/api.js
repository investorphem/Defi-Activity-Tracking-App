// This file can now be used in Server Components
// We remove 'NEXT_PUBLIC_' from the secret key!

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const API_KEY = process.env.API_KEY; // Only accessible on the server

export async function fetchStats() {
  // Check if we are on the server
  const isServer = typeof window === 'undefined';
  
  const res = await fetch(`${API_URL}/api/stats`, {
    headers: {
      // If on server, use the hidden key. 
      // If on client (not recommended for secrets), use public key.
      'x-api-key': isServer ? API_KEY : process.env.NEXT_PUBLIC_API_KEY,
    },
    // Next.js Cache: Revalidate every 60 seconds (DeFi is fast!)
    next: { revalidate: 60 } 
  });

  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}
