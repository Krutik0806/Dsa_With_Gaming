// ─── CodeClash game engine: ranks, levels, ELO, XP ───────────────────────────

export type RankKey =
  | "BRONZE"
  | "SILVER"
  | "GOLD"
  | "PLATINUM"
  | "DIAMOND"
  | "MASTER"
  | "GRANDMASTER";

export interface RankDef {
  key: RankKey;
  name: string;
  min: number;
  max: number;
  color: string; // hex for charts/svg
  text: string; // tailwind text class
  chip: string; // tailwind chip classes
}

export const RANKS: RankDef[] = [
  { key: "BRONZE", name: "Bronze", min: 0, max: 899, color: "#b45309", text: "text-amber-600", chip: "border-amber-700/50 bg-amber-950/50 text-amber-500" },
  { key: "SILVER", name: "Silver", min: 900, max: 1049, color: "#a1a1aa", text: "text-zinc-300", chip: "border-zinc-500/50 bg-zinc-800/60 text-zinc-300" },
  { key: "GOLD", name: "Gold", min: 1050, max: 1199, color: "#fbbf24", text: "text-amber-400", chip: "border-amber-500/50 bg-amber-950/40 text-amber-300" },
  { key: "PLATINUM", name: "Platinum", min: 1200, max: 1399, color: "#5eead4", text: "text-teal-300", chip: "border-teal-400/50 bg-teal-950/40 text-teal-300" },
  { key: "DIAMOND", name: "Diamond", min: 1400, max: 1599, color: "#34d399", text: "text-emerald-400", chip: "border-emerald-500/50 bg-emerald-950/40 text-emerald-300" },
  { key: "MASTER", name: "Master", min: 1600, max: 1799, color: "#f472b6", text: "text-pink-400", chip: "border-pink-500/50 bg-pink-950/40 text-pink-300" },
  { key: "GRANDMASTER", name: "Grandmaster", min: 1800, max: 99999, color: "#ef4444", text: "text-red-400", chip: "border-red-500/50 bg-red-950/40 text-red-300" },
];

export function getRank(rating: number): RankDef {
  return RANKS.find((r) => rating >= r.min && rating <= r.max) ?? RANKS[0];
}

// ─── Levels (XP) ─────────────────────────────────────────────────────────────
// Level thresholds: L1=0, L2=300, L3=700, L4=1200, L5=1800, L6=2500 ...

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  const n = level - 1;
  return 300 * n + 50 * n * (n - 1);
}

export interface LevelInfo {
  level: number;
  intoLevel: number;
  levelSpan: number;
  progress: number; // 0..1
  nextAt: number;
}

export function getLevelInfo(xp: number): LevelInfo {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const span = next - base;
  const into = xp - base;
  return { level, intoLevel: into, levelSpan: span, progress: span > 0 ? into / span : 0, nextAt: next };
}

// ─── ELO ─────────────────────────────────────────────────────────────────────

export const ELO_K = 32;

export function expectedScore(a: number, b: number): number {
  return 1 / (1 + Math.pow(10, (b - a) / 400));
}

export function ratingChange(userRating: number, opponentRating: number, score: number, k = ELO_K): number {
  return Math.round(k * (score - expectedScore(userRating, opponentRating)));
}

export function newRating(rating: number, change: number): number {
  return Math.max(100, rating + change);
}

// ─── XP rewards ──────────────────────────────────────────────────────────────

export const XP_REWARDS = {
  LESSON: 75,
  PROBLEM_EASY: 100,
  PROBLEM_MEDIUM: 200,
  PROBLEM_HARD: 300,
  PROBLEM_REPEAT: 25,
  QUIZ_PLAY: 50,
  QUIZ_WIN: 50,
  CODE_PLAY: 75,
  CODE_WIN: 75,
  CODE_PER_TEST: 5,
} as const;

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export const DIFFICULTY_META: Record<Difficulty, { label: string; chip: string; text: string; color: string }> = {
  EASY: { label: "Easy", chip: "border-emerald-500/40 bg-emerald-950/50 text-emerald-400", text: "text-emerald-400", color: "#34d399" },
  MEDIUM: { label: "Medium", chip: "border-amber-500/40 bg-amber-950/50 text-amber-400", text: "text-amber-400", color: "#fbbf24" },
  HARD: { label: "Hard", chip: "border-red-500/40 bg-red-950/50 text-red-400", text: "text-red-400", color: "#ef4444" },
};

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
