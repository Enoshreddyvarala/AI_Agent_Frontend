# Vercel Frontend (Next.js)

This is a Vercel-ready frontend that proxies requests to the backend securely.

## Environment Variables (Vercel)

- `BACKEND_BASE_URL=https://<your-hf-space>.hf.space`
- `SERVICE_API_KEY=<same-key-as-backend>`

Do NOT expose backend API key in client-side code; these routes run server-side.

## Local Run

```bash
cd web
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy to Vercel

1. Import this repo in Vercel.
2. Set project root to `web`.
3. Add environment variables:
   - `BACKEND_BASE_URL`
   - `SERVICE_API_KEY`
4. Deploy.

## Proxy Routes Included

- `POST /api/agent/run/[sessionId]`
- `GET /api/skills/compare/[sessionId]`
- `GET /api/gaps/[sessionId]`
- `GET /api/learning-plan/[sessionId]`
- `GET /api/analytics/sessions/[sessionId]`
- `POST /api/ingestion`
