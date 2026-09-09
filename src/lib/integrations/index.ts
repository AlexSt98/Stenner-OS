// ─────────────────────────────────────────────────────────────────────────
// Integration placeholders.
//
// None of these are wired to real credentials. They exist so V2 can plug in
// Google OAuth, a Postgres-backed API, or an AI provider without touching
// the rest of the app — every call site already goes through here.
// ─────────────────────────────────────────────────────────────────────────

export interface IntegrationStatus {
  connected: boolean;
  lastSyncedAt: string | null;
}

/** Google Calendar — two-way sync for CalendarEvent[]. Needs OAuth client id/secret. */
export const googleCalendar = {
  async connect(): Promise<IntegrationStatus> {
    throw new Error('Google Calendar is not configured yet — no OAuth credentials present.');
  },
  async pull() {
    return [];
  },
  async push() {
    /* no-op until connected */
  },
};

/** Google Drive — attach references/files to Ideas and Boards. */
export const googleDrive = {
  async connect(): Promise<IntegrationStatus> {
    throw new Error('Google Drive is not configured yet.');
  },
};

/** Gmail — turn emails into Tasks/Ideas. */
export const gmail = {
  async connect(): Promise<IntegrationStatus> {
    throw new Error('Gmail is not configured yet.');
  },
};

/**
 * Data layer seam: today `persistence` is LocalStorage (see store/useStore.ts's
 * zustand `persist` middleware). Swapping to PostgreSQL means implementing this
 * interface with real HTTP calls and pointing the store's storage engine at it —
 * the Task/Project/Event/... shapes in src/types don't need to change.
 */
export interface RemotePersistenceAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** AI — task suggestions, idea summarization, auto-scheduling. Needs an API key. */
export const ai = {
  async suggestNextTask(): Promise<null> {
    return null;
  },
};

/** Outbound webhooks fired on Activity events (task completed, project updated, ...). */
export const webhooks = {
  registered: [] as string[],
  async fire(_eventType: string, _payload: unknown) {
    /* no-op until webhook URLs are registered */
  },
};
