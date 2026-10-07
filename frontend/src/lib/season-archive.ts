// ─── Season archive: deterministic past-season records ─────────────────────
// Seasons are weekly (see season.ts). This module reconstructs plausible
// historical records for past seasons — champions drawn from the bot roster
// via a deterministic hash of the season number, so every render agrees.

import { BOTS } from "./bots";
import { getSeasonInfo, SEASON_EPOCH_MS, SEASON_MS } from "./season";

export interface PastSeasonRecord {
  season: number;
  /** Season start date. */
  startAt: string;
  champion: { name: string; rating: number; tagline: string; color: string };
  finalist: { name: string; rating: number; tagline: string; color: string };
  /** Final ratings of the top 4 — for a mini standings strip. */
  topFour: { name: string; rating: number; color: string }[];
  /** Headline matches played in the arena that week (deterministic). */
  matchesPlayed: number;
  /** The cup that anchored the week. */
  cupName: string;
}

const CUP_ROTATION = [
  "Lightning Quiz Open",
  "Emerald Cup",
  "Midnight Sprint",
  "Algorithms Royale",
  "Bronze Brawl",
  "Diamond Duel",
];

function hash(n: number): number {
  let x = (n * 2654435761) % 4294967296;
  x ^= x >>> 13;
  x = (x * 1274126177) % 4294967296;
  x ^= x >>> 16;
  return x >>> 0;
}

function botAt(index: number): (typeof BOTS)[number] {
  return BOTS[index % BOTS.length];
}

/**
 * A plausible ladder field for a season: ratings jittered around today's
 * roster so past champions read like a real evolving circuit.
 */
function seasonField(season: number): { name: string; rating: number; tagline: string; color: string }[] {
  const h = hash(season);
  return BOTS.map((b, i) => ({
    name: b.name,
    rating: Math.max(900, b.rating + ((hash(season * 31 + i) % 121) - 60)),
    tagline: b.tagline,
    color: b.color,
  })).sort((a, b) => b.rating - a.rating + ((h % 7) - 3));
}

export function getPastSeasons(count = 8): PastSeasonRecord[] {
  const current = getSeasonInfo().season;
  const records: PastSeasonRecord[] = [];
  for (let s = current - 1; s >= Math.max(1, current - count); s--) {
    const field = seasonField(s);
    // rotate the champion seat deterministically — no bot dominates forever
    const champIdx = hash(s * 7) % Math.min(6, field.length);
    const champion = field[champIdx];
    const finalist = field.find((f) => f.name !== champion.name) ?? field[1];
    const topFour = field.slice(0, 4).map((f) => ({ name: f.name, rating: f.rating, color: f.color }));
    const startMs = SEASON_EPOCH_MS + (s - 1) * SEASON_MS;
    records.push({
      season: s,
      startAt: new Date(startMs).toISOString(),
      champion,
      finalist,
      topFour,
      matchesPlayed: 320 + (hash(s * 13) % 480),
      cupName: CUP_ROTATION[hash(s * 17) % CUP_ROTATION.length],
    });
  }
  return records;
}

/** Percentile of a rating against the deterministic current-season field. */
export function seasonPercentile(rating: number): { pct: number; label: string } {
  const field = seasonField(getSeasonInfo().season).map((b) => b.rating);
  const below = field.filter((r) => rating >= r).length;
  const pct = Math.round((below / field.length) * 100);
  const label = pct >= 90 ? "title contender" : pct >= 70 ? "playoff lock" : pct >= 40 ? "mid-pack fighter" : "on the climb";
  return { pct: Math.min(99, Math.max(1, pct)), label };
}

export interface SeasonArchiveResponse {
  current: {
    season: number;
    daysLeft: number;
    hoursLeft: number;
    progress: number;
    endsAt: string;
  };
  yourStanding: { pct: number; label: string; rating: number };
  pastSeasons: PastSeasonRecord[];
}

export function getSeasonArchive(userRating: number): SeasonArchiveResponse {
  const info = getSeasonInfo();
  const standing = seasonPercentile(userRating);
  return {
    current: {
      season: info.season,
      daysLeft: info.daysLeft,
      hoursLeft: info.hoursLeft,
      progress: info.progress,
      endsAt: info.endsAt.toISOString(),
    },
    yourStanding: { ...standing, rating: userRating },
    pastSeasons: getPastSeasons(8),
  };
}
