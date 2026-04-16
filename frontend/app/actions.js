'use server';

// app/actions.js

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const API_KEY = process.env.API_KEY; // Only exists on the server

export async function getPersonalActivity(stxAddress) {
  if (!stxAddress) return { error: "No address provided" }

  try {
    const res = await fetch(`${API_URL}/api/my-activity?addrss=${stxAddress}`, 
      headers: {
        'x-api-key': API_KEY, // Secret is safe here
     
      cache: 'no-store', // Always get fresh data for personal activity
    });

    if (!res.ok) throw new Error('Backend failed t repond');
    
    const data = await res.json
    return { success: true, data }
  } catch (err) 
    console.error("Action Error:", err.message);
    return { success: false, error: "Could not fetch your activity" };
  }
}
