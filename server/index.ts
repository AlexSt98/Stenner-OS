import 'dotenv/config';
import express from 'express';
import { getProvider } from './providers/index.js';
import { getNexusStatus } from './nexus/status.js';
import { isValidChatBody, streamNexusChat } from './nexus/handlers.js';

// This Express server is NEXUS's local-dev backend only — Vite proxies
// /api/* to it (see vite.config.ts). In production on Vercel, the same
// behavior is served by api/nexus/status.ts and api/nexus/chat.ts, which
// call the exact same shared logic in ./nexus/handlers.ts.
const app = express();
// Raised from 1mb so a chat turn can carry a document/image attachment as a
// base64 data: URL (see server/nexus/handlers.ts's NexusAttachment). Note:
// this only matters for local dev — in production (Vercel Serverless
// Functions, api/nexus/chat.ts) the platform's own ~4.5MB request body cap
// applies regardless of anything configured here.
app.use(express.json({ limit: '20mb' }));

const PORT = Number(process.env.NEXUS_SERVER_PORT) || 8787;

// A single provider instance for the process's lifetime — env vars are read
// once at boot. Restart the server after editing .env.
const provider = getProvider();

app.get('/api/nexus/status', (_req, res) => {
  res.json(getNexusStatus(provider));
});

app.post('/api/nexus/chat', async (req, res) => {
  const body = req.body as unknown;

  if (!isValidChatBody(body)) {
    res.status(400).json({ error: 'messages[] is required' });
    return;
  }

  if (!provider.isConfigured()) {
    res.status(503).json({ error: `NEXUS is not connected — ${provider.name.toUpperCase()}_API_KEY is missing on the server.` });
    return;
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  // Flush headers immediately so the client starts reading the stream right away.
  res.flushHeaders?.();

  await streamNexusChat(provider, body, (delta) => res.write(delta));
  res.end();
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[nexus] server listening on http://localhost:${PORT} (provider: ${provider.name}, configured: ${provider.isConfigured()})`);
});
