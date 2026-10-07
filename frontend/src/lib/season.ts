// ─── Season system: weekly cycles anchored to a fixed epoch ─────────────────
// Seasons align with the cup circuit — each week a new season, new cups, and
// (eventually) ladder resets. Pure date math, no state.

/** Monday, 6 January 2025 00:00 UTC — the Season 1 anchor. */
export const SEASON_EPOCH_MS = Date.UTC(2025, 0, 6);
export const SEASON_LENGTH_DAYS = 7;
export const SEASON_MS = SEASON_LENGTH_DAYS * 86400000;

export interface SeasonInfo {
  season: number;
  endsAt: Date;
  daysLeft: number;
  hoursLeft: number;
  /** 0..1 — how far through the current season we are */
  progress: number;
}

export function getSeasonInfo(now: Date = new Date()): SeasonInfo {
  const nowMs = now.getTime();
  const elapsed = nowMs - SEASON_EPOCH_MS;
  const week = Math.floor(elapsed / SEASON_MS);
  const season = week + 1;
  const seasonStartMs = SEASON_EPOCH_MS + week * SEASON_MS;
  const endsAtMs = seasonStartMs + SEASON_MS;
  const msLeft = Math.max(0, endsAtMs - nowMs);
  return {
    season,
    endsAt: new Date(endsAtMs),
    daysLeft: Math.floor(msLeft / 86400000),
    hoursLeft: Math.floor((msLeft % 86400000) / 3600000),
    progress: Math.min(1, Math.max(0, (nowMs - seasonStartMs) / SEASON_MS)),
  };
}
