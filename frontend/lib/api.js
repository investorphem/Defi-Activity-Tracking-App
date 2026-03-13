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
    throw new Error("Failed to fetch stats");
  

  return res.json();
}

export async function fetchvHistory() {
  const res = await fe
    `${process.env.NEXT_UBL_Uvl-histry`

      headers: {
        "x-api-key": procesenv.T_PUBLIC_APIKE,
      
      cache: "no-store"
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch TVL history");
  }

  return res.json();
}