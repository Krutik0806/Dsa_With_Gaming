// ─── Tournament bracket engine (server-only) ─────────────────────────────────
// Generates 8-player knockout brackets and advances them from match results.
// The other seven slots are seeded from the arena's active player pool, so a
// cup is always one click away (in production these are real registrants).

import { BOTS } from "./bots";
import { ROUND_XP, getTournament, roundName } from "./data/tournaments";
import type { BracketMatch, BracketRound, EntryStatus, TournamentOpponent } from "./types";

export interface BracketData {
  rounds: BracketRound[];
  playerName: string;
  players: Record<string, TournamentOpponent>;
}

const PAIRINGS = [
  [0, 7],
  [3, 4],
  [1, 6],
  [2, 5],
];

export function generateBracket(userRating: number, username: string): BracketData {
  // Seven opponents closest to the player's rating, shuffled.
  const pool = [...BOTS].sort((a, b) => Math.abs(a.rating - userRating) - Math.abs(b.rating - userRating)).slice(0, 9);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const opponents = pool.slice(0, 7);

  const userSeed = Math.floor(Math.random() * 8);
  const seeds: (TournamentOpponent & { isUser?: boolean })[] = [];
  let botIdx = 0;
  for (let s = 0; s < 8; s++) {
    if (s === userSeed) seeds.push({ name: username, rating: userRating, skill: 1, tagline: "you", color: "#34d399", isUser: true });
    else {
      const b = opponents[botIdx++];
      const jitter = Math.round((Math.random() - 0.5) * 60);
      seeds.push({ ...b, rating: b.rating + jitter });
    }
  }

  const players: Record<string, TournamentOpponent> = {};
  for (const p of seeds) players[p.name] = { name: p.name, rating: p.rating, skill: p.skill, tagline: p.tagline, color: p.color };

  const qf: BracketMatch[] = PAIRINGS.map(([a, b]) => ({
    a: seeds[a].name,
    b: seeds[b].name,
    scoreA: null,
    scoreB: null,
    winner: null,
  }));
  const sf: BracketMatch[] = [
    { a: "", b: "", scoreA: null, scoreB: null, winner: null },
    { a: "", b: "", scoreA: null, scoreB: null, winner: null },
  ];
  const f: BracketMatch[] = [{ a: "", b: "", scoreA: null, scoreB: null, winner: null }];

  return {
    rounds: [
      { name: "Quarterfinal", matches: qf },
      { name: "Semifinal", matches: sf },
      { name: "Final", matches: f },
    ],
    playerName: username,
    players,
  };
}

export function nextOpponentFor(bracket: BracketData, round: number): TournamentOpponent | null {
  const r = bracket.rounds[round - 1];
  if (!r) return null;
  for (const m of r.matches) {
    if (m.a === bracket.playerName) return bracket.players[m.b] ?? null;
    if (m.b === bracket.playerName) return bracket.players[m.a] ?? null;
  }
  return null;
}

function simulateScore(winnerIsA: boolean, gameType: "CODING" | "QUIZ"): { scoreA: number; scoreB: number } {
  if (gameType === "QUIZ") {
    const hi = 380 + Math.floor(Math.random() * 120);
    const lo = Math.floor(hi * (0.6 + Math.random() * 0.3));
    return winnerIsA ? { scoreA: hi, scoreB: lo } : { scoreA: lo, scoreB: hi };
  }
  const hi = 5 + Math.floor(Math.random() * 3);
  const lo = Math.floor(hi * (0.3 + Math.random() * 0.4));
  return winnerIsA ? { scoreA: hi, scoreB: lo } : { scoreA: lo, scoreB: hi };
}

export interface AdvanceResult {
  bracket: BracketData;
  advanced: boolean;
  status: EntryStatus;
  round: number;
  placement: number | null;
  xpBonus: number;
  eliminatedIn: string | null;
}

/**
 * Record the user's round result and resolve the rest of the bracket.
 * Knockout rules: a win advances, anything else (loss/draw) eliminates —
 * ties in cups go to the opponent on seed order.
 */
export function advanceBracket(
  data: BracketData,
  round: number,
  result: "WIN" | "LOSS" | "DRAW",
  userScore: number,
  opponentScore: number,
  gameType: "CODING" | "QUIZ",
  prizeXp: number
): AdvanceResult {
  const bracket: BracketData = JSON.parse(JSON.stringify(data));
  const roundsTotal = bracket.rounds.length;
  const roundIdx = Math.min(round, roundsTotal) - 1;
  const eliminatedIn = roundName(round, roundsTotal);

  const userMatch = bracket.rounds[roundIdx].matches.find(
    (m) => m.a === bracket.playerName || m.b === bracket.playerName
  );
  const won = result === "WIN";

  if (userMatch) {
    const userIsA = userMatch.a === bracket.playerName;
    userMatch.scoreA = userIsA ? userScore : opponentScore;
    userMatch.scoreB = userIsA ? opponentScore : userScore;
    userMatch.winner = won ? bracket.playerName : userIsA ? userMatch.b : userMatch.a;
  }

  // Resolve the rest of this round (rating-weighted coin flips).
  for (const m of bracket.rounds[roundIdx].matches) {
    if (m.winner) continue;
    if (m.a === bracket.playerName || m.b === bracket.playerName) continue;
    const ra = bracket.players[m.a]?.rating ?? 1200;
    const rb = bracket.players[m.b]?.rating ?? 1200;
    const pA = 1 / (1 + Math.pow(10, (rb - ra) / 400));
    const aWins = Math.random() < pA;
    const { scoreA, scoreB } = simulateScore(aWins, gameType);
    m.scoreA = scoreA;
    m.scoreB = scoreB;
    m.winner = aWins ? m.a : m.b;
  }

  if (!won) {
    return {
      bracket,
      advanced: false,
      status: "ELIMINATED",
      round,
      placement: round === 1 ? 5 : round === 2 ? 3 : 2,
      xpBonus: 0,
      eliminatedIn,
    };
  }

  if (round >= roundsTotal) {
    return {
      bracket,
      advanced: true,
      status: "CHAMPION",
      round,
      placement: 1,
      xpBonus: ROUND_XP[roundIdx] + prizeXp,
      eliminatedIn: null,
    };
  }

  // Populate the next round from winners.
  const winners = bracket.rounds[roundIdx].matches.map((m) => m.winner ?? m.a);
  const next = bracket.rounds[roundIdx + 1];
  for (let i = 0; i < next.matches.length; i++) {
    next.matches[i].a = winners[i * 2] ?? "";
    next.matches[i].b = winners[i * 2 + 1] ?? "";
    next.matches[i].scoreA = null;
    next.matches[i].scoreB = null;
    next.matches[i].winner = null;
  }

  return {
    bracket,
    advanced: true,
    status: "ACTIVE",
    round: round + 1,
    placement: null,
    xpBonus: ROUND_XP[roundIdx],
    eliminatedIn: null,
  };
}

export function tournamentContextFor(slug: string): { name: string; gameType: "CODING" | "QUIZ"; prizeXp: number } | null {
  const t = getTournament(slug);
  if (!t) return null;
  return { name: t.name, gameType: t.gameType, prizeXp: t.prizeXp };
}

export function parseBracket(json: string, fallbackPlayer: string): BracketData {
  try {
    const parsed = JSON.parse(json) as BracketData;
    if (parsed && Array.isArray(parsed.rounds)) {
      return { ...parsed, playerName: parsed.playerName || fallbackPlayer, players: parsed.players ?? {} };
    }
  } catch {
    /* fallthrough */
  }
  return { rounds: [], playerName: fallbackPlayer, players: {} };
}
