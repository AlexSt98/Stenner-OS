// ─────────────────────────────────────────────────────────────────────────
// MARKETING LAB STORE
//
// A separate Zustand store, deliberately NOT part of store/useStore.ts.
// That store is synchronous, persisted wholesale to LocalStorage and
// versioned at v2 with a migration; Marketing Lab is asynchronous and
// repository-backed. Merging them would force one model onto the other and
// put every existing module at risk. Nothing here imports useStore, and
// useStore is not modified.
//
// Marketing Lab is also the first module in STENNER OS with real loading
// and error states, since every other page reads instantly from memory.
//
// Writes are optimistic: local state updates first so the UI never stalls
// mid-research, then the repository call reconciles or rolls back.
// ─────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';
import type { MarketingWorkspaceData, MLWorkspace, WorkspaceMode } from '../../types/marketing';
import { EMPTY_WORKSPACE_DATA } from '../../types/marketing';
import { repository } from './index';
import { INITIAL_WORKSPACES } from './seedWorkspace';
import type { CollectionKey, Row } from './repository';

type Status = 'idle' | 'loading' | 'ready' | 'error';

/** Fields the store fills in itself on every insert. */
type Insertable<K extends CollectionKey> = Omit<Row<K>, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt'> &
  Partial<Row<K>>;

interface MarketingState {
  backend: 'local' | 'supabase';

  workspaces: MLWorkspace[];
  workspacesStatus: Status;
  workspacesError: string | null;

  activeWorkspaceId: string | null;
  data: MarketingWorkspaceData;
  dataStatus: Status;
  dataError: string | null;

  /** Research vs Strategy. Changes the whole secondary navigation. */
  mode: WorkspaceMode;

  loadWorkspaces: () => Promise<void>;
  loadWorkspace: (workspaceId: string) => Promise<void>;
  createWorkspace: (input: { name: string; slug: string; description: string; color: string; icon: string }) => Promise<MLWorkspace>;
  setMode: (mode: WorkspaceMode) => void;

  add: <K extends CollectionKey>(collection: K, row: Insertable<K>) => Promise<Row<K> | null>;
  patch: <K extends CollectionKey>(collection: K, id: string, patch: Partial<Row<K>>) => Promise<void>;
  drop: (collection: CollectionKey, id: string) => Promise<void>;
}

const message = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong.');

export const useMarketingStore = create<MarketingState>((set, get) => ({
  backend: repository.backend,

  workspaces: [],
  workspacesStatus: 'idle',
  workspacesError: null,

  activeWorkspaceId: null,
  data: EMPTY_WORKSPACE_DATA,
  dataStatus: 'idle',
  dataError: null,

  mode: 'research',

  async loadWorkspaces() {
    if (get().workspacesStatus === 'loading') return;
    set({ workspacesStatus: 'loading', workspacesError: null });
    try {
      let workspaces = await repository.listWorkspaces();

      // First run against a fresh database: create the two projects the
      // product ships with. Only their identity — each gets the 14-phase
      // framework and its questions, and no findings whatsoever. Guarded on
      // the list being empty, so it happens exactly once and never
      // resurrects a project that was deliberately deleted... unless every
      // one is gone, which is indistinguishable from a first run.
      if (workspaces.length === 0) {
        for (const seed of INITIAL_WORKSPACES) {
          await repository.createWorkspace(seed);
        }
        workspaces = await repository.listWorkspaces();
      }

      set({ workspaces, workspacesStatus: 'ready' });
    } catch (err) {
      set({ workspacesStatus: 'error', workspacesError: message(err) });
    }
  },

  async loadWorkspace(workspaceId) {
    // Already loaded and current — don't re-fetch on every navigation.
    if (get().activeWorkspaceId === workspaceId && get().dataStatus === 'ready') return;
    set({ activeWorkspaceId: workspaceId, dataStatus: 'loading', dataError: null, data: EMPTY_WORKSPACE_DATA });
    try {
      const data = await repository.loadWorkspaceData(workspaceId);
      // Guard against a slower earlier request landing after a newer one.
      if (get().activeWorkspaceId !== workspaceId) return;
      set({ data, dataStatus: 'ready' });
    } catch (err) {
      if (get().activeWorkspaceId !== workspaceId) return;
      set({ dataStatus: 'error', dataError: message(err) });
    }
  },

  async createWorkspace(input) {
    const workspace = await repository.createWorkspace(input);
    set((s) => ({ workspaces: [...s.workspaces, workspace] }));
    return workspace;
  },

  setMode(mode) {
    set({ mode });
  },

  async add(collection, row) {
    const workspaceId = get().activeWorkspaceId;
    if (!workspaceId) return null;

    // Timestamps belong to the adapter, not here: Postgres fills them from
    // column defaults, and three tables (notes, sources, evidence links)
    // have no updated_at at all, so sending one unconditionally would fail
    // against Supabase.
    const payload = { workspaceId, ...row } as unknown as Omit<Row<typeof collection>, 'id'>;

    try {
      const created = await repository.insert(collection, payload);
      set((s) => ({
        data: { ...s.data, [collection]: [...(s.data[collection] as unknown[]), created] } as MarketingWorkspaceData,
      }));
      return created;
    } catch (err) {
      set({ dataError: message(err) });
      return null;
    }
  },

  async patch(collection, id, patchValue) {
    const previous = get().data;
    const now = new Date().toISOString();

    // Optimistic: apply locally first so typing never waits on the network.
    set((s) => ({
      data: {
        ...s.data,
        [collection]: (s.data[collection] as { id: string }[]).map((r) =>
          r.id === id ? { ...r, ...patchValue, updatedAt: now } : r
        ),
      } as MarketingWorkspaceData,
    }));

    try {
      await repository.update(collection, id, patchValue);
    } catch (err) {
      set({ data: previous, dataError: message(err) });
    }
  },

  async drop(collection, id) {
    const previous = get().data;
    set((s) => ({
      data: {
        ...s.data,
        [collection]: (s.data[collection] as { id: string }[]).filter((r) => r.id !== id),
      } as MarketingWorkspaceData,
    }));

    try {
      await repository.remove(collection, id);
    } catch (err) {
      set({ data: previous, dataError: message(err) });
    }
  },
}));

/** Convenience selector: the workspace currently open, or null. */
export function useActiveWorkspace() {
  return useMarketingStore((s) => s.workspaces.find((w) => w.id === s.activeWorkspaceId) ?? null);
}
