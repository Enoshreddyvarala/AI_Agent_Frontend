import { NextRequest, NextResponse } from "next/server";

import { proxyGet } from "../../_lib/backend";

export async function GET(request: NextRequest, { params }: { params: { sessionId: string } }) {
  const url = new URL(request.url);
  const days = url.searchParams.get("days_until_interview");
  const suffix = days ? `?days_until_interview=${encodeURIComponent(days)}` : "";
  const res = await proxyGet(`/v1/learning-plan/${params.sessionId}${suffix}`);
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") || "application/json" }
  });
}
