// ─────────────────────────────────────────────────────────────────────────
// NEXUS's visual identity — one place to point at the avatar asset.
// The source file (public/nexus-papi.png) is used as-is, untouched; only
// CSS (rounded-full + object-cover) shapes it for display. Swapping NEXUS's
// look later means replacing that one file (or this path) — every surface
// that renders NEXUS (chat, the NEXUS home header, the sidebar, the
// "thinking" indicator) reads from this constant, so nothing else changes.
// ─────────────────────────────────────────────────────────────────────────
export const NEXUS_AVATAR_URL = '/nexus-papi.png';
export const NEXUS_NAME = 'NEXUS';
export const NEXUS_TAGLINE = 'The intelligence behind your workflow.';
