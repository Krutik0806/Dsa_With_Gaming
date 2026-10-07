// ─── Tournament circuit: the organized competitive layer ─────────────────────
// Instead of leaning on AI opponents, the arena runs scheduled tournaments —
// knockout cups, arena blitzes and sprints — exactly like esports platforms
// organize ladders for real players. 1v1 matchmaking remains as the "open
// ladder"; cups are where the grind gets structure: brackets, rounds, prizes.

import type { Difficulty } from "@/lib/game";
import type { TournamentSummary } from "@/lib/types";

export const TOURNAMENTS: TournamentSummary[] = [
  {
    slug: "emerald-cup",
    name: "The Emerald Cup",
    tagline: "The weekly flagship. 8-player knockout, code only, winner takes the title.",
    format: "KNOCKOUT",
    gameType: "CODING",
    difficulty: "EASY",
    status: "LIVE",
    maxPlayers: 8,
    playerCount: 6,
    prizeXp: 1000,
    prizeTitle: "Emerald Cup Champion",
    startsIn: "rounds close Sunday 23:59",
    roundsTotal: 3,
    themeColor: "#34d399",
  },
  {
    slug: "lightning-quiz-open",
    name: "Lightning Quiz Open",
    tagline: "Fast fingers, faster recall. A knockout fought entirely in MCQ lightning rounds.",
    format: "KNOCKOUT",
    gameType: "QUIZ",
    difficulty: "EASY",
    status: "LIVE",
    maxPlayers: 8,
    playerCount: 5,
    prizeXp: 600,
    prizeTitle: "Lightning Striker",
    startsIn: "rounds close tonight",
    roundsTotal: 3,
    themeColor: "#fbbf24",
  },
  {
    slug: "midnight-code-sprint",
    name: "Midnight Code Sprint",
    tagline: "After-hours cup. Mediums in the quarters, hards in the final. Bring coffee.",
    format: "KNOCKOUT",
    gameType: "CODING",
    difficulty: "MEDIUM",
    status: "LIVE",
    maxPlayers: 8,
    playerCount: 2,
    prizeXp: 1400,
    prizeTitle: "Night Owl",
    startsIn: "bracket locks at 00:00",
    roundsTotal: 3,
    themeColor: "#a78bfa",
    ratingRequirement: 950,
  },
  {
    slug: "arena-blitz-iv",
    name: "Arena Blitz IV",
    tagline: "Everyone in one room, one hour, unlimited duels — points decide the podium.",
    format: "ARENA",
    gameType: "QUIZ",
    difficulty: "MEDIUM",
    status: "UPCOMING",
    maxPlayers: 64,
    playerCount: 0,
    prizeXp: 2000,
    prizeTitle: "Blitz Runner",
    startsIn: "Saturday 20:00",
    roundsTotal: 1,
    themeColor: "#f472b6",
  },
  {
    slug: "grand-clash-iii",
    name: "Grand Clash III",
    tagline: "Last month's hard-tier cup. dp_dragon took it 3–2 in the final set.",
    format: "KNOCKOUT",
    gameType: "CODING",
    difficulty: "HARD",
    status: "COMPLETED",
    maxPlayers: 8,
    playerCount: 8,
    prizeXp: 1800,
    prizeTitle: "Grand Clasher",
    roundsTotal: 3,
    themeColor: "#ef4444",
    standings: [
      { place: 1, name: "dp_dragon", points: 1470 },
      { place: 2, name: "mutex_max", points: 1395 },
      { place: 3, name: "graph_goblin", points: 1310 },
      { place: 4, name: "recursion_raven", points: 1240 },
      { place: 5, name: "lambda_lord", points: 1180 },
    ],
  },
  {
    slug: "spring-sprint-ii",
    name: "Spring Sprint II",
    tagline: "Quiz marathon season finale — 2,400 questions answered across the field.",
    format: "SPRINT",
    gameType: "QUIZ",
    difficulty: "EASY",
    status: "COMPLETED",
    maxPlayers: 32,
    playerCount: 32,
    prizeXp: 800,
    prizeTitle: "Spring Sprinter",
    roundsTotal: 1,
    themeColor: "#5eead4",
    standings: [
      { place: 1, name: "nullptr_ninja", points: 3120 },
      { place: 2, name: "cache_miss", points: 2985 },
      { place: 3, name: "bfs_baron", points: 2840 },
      { place: 4, name: "heap_hydra", points: 2710 },
      { place: 5, name: "queue_quinn", points: 2595 },
    ],
  },
];

export function getTournament(slug: string): TournamentSummary | undefined {
  return TOURNAMENTS.find((t) => t.slug === slug);
}

export function isPlayable(t: TournamentSummary): boolean {
  // Knockout cups with open registration are playable end-to-end.
  return t.format === "KNOCKOUT" && t.status === "LIVE";
}

/** Round names for an 8-player knockout. */
export function roundName(round: number, roundsTotal: number): string {
  if (roundsTotal === 3) return round === 1 ? "Quarterfinal" : round === 2 ? "Semifinal" : "Final";
  if (roundsTotal === 2) return round === 1 ? "Semifinal" : "Final";
  return "Final";
}

/** Difficulty ramps one tier per round: quarters easy → semis medium → final hard. */
export function difficultyForRound(base: Difficulty, round: number): Difficulty {
  const ladder: Difficulty[] = ["EASY", "MEDIUM", "HARD"];
  const idx = ladder.indexOf(base);
  return ladder[Math.min(ladder.length - 1, Math.max(0, idx + (round - 1)))];
}

/** XP awarded for winning each round (champion also banks the prize pool). */
export const ROUND_XP = [75, 125, 250];

/** Placement label for an eliminated (or champion) entry. */
export function placementLabel(placement: number | null): string {
  if (placement === 1) return "Champion";
  if (placement === 2) return "Runner-up";
  if (placement === 3) return "Semifinalist";
  if (placement === 5) return "Quarterfinalist";
  if (placement === null) return "—";
  return `#${placement}`;
}
