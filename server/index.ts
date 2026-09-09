import 'dotenv/config';
import express from 'express';
import type { ChatMessage, ToolDeclaration } from './providers/AIProvider.js';
import { getProvider } from './providers/index.js';

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = Number(process.env.NEXUS_SERVER_PORT) || 8787;

// A single provider instance for the process's lifetime — env vars are read
// once at boot. Restart the server after editing .env.
const provider = getProvider();

app.get('/api/nexus/status', (_req, res) => {
  res.json({
    connected: provider.isConfigured(),
    provider: provider.name,
  });
});

interface ChatBody {
  systemPrompt: string;
  messages: ChatMessage[];
  tools?: ToolDeclaration[];
}

const META_MARKER = '\n\n[[NEXUS_META]]';

app.post('/api/nexus/chat', async (req, res) => {
  const body = req.body as Partial<ChatBody>;

  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
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

  try {
    const result = await provider.streamResponse(
      { systemPrompt: body.systemPrompt ?? '', messages: body.messages, tools: body.tools },
      (delta) => res.write(delta)
    );
    if (result.toolCall || result.usage) {
      res.write(META_MARKER + JSON.stringify({ toolCall: result.toolCall, usage: result.usage }));
    }
    res.end();
  } catch (err) {
    // The stream may already have started — write a visible error instead of
    // changing the status code (headers are already sent by this point).
    const message = err instanceof Error ? err.message : 'Unknown error talking to the AI provider.';
    res.write(`\n\n[NEXUS encountered an error: ${message}]`);
    res.end();
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[nexus] server listening on http://localhost:${PORT} (provider: ${provider.name}, configured: ${provider.isConfigured()})`);
});
