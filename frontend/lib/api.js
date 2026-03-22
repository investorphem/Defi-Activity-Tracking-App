const API_URL = process.env.NEXT_PUBLIC_API_URL;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

/**
 * Universal fetcher with unified error handling
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json",
        ...options.headers,
      },
      cache: "no-store", // Ensures we always get live Chainhook data
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.message || `API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`[API Debug] ${endpoint}:`, error.message);
    throw error;
  }
}

/**
 * Fetches global ecosystem stats (TVL, Users, Events)
 */
export async function fetchStats() {
  const data = await apiRequest("/api/stats");
  
  // Optional: Add default values or formatting here
  return {
    ...data,
    tvl: data.tvl || 0,
    users: data.users || 0,
    events: data.events || []
  };
}

/**
 * Fetches historical TVL data for charting
 */
export async function fetchTvlHistory() {
  const data = await apiRequest("/api/tvl-history");
  
  // Ensure the data is sorted by date for the chart
  if (Array.isArray(data)) {
    return data.sort((a, b) => new Date(a.day) - new Date(b.day));
  }
  
  return [];
}

/**
 * Fetches specific wallet activity
 */
export async function fetchWalletActivity(address) {
  if (!address) return [];
  return await apiRequest(`/api/wallet/${address}`);
}
