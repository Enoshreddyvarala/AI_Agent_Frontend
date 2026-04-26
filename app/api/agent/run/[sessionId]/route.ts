import { NextRequest, NextResponse } from "next/server";

import { proxyPost } from "../../../_lib/backend";

export async function POST(request: NextRequest, { params }: { params: { sessionId: string } }) {
  const body = await request.json();
  const res = await proxyPost(`/v1/agent/run/${params.sessionId}`, body);
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") || "application/json" }
  });
}
