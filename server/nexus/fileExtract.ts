// ─────────────────────────────────────────────────────────────────────────
// Local, server-side text extraction for document attachments (PDF, DOCX,
// TXT, CSV, XLS/XLSX, PPTX).
//
// Deliberately NOT OpenAI's hosted File Search (which requires creating and
// maintaining a persistent Vector Store in the user's OpenAI account). This
// extracts plain text locally and folds it into the chat message as
// context — simpler infrastructure, same end-user capability (summarize,
// compare, search within, ask questions about a document). Images are
// handled separately via vision (input_image), not through this module.
// ─────────────────────────────────────────────────────────────────────────
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

// Keeps any single document from blowing up the request to the model —
// long documents are truncated with a clear note rather than silently cut.
const MAX_EXTRACTED_CHARS = 60_000;

function truncate(text: string): string {
  if (text.length <= MAX_EXTRACTED_CHARS) return text;
  return `${text.slice(0, MAX_EXTRACTED_CHARS)}\n\n[... truncated — document is longer than what was sent to the model ...]`;
}

async function extractPdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

/** XLS/XLSX/CSV — each sheet rendered as CSV text, labeled by sheet name. */
function extractSpreadsheet(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  return workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    return `--- Sheet: ${name} ---\n${csv}`;
  }).join('\n\n');
}

const XML_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
function decodeXmlEntities(s: string): string {
  return s.replace(/&(amp|lt|gt|quot|apos);/g, (_, name: string) => XML_ENTITIES[name]);
}

/**
 * PPTX is a zip of per-slide XML files. There's no lightweight, well-maintained
 * pure-JS "pptx text extractor" library, so this does the minimal thing that
 * actually works: unzip, pull text runs (`<a:t>...</a:t>`) out of each slide's
 * XML in order. This gets slide text/bullets, not speaker notes, images, or
 * layout/design — a real but basic extraction, not a full document model.
 */
async function extractPptx(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = Number(a.match(/slide(\d+)\.xml$/)?.[1] ?? 0);
      const numB = Number(b.match(/slide(\d+)\.xml$/)?.[1] ?? 0);
      return numA - numB;
    });

  const slideTexts: string[] = [];
  for (const [i, name] of slideFiles.entries()) {
    const xml = await zip.files[name].async('string');
    const runs = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => decodeXmlEntities(m[1]));
    slideTexts.push(`--- Slide ${i + 1} ---\n${runs.join(' ')}`);
  }
  return slideTexts.join('\n\n');
}

export interface ExtractedFile {
  name: string;
  text: string;
  /** Set when extraction failed — the caller shows a clear, honest error instead of pretending it worked. */
  error?: string;
}

/** Extracts plain text from a document buffer based on its MIME type / filename extension. Returns null for image types (handled via vision instead). */
export async function extractDocumentText(name: string, mimeType: string, buffer: Buffer): Promise<ExtractedFile | null> {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  try {
    if (mimeType === 'application/pdf' || ext === 'pdf') {
      return { name, text: truncate(await extractPdf(buffer)) };
    }
    if (mimeType.includes('wordprocessingml') || ext === 'docx') {
      return { name, text: truncate(await extractDocx(buffer)) };
    }
    if (mimeType.includes('presentationml') || ext === 'pptx') {
      return { name, text: truncate(await extractPptx(buffer)) };
    }
    if (
      mimeType.includes('spreadsheetml') ||
      mimeType === 'application/vnd.ms-excel' ||
      ['xlsx', 'xls', 'csv'].includes(ext)
    ) {
      return { name, text: truncate(extractSpreadsheet(buffer)) };
    }
    if (mimeType.startsWith('text/') || ext === 'txt') {
      return { name, text: truncate(buffer.toString('utf-8')) };
    }
    if (mimeType.startsWith('image/')) {
      return null; // handled via vision, not text extraction
    }
    return { name, text: '', error: `Unsupported file type for "${name}" (${mimeType || ext || 'unknown'}).` };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown extraction error.';
    return { name, text: '', error: `Could not analyze "${name}": ${message}` };
  }
}
