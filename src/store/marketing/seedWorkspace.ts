// ─────────────────────────────────────────────────────────────────────────
// Workspace scaffolding.
//
// When a workspace is created it gets its research FRAMEWORK: the 14 phases,
// the template questions for each, the 19 empty Marketing Book sections and
// the 5 empty strategy blocks.
//
// It gets no findings. Every question starts `not_started`, with an empty
// response and `none` confidence; every book section and strategy block
// starts empty. There is no seeded evidence, no hypothesis, no decision and
// no note anywhere in this file — those can only come from the researcher,
// which is why the dashboard legitimately shows "No research data yet" on a
// brand-new workspace despite the framework being present.
// ─────────────────────────────────────────────────────────────────────────

import { v4 as uuid } from 'uuid';
import type {
  BookSectionKey,
  MarketingWorkspaceData,
  MLBookSection,
  MLPhase,
  MLQuestion,
  MLStrategyOutput,
  StrategyKey,
} from '../../types/marketing';
import { EMPTY_WORKSPACE_DATA } from '../../types/marketing';
import { PHASE_TEMPLATES } from '../../lib/marketing/phaseTemplates';

export const BOOK_SECTIONS: { key: BookSectionKey; title: string }[] = [
  { key: 'executive_summary', title: 'Executive Summary' },
  { key: 'market_overview', title: 'Market Overview' },
  { key: 'industry_trends', title: 'Industry Trends' },
  { key: 'target_market', title: 'Target Market' },
  { key: 'segmentation', title: 'Segmentation' },
  { key: 'icp', title: 'ICP' },
  { key: 'buyer_personas', title: 'Buyer Personas' },
  { key: 'buying_committee', title: 'Buying Committee' },
  { key: 'customer_journey', title: 'Customer Journey' },
  { key: 'competitive_landscape', title: 'Competitive Landscape' },
  { key: 'positioning', title: 'Positioning' },
  { key: 'messaging', title: 'Messaging' },
  { key: 'linkedin_strategy', title: 'LinkedIn Strategy' },
  { key: 'content_strategy', title: 'Content Strategy' },
  { key: 'visual_strategy', title: 'Visual Strategy' },
  { key: 'measurement', title: 'Measurement' },
  { key: 'roadmap_90_day', title: '90-Day Roadmap' },
  { key: 'research_gaps', title: 'Research Gaps' },
  { key: 'sources', title: 'Sources' },
];

export const STRATEGY_BLOCKS: { key: StrategyKey; title: string; hint: string }[] = [
  { key: 'positioning', title: 'Positioning', hint: 'The category and the claim this company will defend.' },
  { key: 'messaging', title: 'Messaging', hint: 'The language buyers recognise, with proof behind each claim.' },
  { key: 'linkedin', title: 'LinkedIn Strategy', hint: 'How the target personas are actually reached on LinkedIn.' },
  { key: 'visual', title: 'Visual Strategy', hint: 'The visual conventions to keep, and the ones to break.' },
  { key: 'measurement', title: 'Measurement Framework', hint: 'Leading indicators and the kill criteria.' },
];

/** Build the full framework for a workspace. Findings are intentionally empty. */
export function buildWorkspaceSeed(workspaceId: string, now: string): MarketingWorkspaceData {
  const phases: MLPhase[] = [];
  const questions: MLQuestion[] = [];

  for (const template of PHASE_TEMPLATES) {
    const phaseId = uuid();
    phases.push({
      id: phaseId,
      workspaceId,
      key: template.key,
      sortOrder: template.order,
      objective: template.objective,
      createdAt: now,
      updatedAt: now,
    });

    template.questions.forEach((q, i) => {
      questions.push({
        id: uuid(),
        workspaceId,
        phaseId,
        sortOrder: i + 1,
        text: q.text,
        purpose: q.purpose,
        guidance: q.guidance,
        expectedEvidence: q.expectedEvidence,
        response: '',
        status: 'not_started',
        confidence: 'none',
        isTemplate: true,
        createdAt: now,
        updatedAt: now,
      });
    });
  }

  const bookSections: MLBookSection[] = BOOK_SECTIONS.map((s) => ({
    id: uuid(),
    workspaceId,
    key: s.key,
    title: s.title,
    body: '',
    sourceRefs: [],
    generatedBy: 'manual' as const,
    updatedAt: now,
  }));

  const strategyOutputs: MLStrategyOutput[] = STRATEGY_BLOCKS.map((s) => ({
    id: uuid(),
    workspaceId,
    key: s.key,
    body: '',
    sourceRefs: [],
    updatedAt: now,
  }));

  return { ...EMPTY_WORKSPACE_DATA, phases, questions, bookSections, strategyOutputs };
}

/**
 * The two workspaces the product ships with. Only identity — name,
 * description, colour. No research data whatsoever.
 */
export const INITIAL_WORKSPACES = [
  {
    slug: 'teopm',
    name: 'TEOPM',
    description: 'U.S. marketing research — operational visibility and project execution.',
    color: '#8b5cf6',
    icon: '◭',
  },
  {
    slug: 'geo-cx',
    name: 'GEO-CX',
    description: 'U.S. marketing research — customer experience and geospatial operations.',
    color: '#3b82f6',
    icon: '◈',
  },
];
