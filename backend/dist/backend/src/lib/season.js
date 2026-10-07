"use strict";
// ─── Season system: weekly cycles anchored to a fixed epoch ─────────────────
// Seasons align with the cup circuit — each week a new season, new cups, and
// (eventually) ladder resets. Pure date math, no state.
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEASON_MS = exports.SEASON_LENGTH_DAYS = exports.SEASON_EPOCH_MS = void 0;
exports.getSeasonInfo = getSeasonInfo;
/** Monday, 6 January 2025 00:00 UTC — the Season 1 anchor. */
exports.SEASON_EPOCH_MS = Date.UTC(2025, 0, 6);
exports.SEASON_LENGTH_DAYS = 7;
exports.SEASON_MS = exports.SEASON_LENGTH_DAYS * 86400000;
function getSeasonInfo(now = new Date()) {
    const nowMs = now.getTime();
    const elapsed = nowMs - exports.SEASON_EPOCH_MS;
    const week = Math.floor(elapsed / exports.SEASON_MS);
    const season = week + 1;
    const seasonStartMs = exports.SEASON_EPOCH_MS + week * exports.SEASON_MS;
    const endsAtMs = seasonStartMs + exports.SEASON_MS;
    const msLeft = Math.max(0, endsAtMs - nowMs);
    return {
        season,
        endsAt: new Date(endsAtMs),
        daysLeft: Math.floor(msLeft / 86400000),
        hoursLeft: Math.floor((msLeft % 86400000) / 3600000),
        progress: Math.min(1, Math.max(0, (nowMs - seasonStartMs) / exports.SEASON_MS)),
    };
}
//# sourceMappingURL=season.js.map