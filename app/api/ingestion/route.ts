import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || "";
const SERVICE_API_KEY = process.env.SERVICE_API_KEY || "";

export async function POST(request: NextRequest) {
  if (!BACKEND_BASE_URL) {
    return NextResponse.json({ detail: "BACKEND_BASE_URL is not configured." }, { status: 500 });
  }

  const form = await request.formData();
  const res = await fetch(`${BACKEND_BASE_URL}/v1/ingestion/submit`, {
    method: "POST",
    headers: {
      "x-api-key": SERVICE_API_KEY
    },
    body: form
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") || "application/json" }
  });
}
