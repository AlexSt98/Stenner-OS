// ─────────────────────────────────────────────────────────────────────────
// MARKETING LAB — data models
//
// Marketing Lab is a research instrument, not a marketing dashboard. Its
// whole shape follows one pipeline:
//
//   RESEARCH → EVIDENCE → HYPOTHESIS → VALIDATION → DECISION → STRATEGY → BOOK
//
// Two rules govern everything below.
//
// 1. Nothing derivable is stored. Research gaps, progress, "what we know",
//    "what we don't know" and the next research action are all COMPUTED
//    (see lib/marketing/*.ts). Persisting them would desynchronise them the
//    moment a single answer changes. This mirrors how STENNER OS already
//    treats DailyWorkday and EnglishProgress — documented types that are
//    deliberately never written down.
//
// 2. Every record carries workspaceId. That is what keeps TEOPM and GEO-CX
//    logically isolated: no selector ever reads across workspaces, and in
//    Supabase every row additionally carries user_id under RLS.
//
// These shapes are the contract for both persistence adapters (see
// store/marketing/repository.ts) and map 1:1 onto the Supabase tables in
// supabase/migrations/0001_marketing_lab.sql.
// ─────────────────────────────────────────────────────────────────────────

/** The 14 research phases. Order is fixed; see lib/marketing/phaseTemplates.ts. */
export type PhaseKey =
  | 'foundation'
  | 'us_market'
  | 'segmentation'
  | 'icp'
  | 'buyer_personas'
  | 'buying_committee'
  | 'customer_journey'
  | 'competition'
  | 'positioning'
  | 'messaging'
  | 'linkedin'
  | 'content_visual'
  | 'measurement'
  | 'roadmap';

/**
 * A question's lifecycle. The two terminal states carry real meaning:
 * `validated` means evidence backs the answer, `decided` means a decision
 * was recorded on it. Only those two let a question count as knowledge —
 * writing a response alone never does (see lib/marketing/knowledge.ts).
 */
export type QuestionStatus = 'not_started' | 'in_progress' | 'needs_evidence' | 'validated' | 'decided';

export type HypothesisStatus = 'open' | 'testing' | 'supported' | 'rejected' | 'validated';

export type Confidence = 'none' | 'low' | 'medium' | 'high';

export type SourceType =
  | 'official'
  | 'government'
  | 'industry_report'
  | 'competitor'
  | 'customer'
  | 'linkedin'
  | 'interview'
  | 'internal'
  | 'other';

export type NoteType = 'note' | 'idea' | 'question' | 'concern' | 'opportunity' | 'observation';

/** How a piece of evidence relates to what it is attached to. */
export type EvidenceStance = 'supports' | 'contradicts' | 'context';

export type Priority = 'high' | 'medium' | 'low';

export type QueueStatus = 'todo' | 'doing' | 'done';

export type WorkspaceMode = 'research' | 'strategy';

/**
 * Epistemic status of a statement in the Marketing Book. The book must never
 * present a hypothesis as a fact, so every claim it renders is tagged.
 */
export type ClaimKind = 'fact' | 'inference' | 'hypothesis' | 'decision';

export type StrategyKey = 'positioning' | 'messaging' | 'linkedin' | 'visual' | 'measurement';

// ─────────────────────────────────────────────────────────────────────────
// Core entities
// ─────────────────────────────────────────────────────────────────────────

