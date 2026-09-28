// ─────────────────────────────────────────────────────────────────────────
// LOCAL ADAPTER — browser-only storage, used until the Supabase migration
// has been applied.
//
// Two things make this safe to ship alongside the real backend:
//
//   · It writes to its OWN key, `stenner-marketing-local-v1`. It never
//     reads or writes stenner-os-storage-v1, so nothing it does can affect
//     Tasks, TEOPM, English Lab or NEXUS.
//   · It never talks to Supabase. Nothing entered while this adapter is
//     active reaches the database.
//
// The artificial latency is deliberate: the rest of STENNER OS is fully
// synchronous, so Marketing Lab is the first module with loading and error
// states. Resolving on a later tick keeps those states honest here instead
// of only appearing once the real network is wired in.
// ─────────────────────────────────────────────────────────────────────────

import { v4 as uuid } from 'uuid';
import type { MarketingWorkspaceData, MLWorkspace } from '../../types/marketing';
import { EMPTY_WORKSPACE_DATA } from '../../types/marketing';
import type { CollectionKey, MarketingRepository, Row } from './repository';
import { buildWorkspaceSeed, INITIAL_WORKSPACES } from './seedWorkspace';

// v2: the question bank was translated to Spanish. Bumping the key
// regenerates the framework instead of leaving the old English
// questions cached in a browser that already seeded v1.
const STORAGE_KEY = 'stenner-marketing-local-v2';
const LATENCY_MS = 90;

interface LocalDb {
  version: 1;
  workspaces: MLWorkspace[];
  data: Record<string, MarketingWorkspaceData>;
}

const tick = <T>(value: T): Promise<T> => new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS));

function emptyDb(): LocalDb {
  return { version: 1, workspaces: [], data: {} };
}

function read(): LocalDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedDb();
    const parsed = JSON.parse(raw) as LocalDb;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.workspaces)) return seedDb();
    return parsed;
  } catch {
    // Private browsing, cleared storage, or corrupt JSON — start clean
    // rather than taking the module down.
    return emptyDb();
  }
}

function write(db: LocalDb) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    /* quota or blocked storage — the in-memory result still stands for this session */
  }
}

/** First run: create TEOPM and GEO-CX with their framework, no findings. */
function seedDb(): LocalDb {
  const now = new Date().toISOString();
  const db = emptyDb();

  for (const ws of INITIAL_WORKSPACES) {
    const id = uuid();
    db.workspaces.push({
      id,
      slug: ws.slug,
      name: ws.name,
      description: ws.description,
      color: ws.color,
      icon: ws.icon,
      status: 'active',
      linkedProjectId: null,
      createdAt: now,
      updatedAt: now,
    });
    db.data[id] = buildWorkspaceSeed(id, now);
  }

  write(db);
  return db;
}

export const localRepository: MarketingRepository = {
  backend: 'local',

  async listWorkspaces() {
    return tick(read().workspaces);
  },

  async createWorkspace(input) {
    const db = read();
    const now = new Date().toISOString();
    const workspace: MLWorkspace = {
      id: uuid(),
      slug: input.slug,
      name: input.name,
      description: input.description,
      color: input.color,
      icon: input.icon,
      status: 'active',
      linkedProjectId: null,
      createdAt: now,
      updatedAt: now,
    };
    db.workspaces.push(workspace);
    db.data[workspace.id] = buildWorkspaceSeed(workspace.id, now);
    write(db);
    return tick(workspace);
  },

  async updateWorkspace(id, patch) {
    const db = read();
    const i = db.workspaces.findIndex((w) => w.id === id);
    if (i === -1) throw new Error(`Workspace ${id} not found`);
    db.workspaces[i] = { ...db.workspaces[i], ...patch, updatedAt: new Date().toISOString() };
    write(db);
    return tick(db.workspaces[i]);
  },

  async deleteWorkspace(id) {
    const db = read();
    db.workspaces = db.workspaces.filter((w) => w.id !== id);
    delete db.data[id];
    write(db);
    return tick(undefined);
  },

  async loadWorkspaceData(workspaceId) {
    const db = read();
    return tick(db.data[workspaceId] ?? { ...EMPTY_WORKSPACE_DATA });
  },

  async insert<K extends CollectionKey>(collection: K, row: Omit<Row<K>, 'id'>) {
    const db = read();
    const workspaceId = (row as { workspaceId: string }).workspaceId;
    const bucket = db.data[workspaceId] ?? (db.data[workspaceId] = { ...EMPTY_WORKSPACE_DATA });
    // Postgres fills these from column defaults; here there is no database
    // to do it, so the adapter supplies them. Anything the caller already
    // set (the workspace seed does) wins.
    const now = new Date().toISOString();
    const created = { createdAt: now, updatedAt: now, ...row, id: uuid() } as Row<K>;
    (bucket[collection] as Row<K>[]) = [...(bucket[collection] as Row<K>[]), created];
    write(db);
    return tick(created);
  },

  async update<K extends CollectionKey>(collection: K, id: string, patch: Partial<Row<K>>) {
    const db = read();
    for (const workspaceId of Object.keys(db.data)) {
      const list = db.data[workspaceId][collection] as Row<K>[];
      const i = list.findIndex((r) => (r as { id: string }).id === id);
      if (i === -1) continue;
      const updated = { ...list[i], ...patch, updatedAt: new Date().toISOString() } as Row<K>;
      (db.data[workspaceId][collection] as Row<K>[]) = list.map((r, j) => (j === i ? updated : r));
      write(db);
      return tick(updated);
    }
    throw new Error(`${collection} row ${id} not found`);
  },

  async remove(collection, id) {
    const db = read();
    for (const workspaceId of Object.keys(db.data)) {
      const list = db.data[workspaceId][collection] as { id: string }[];
      if (!list.some((r) => r.id === id)) continue;
      (db.data[workspaceId][collection] as { id: string }[]) = list.filter((r) => r.id !== id);
      write(db);
      return tick(undefined);
    }
    return tick(undefined);
  },
};

/** Exposed for Settings / dev tooling: wipe Marketing Lab's local data only. */
export function resetLocalMarketingData() {
  localStorage.removeItem(STORAGE_KEY);
}
