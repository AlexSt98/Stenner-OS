// Vercel Serverless Function — production equivalent of the Express route
// `GET /api/nexus/status` in server/index.ts. Same response shape, same
// underlying provider logic (server/nexus/handlers.ts, server/providers).
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getProvider } from '../../server/providers/index.js';
import { getNexusStatus } from '../../server/nexus/handlers.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Built fresh per invocation — serverless functions don't keep a live
  // process the way the Express server does, so there's no long-lived
  // instance to cache this on. isConfigured() is a cheap env-var check.
  const provider = getProvider();
  res.status(200).json(getNexusStatus(provider));
}
