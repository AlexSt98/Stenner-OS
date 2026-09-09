// Vercel Serverless Function — production equivalent of the Express route
// `POST /api/nexus/chat` in server/index.ts. Same request/response contract
// that src/lib/nexus/client.ts's streamNexusReply() expects: a streamed
// text/plain body, optionally followed by a `[[NEXUS_META]]`-prefixed JSON
// blob with the tool call / token usage.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getProvider } from '../../server/providers/index.js';
import { isValidChatBody, streamNexusChat } from '../../server/nexus/handlers.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = req.body as unknown;

  if (!isValidChatBody(body)) {
    res.status(400).json({ error: 'messages[] is required' });
    return;
  }

  const provider = getProvider();

  if (!provider.isConfigured()) {
    res.status(503).json({ error: `NEXUS is not connected — ${provider.name.toUpperCase()}_API_KEY is missing on the server.` });
    return;
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  // Flush headers immediately so the client starts reading the stream right
  // away, matching the Express route's behavior.
  res.flushHeaders?.();

  await streamNexusChat(provider, body, (delta) => res.write(delta));
  res.end();
}
