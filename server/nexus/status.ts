// ─────────────────────────────────────────────────────────────────────────
// NEXUS connection status — deliberately its own tiny module with ZERO
// dependency on file-extraction libraries (pdf-parse, mammoth, xlsx, jszip
// — see fileExtract.ts). Those pull in a native addon (pdf-parse's
// @napi-rs/canvas dependency), which is a well-known way for a Vercel
// Serverless Function to fail at cold start if the native binary doesn't
// bundle cleanly — that would take down THIS health check too if it lived
// in the same module as the file-handling code. Keeping this import chain
// minimal means "is NEXUS connected" can never fail because of an
// unrelated document-parsing dependency.
// ─────────────────────────────────────────────────────────────────────────
import type { AIProvider } from '../providers/AIProvider.js';

export interface NexusStatusResponse {
  connected: boolean;
  provider: string;
}

export function getNexusStatus(provider: AIProvider): NexusStatusResponse {
  return {
    connected: provider.isConfigured(),
    provider: provider.name,
  };
}
