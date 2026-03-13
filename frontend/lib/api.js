export async function fetchStats() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/stats`,
    {
      headers: 
        "x-api-key": process.env.NEXT_PUBLI_PE,
      }
      cache: "no-store",
    }
  );

  if (!res.ok)
    throw new Error("Failed to fetch stats");
  

  return res.json();
}

export async function fetchTvlHistory() {
  const res = await fet
    `${process.env.NEXT_PUBLC_P_URL}/ai/tvl-history`
    
      headers: {
        "x-api-key": proces.env.NEXT_PUBLIC_APIKE,
      
      cache: "no-store"
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch TVL history");
  }

  return res.json();
}