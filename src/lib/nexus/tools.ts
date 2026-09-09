// ─────────────────────────────────────────────────────────────────────────
// NEXUS ACTIONS — the tools NEXUS may propose. Every one of these renders as
// a confirm/cancel ActionCard (see components/nexus/ActionCard.tsx); NONE
// of them execute automatically, creation included — matching the product
// spec's own example dialogues.
//
// Tasks are addressed by title (fuzzy-matched at confirm time) rather than
// internal id, since that's the only handle the model actually has from
// conversation + context text.
// ─────────────────────────────────────────────────────────────────────────

export interface NexusToolDeclaration {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description?: string; enum?: string[] }>;
    required?: string[];
  };
}

export const NEXUS_TOOLS: NexusToolDeclaration[] = [
  {
    name: 'createTask',
    description: 'Propose creating a new task. Always show this as a confirmation card — never assume it was created.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Short task name' },
        description: { type: 'string', description: 'Optional longer description' },
        projectName: { type: 'string', description: 'Project to attach this to, e.g. "TEOPM", "WMS", "Personal", "Michiverso" — omit if none fits' },
        category: { type: 'string', enum: ['Design', 'Marketing', 'Meetings', 'Admin', 'Content', 'Personal', 'General'] },
        priority: { type: 'string', enum: ['Low', 'Medium', 'High'] },
        dueDate: { type: 'string', description: 'ISO date yyyy-MM-dd, or "today"/"tomorrow"' },
        dueTime: {
          type: 'string',
          description: 'HH:mm 24h, optional — the start/clock-in time. Set together with endTime to log TEOPM hours; no timer involved.',
        },
        endTime: { type: 'string', description: 'HH:mm 24h, optional — the end/clock-out time, paired with dueTime.' },
        estimatedMinutes: { type: 'number', description: 'Estimated duration in minutes' },
        tags: {
          type: 'string',
          description: 'Comma-separated tags, e.g. "TEOPM" or "WORK" — a TEOPM or WORK tag is what makes this task count toward the TEOPM workday total.',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'updateTask',
    description: "Propose changing an existing task's fields. Identify the task by its current title.",
    parameters: {
      type: 'object',
      properties: {
        taskTitle: { type: 'string', description: 'The exact or closest-matching title of the task to update' },
        priority: { type: 'string', enum: ['Low', 'Medium', 'High'] },
        status: { type: 'string', enum: ['To Do', 'Today', 'In Progress', 'Review', 'Done'] },
        dueDate: { type: 'string' },
        dueTime: { type: 'string', description: 'HH:mm 24h — changing this recalculates TEOPM duration immediately alongside endTime.' },
        endTime: { type: 'string', description: 'HH:mm 24h' },
        estimatedMinutes: { type: 'number' },
        tags: { type: 'string', description: 'Comma-separated tags — replaces the task\'s tag list' },
      },
      required: ['taskTitle'],
    },
  },
  {
    name: 'completeTask',
    description: 'Propose marking a task as completed (awards XP, logs activity).',
    parameters: {
      type: 'object',
      properties: { taskTitle: { type: 'string', description: 'The title of the task to complete' } },
      required: ['taskTitle'],
    },
  },
  {
    name: 'createProject',
    description: 'Propose creating a new project.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
      },
      required: ['name'],
    },
  },
  {
    name: 'createIdea',
    description: 'Propose saving a new idea to the Ideas Vault.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        tags: { type: 'string', description: 'Comma-separated tags' },
      },
      required: ['title'],
    },
  },
  {
    name: 'createCalendarEvent',
    description: 'Propose adding an event to the calendar.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        date: { type: 'string', description: 'ISO date yyyy-MM-dd, or "today"/"tomorrow"' },
        startTime: { type: 'string', description: 'HH:mm 24h' },
        endTime: { type: 'string', description: 'HH:mm 24h' },
      },
      required: ['title', 'date', 'startTime', 'endTime'],
    },
  },
  {
    name: 'startTimer',
    description: 'Propose starting a focus timer for a category/project.',
    parameters: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'e.g. Design, TEOPM, Marketing, Meetings, Personal' },
        projectName: { type: 'string' },
      },
      required: ['category'],
    },
  },
  {
    name: 'stopTimer',
    description: 'Propose stopping the currently running timer.',
    parameters: { type: 'object', properties: {} },
  },
];
