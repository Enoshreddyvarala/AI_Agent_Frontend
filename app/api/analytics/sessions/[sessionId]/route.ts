import { NextRequest, NextResponse } from "next/server";

import { proxyGet } from "../../../_lib/backend";

export async function GET(_: NextRequest, { params }: { params: { sessionId: string } }) {
  const res = await proxyGet(`/v1/analytics/sessions/${params.sessionId}`);
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") || "application/json" }
  });
}
