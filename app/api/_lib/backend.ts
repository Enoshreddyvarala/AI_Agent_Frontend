const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || "";
const SERVICE_API_KEY = process.env.SERVICE_API_KEY || "";

function backendUrl(path: string) {
  if (!BACKEND_BASE_URL) {
    throw new Error("BACKEND_BASE_URL is not configured.");
  }
  return `${BACKEND_BASE_URL}${path}`;
}

export async function proxyGet(path: string) {
  const res = await fetch(backendUrl(path), {
    method: "GET",
    headers: {
      "x-api-key": SERVICE_API_KEY
    },
    cache: "no-store"
  });
  return res;
}

export async function proxyPost(path: string, body?: unknown) {
  const res = await fetch(backendUrl(path), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": SERVICE_API_KEY
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store"
  });
  return res;
}
