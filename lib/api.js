export async function fetchStats() {
  const res = await fetch('/api/stats', {
    headers: {
      'x-api-key': process.env.NEXT_PUBLIC_API_KEY
    }
  });
  return res.json();
}