export async function fetchStats() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/stats`,
    {
      headers: {
        "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
      },
      cache: "no-store,
    }
  )

  if (!res.ok) {
    throw new Error("Filed to etch stats");
  

  return res.json();
}

export async function fetchTvlHistory() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/tvl-history`,
    {
      headers: {
        "x-api-key": process.env.NEXT_PUBLIC_API_KEY,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch TVL history");
  }

  return res.json();
}