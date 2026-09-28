// ─────────────────────────────────────────────────────────────────────────
// MARKETING REPOSITORY — the only seam between Marketing Lab and storage.
//
// Nothing in the UI or the store knows where data lives. Two adapters
// implement this interface:
//
//   localRepository     browser-only, its OWN localStorage key, used while
//                       the Supabase migration is still unapplied. Never
//                       touches stenner-os-storage-v1, so the rest of
//                       STENNER OS cannot be affected by anything here.
//   supabaseRepository  the real backend. Written and ready, but inert
//                       until the migration has been run and the backend
//                       flag is flipped — see index.ts.
//
// Collections are addressed generically rather than with 16 × 3 bespoke
// methods, so adding an entity means adding one line to TABLE_NAMES.
// ─────────────────────────────────────────────────────────────────────────

import type { MarketingWorkspaceData, MLWorkspace } from '../../types/marketing';

/** Every per-workspace collection. Keys match MarketingWorkspaceData exactly. */
export type CollectionKey = keyof MarketingWorkspaceData;

/** The row type held by a given collection. */
export type Row<K extends CollectionKey> = MarketingWorkspaceData[K][number];

/** Fields the caller never supplies — the adapter owns them. */
export type NewRow<K extends CollectionKey> = Omit<Row<K>, 'id' | 'createdAt' | 'updatedAt'> &
  Partial<Pick<Row<K> & { createdAt?: string; updatedAt?: string }, never>>;

/** collection → Postgres table. Also used by the migration for consistency. */
export const TABLE_NAMES: Record<CollectionKey, string> = {
  phases: 'ml_phases',
  questions: 'ml_questions',
  evidence: 'ml_evidence',
  evidenceLinks: 'ml_evidence_links',
  hypotheses: 'ml_hypotheses',
  decisions: 'ml_decisions',
  notes: 'ml_notes',
  sources: 'ml_sources',
  queue: 'ml_research_queue',
  personas: 'ml_personas',
  segments: 'ml_segments',
  competitors: 'ml_competitors',
  contentPillars: 'ml_content_pillars',
  roadmapItems: 'ml_roadmap_items',
  strategyOutputs: 'ml_strategy_outputs',
  bookSections: 'ml_book_sections',
};

export interface MarketingRepository {
  /** Human-readable name of the active backend, shown in the UI. */
  readonly backend: 'local' | 'supabase';

  listWorkspaces(): Promise<MLWorkspace[]>;
  createWorkspace(input: Pick<MLWorkspace, 'name' | 'slug' | 'description' | 'color' | 'icon'>): Promise<MLWorkspace>;
  updateWorkspace(id: string, patch: Partial<MLWorkspace>): Promise<MLWorkspace>;
  deleteWorkspace(id: string): Promise<void>;

  /** Everything belonging to one workspace, in a single round trip. */
  loadWorkspaceData(workspaceId: string): Promise<MarketingWorkspaceData>;

  insert<K extends CollectionKey>(collection: K, row: Omit<Row<K>, 'id'>): Promise<Row<K>>;
  update<K extends CollectionKey>(collection: K, id: string, patch: Partial<Row<K>>): Promise<Row<K>>;
  remove(collection: CollectionKey, id: string): Promise<void>;
}