export interface MLWorkspace {
  id: string;
  slug: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  status: 'active' | 'paused' | 'archived';
  /**
   * Optional link to an existing STENNER OS Project. Deliberately optional
   * and deliberately NOT a reuse of that entity: `Project` already means a
   * work project (proj-teopm is wired into selectors.ts and the Workday
   * module), while a workspace is a research subject.
   */
  linkedProjectId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MLPhase {
  id: string;
  workspaceId: string;
  key: PhaseKey;
  sortOrder: number;
  /** Copied from the template on creation, then editable per workspace. */
  objective: string;
  createdAt: string;
  updatedAt: string;
}

export interface MLQuestion {
  id: string;
  workspaceId: string;
  phaseId: string;
  sortOrder: number;
  /** The question itself. */
  text: string;
  /** Why this question is worth answering — what it unblocks. */
  purpose: string;
  /** How to go about answering it. */
  guidance: string;
  /** What would count as a good answer, evidence-wise. */
  expectedEvidence: string;
  /** The researcher's synthesised answer. Never knowledge on its own. */
  response: string;
  status: QuestionStatus;
  confidence: Confidence;
  /** True for questions that came from the phase template, false for custom ones. */
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MLEvidence {
  id: string;
  workspaceId: string;
  phaseId: string | null;
  questionId: string | null;
  title: string;
  description: string;
  url: string;
  sourceName: string;
  sourceType: SourceType;
  /** When the source itself was published, not when it was captured. */
  sourceDate: string | null;
  confidence: Confidence;
  createdAt: string;
  updatedAt: string;
}

export interface MLHypothesis {
  id: string;
  workspaceId: string;
  phaseId: string | null;
  questionId: string | null;
  statement: string;
  status: HypothesisStatus;
  confidence: Confidence;
  /** Filled in when the hypothesis resolves. */
  conclusion: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Join between a piece of evidence and what it bears on. A bridge table
 * rather than two id arrays, because the same evidence can support one
 * hypothesis while contradicting another — a stance belongs to the LINK,
 * not to the evidence.
 */
export interface MLEvidenceLink {
  id: string;
  workspaceId: string;
  evidenceId: string;
  targetType: 'hypothesis' | 'question' | 'decision';
  targetId: string;
  stance: EvidenceStance;
  createdAt: string;
}

export interface MLDecision {
  id: string;
  workspaceId: string;
  phaseId: string | null;
  questionId: string | null;
  title: string;
  reason: string;
  impact: string;
  decidedAt: string;
  decidedBy: string;
  /** Points at the decision this one overrides, if any. */
  supersedesId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MLNote {
  id: string;
  workspaceId: string;
  phaseId: string | null;
  questionId: string | null;
  type: NoteType;
  body: string;
  pinned: boolean;
  createdAt: string;
}

export interface MLSource {
  id: string;
  workspaceId: string;
  name: string;
  type: SourceType;
  url: string;
  credibility: Confidence;
  notes: string;
  createdAt: string;
}

export interface MLQueueItem {
  id: string;
  workspaceId: string;
  phaseId: string | null;
  title: string;
  reason: string;
  priority: Priority;
  status: QueueStatus;
  /** 'manual' was typed by hand; 'derived' was promoted from a computed gap. */
  origin: 'manual' | 'derived';
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Strategy mode — consolidated output only.
//
// Nothing reaches these tables automatically. A hypothesis never becomes
// strategy on its own; someone has to write the conclusion here.
// ─────────────────────────────────────────────────────────────────────────

export interface MLPersona {
  id: string;
  workspaceId: string;
  name: string;
  role: string;
  goals: string;
  pains: string;
  triggers: string;
  objections: string;
  channels: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface MLSegment {
  id: string;
  workspaceId: string;
  name: string;
  criteria: string;
  sizeEstimate: string;
  fitScore: number; // 0-100
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface MLCompetitor {
  id: string;
  workspaceId: string;
  name: string;
  url: string;
  positioning: string;
  strengths: string;
  weaknesses: string;
  pricingNotes: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface MLContentPillar {
  id: string;
  workspaceId: string;
  name: string;
  rationale: string;
  formats: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface MLRoadmapItem {
  id: string;
  workspaceId: string;
  title: string;
  horizon: 'days_0_30' | 'days_31_60' | 'days_61_90';
  owner: string;
  outcome: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** Narrative strategy blocks (positioning, messaging, …) — one row per key. */
export interface MLStrategyOutput {
  id: string;
  workspaceId: string;
  key: StrategyKey;
  body: string;
  /** Question / decision / evidence ids this was built from. */
  sourceRefs: string[];
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Marketing Book
// ─────────────────────────────────────────────────────────────────────────

export type BookSectionKey =
  | 'executive_summary'
  | 'market_overview'
  | 'industry_trends'
  | 'target_market'
  | 'segmentation'
  | 'icp'
  | 'buyer_personas'
  | 'buying_committee'
  | 'customer_journey'
  | 'competitive_landscape'
  | 'positioning'
  | 'messaging'
  | 'linkedin_strategy'
  | 'content_strategy'
  | 'visual_strategy'
  | 'measurement'
  | 'roadmap_90_day'
  | 'research_gaps'
  | 'sources';

export interface MLBookSection {
  id: string;
  workspaceId: string;
  key: BookSectionKey;
  title: string;
  body: string;
  sourceRefs: string[];
  generatedBy: 'manual' | 'derived';
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Computed shapes — never persisted. See lib/marketing/.
// ─────────────────────────────────────────────────────────────────────────

/** A single missing piece of research, detected from real records only. */
export interface ResearchGap {
  id: string;
  kind: 'unanswered_question' | 'missing_evidence' | 'unresolved_hypothesis' | 'blocked_decision' | 'uncertain_assumption';
  priority: Priority;
  title: string;
  /** Why this is a gap, in plain language. Never a generic recommendation. */
  reason: string;
  /** The concrete next step that would close it. */
  nextAction: string;
  phaseKey: PhaseKey;
  phaseLabel: string;
  /** Where [Start Research] should navigate to. */
  targetPath: string;
}

export interface PhaseProgress {
  phaseKey: PhaseKey;
  /** 0-100, from question statuses only. */
  percent: number;
  total: number;
  answered: number;
  validated: number;
  decided: number;
  needsEvidence: number;
  notStarted: number;
}

/** One line in WHAT WE KNOW, always traceable back to its backing. */
export interface KnownItem {
  id: string;
  kind: ClaimKind;
  statement: string;
  phaseKey: PhaseKey;
  phaseLabel: string;
  evidenceCount: number;
  confidence: Confidence;
  targetPath: string;
}

/** One line in WHAT WE DON'T KNOW. */
export interface UnknownItem {
  id: string;
  kind: 'unanswered_question' | 'missing_evidence' | 'unresolved_hypothesis' | 'uncertain_assumption' | 'blocked_decision';
  statement: string;
  phaseKey: PhaseKey;
  phaseLabel: string;
  targetPath: string;
}

export interface NextResearchAction {
  title: string;
  reason: string;
  phaseKey: PhaseKey;
  phaseLabel: string;
  priority: Priority;
  targetPath: string;
}

/** Everything a workspace holds, as loaded by the repository in one go. */
export interface MarketingWorkspaceData {
  phases: MLPhase[];
  questions: MLQuestion[];
  evidence: MLEvidence[];
  evidenceLinks: MLEvidenceLink[];
  hypotheses: MLHypothesis[];
  decisions: MLDecision[];
  notes: MLNote[];
  sources: MLSource[];
  queue: MLQueueItem[];
  personas: MLPersona[];
  segments: MLSegment[];
  competitors: MLCompetitor[];
  contentPillars: MLContentPillar[];
  roadmapItems: MLRoadmapItem[];
  strategyOutputs: MLStrategyOutput[];
  bookSections: MLBookSection[];
}

export const EMPTY_WORKSPACE_DATA: MarketingWorkspaceData = {
  phases: [],
  questions: [],
  evidence: [],
  evidenceLinks: [],
  hypotheses: [],
  decisions: [],
  notes: [],
  sources: [],
  queue: [],
  personas: [],
  segments: [],
  competitors: [],
  contentPillars: [],
  roadmapItems: [],
  strategyOutputs: [],
  bookSections: [],
};
