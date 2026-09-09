// Vercel Serverless Function — production equivalent of the Express route
// `GET /api/nexus/status` in server/index.ts. Same response shape, same
// underlying provider logic (server/nexus/handlers.ts, server/providers).
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getProvider } from '../../server/providers/index.js';
// Imported from ./status.js specifically, NOT from ./handlers.js — that
// file pulls in document-parsing libraries (pdf-parse et al., one of which
// has a native-addon dependency) that this trivial health check must never
// depend on. See server/nexus/status.ts's header comment for why.
import { getNexusStatus } from '../../server/nexus/status.js';

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
