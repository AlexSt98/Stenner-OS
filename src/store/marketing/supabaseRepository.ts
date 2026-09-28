// ─────────────────────────────────────────────────────────────────────────
// SUPABASE ADAPTER — written and ready, inert until the migration is run.
//
// Nothing selects this adapter today (see index.ts): the tables do not exist
// yet, so it is not reachable and nothing typed into Marketing Lab reaches
// the database. It is here so that turning Supabase on is a flag flip plus
// a migration, not a rewrite.
//
// Postgres columns are snake_case and the app is camelCase, so every row is
// translated in both directions. user_id is never sent from here: the
// migration defaults it to auth.uid() and RLS enforces it, which means the
// client cannot write a row on someone else's behalf even if it tried.
// ─────────────────────────────────────────────────────────────────────────

import type { MarketingWorkspaceData, MLWorkspace } from '../../types/marketing';
import { EMPTY_WORKSPACE_DATA } from '../../types/marketing';
import { requireSupabase } from '../../lib/supabase/client';
import { TABLE_NAMES, type CollectionKey, type MarketingRepository, type Row } from './repository';
import { buildWorkspaceSeed } from './seedWorkspace';

const WORKSPACES_TABLE = 'ml_workspaces';

const snake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const camel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

function toRow<T extends object>(obj: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [snake(k), v]));
}

function fromRow<T>(row: Record<string, unknown>): T {
  // user_id is a storage concern enforced by RLS; the app model never carries it.
  return Object.fromEntries(
    Object.entries(row)
      .filter(([k]) => k !== 'user_id')
      .map(([k, v]) => [camel(k), v])
  ) as T;
}

export const supabaseRepository: MarketingRepository = {
  backend: 'supabase',

  async listWorkspaces() {
    const { data, error } = await requireSupabase().from(WORKSPACES_TABLE).select('*').order('created_at');
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => fromRow<MLWorkspace>(r));
  },

  async createWorkspace(input) {
    const supabase = requireSupabase();
    const { data, error } = await supabase.from(WORKSPACES_TABLE).insert(toRow(input)).select().single();
    if (error) throw new Error(error.message);
    const workspace = fromRow<MLWorkspace>(data);

    // Scaffold the framework — 14 phases, their questions, the empty book
    // sections and strategy blocks. Same helper the local adapter uses, so
    // both backends produce an identical starting point.
    const seed = buildWorkspaceSeed(workspace.id, new Date().toISOString());
    for (const key of ['phases', 'questions', 'bookSections', 'strategyOutputs'] as CollectionKey[]) {
      const rows = seed[key] as object[];
      if (rows.length === 0) continue;
      const { error: seedError } = await supabase.from(TABLE_NAMES[key]).insert(rows.map(toRow));
      if (seedError) throw new Error(`Seeding ${key}: ${seedError.message}`);
    }

    return workspace;
  },

  async updateWorkspace(id, patch) {
    const { data, error } = await requireSupabase()
      .from(WORKSPACES_TABLE)
      .update(toRow({ ...patch, updatedAt: new Date().toISOString() }))
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return fromRow<MLWorkspace>(data);
  },

  async deleteWorkspace(id) {
    // Children go with it: every child table declares ON DELETE CASCADE.
    const { error } = await requireSupabase().from(WORKSPACES_TABLE).delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async loadWorkspaceData(workspaceId) {
    const supabase = requireSupabase();
    const keys = Object.keys(TABLE_NAMES) as CollectionKey[];

    const results = await Promise.all(
      keys.map((key) => supabase.from(TABLE_NAMES[key]).select('*').eq('workspace_id', workspaceId))
    );

    const out = { ...EMPTY_WORKSPACE_DATA } as MarketingWorkspaceData;
    keys.forEach((key, i) => {
      const { data, error } = results[i];
      if (error) throw new Error(`${TABLE_NAMES[key]}: ${error.message}`);
      (out[key] as unknown[]) = (data ?? []).map((r) => fromRow(r));
    });
    return out;
  },

  async insert<K extends CollectionKey>(collection: K, row: Omit<Row<K>, 'id'>) {
    const { data, error } = await requireSupabase()
      .from(TABLE_NAMES[collection])
      .insert(toRow(row as object))
      .select()
      .single();
    if (error) throw new Error(error.message);
    return fromRow<Row<K>>(data);
  },

  async update<K extends CollectionKey>(collection: K, id: string, patch: Partial<Row<K>>) {
    const { data, error } = await requireSupabase()
      .from(TABLE_NAMES[collection])
      .update(toRow({ ...(patch as object), updatedAt: new Date().toISOString() }))
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return fromRow<Row<K>>(data);
  },

  async remove(collection, id) {
    const { error } = await requireSupabase().from(TABLE_NAMES[collection]).delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};
