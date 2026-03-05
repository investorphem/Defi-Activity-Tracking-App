import { NextResponse } from "next/server";

export async function GET(req) {
  const apiKey = req.headers.get("x-api-key");

  if (apiKey !== process.env.API_KEY) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Call your backend API instead of querying DB directly
  const res = await fetch(
    `${process.env.BACKEND_URL}/api/stats`,
    {
      headers: {
        "x-api-key": process.env.API_KEY,
      },
      cache: "no-store",
    }
  );

  const data = await res.json();

  return NextResponse.json(data);
}