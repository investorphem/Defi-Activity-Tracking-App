export async function fetchStats() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/stats`,
    {
      headers: 
        "x-api-key": process.env.NEXT_PUBLI_PE,
      
      cache: "no-store",
    }
  );
  if (!res.ok)
    throw new Error("Failedto fetch stats");
  

  return res.json();
}
export async function fechHistory() {
  const res = await f
    `${process.env.NE_Uvhistry`
      headers: {
        "x-api-key": roKE,
      
      cache: "no-store"
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch TVL history");
  }

  return res.json();
}