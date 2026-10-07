// ─── Professional ELO Rating Engine ─────────────────────────────────────────────
// Implements standard logistic distribution curve, adaptive K-factor,
// tier & division ladders, streak momentum, and win-rate estimation.

export type RankTierName =
  | "Bronze"
  | "Silver"
  | "Gold"
  | "Platinum"
  | "Diamond"
  | "Master"
  | "Grandmaster";

export interface RankTierInfo {
  tier: RankTierName;
  division?: string; // "IV" | "III" | "II" | "I" or undefined for Master+
  fullName: string;
  badgeColor: string;
  minRating: number;
  maxRating: number;
  progressPercent: number; // 0 to 100% toward next division/tier
  pointsToNext: number;
}

export interface EloMatchParams {
  playerRating: number;
  opponentRating: number;
  score: 1 | 0.5 | 0; // 1 = Win, 0.5 = Draw, 0 = Loss
  gamesPlayed?: number;
  currentStreak?: number; // positive = win streak, negative = loss streak
}

export interface EloMatchResult {
  oldRating: number;
  newRating: number;
  delta: number;
  expectedScore: number;
  expectedWinPct: number;
  kFactor: number;
  streakBonus: number;
  oldTier: RankTierInfo;
  newTier: RankTierInfo;
  promoted: boolean;
  demoted: boolean;
}

// ── Expected Score (Logistic Distribution) ──────────────────────────────────
export function calculateExpectedScore(playerRating: number, opponentRating: number): number {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
}

export function getWinProbability(playerRating: number, opponentRating: number): number {
  const exp = calculateExpectedScore(playerRating, opponentRating);
  return Math.round(exp * 1000) / 10; // e.g. 64.3%
}

// ── Adaptive K-Factor ───────────────────────────────────────────────────────
export function getAdaptiveKFactor(gamesPlayed = 30, rating = 1200): number {
  if (gamesPlayed < 20) {
    return 40; // Placement / provisional rapid calibration
  }
  if (rating >= 2000) {
    return 16; // Master / Grandmaster high-stakes stability
  }
  return 32; // Standard competitive play
}

// ── Tier & Division Ladder ──────────────────────────────────────────────────
interface TierBracket {
  tier: RankTierName;
  min: number;
  max: number;
  color: string;
  divisions?: number; // 4 divisions per tier (IV to I)
}

const TIER_BRACKETS: TierBracket[] = [
  { tier: "Bronze", min: 0, max: 999, color: "#cd7f32", divisions: 4 },
  { tier: "Silver", min: 1000, max: 1199, color: "#94a3b8", divisions: 4 },
  { tier: "Gold", min: 1200, max: 1499, color: "#eab308", divisions: 4 },
  { tier: "Platinum", min: 1500, max: 1799, color: "#06b6d4", divisions: 4 },
  { tier: "Diamond", min: 1800, max: 2099, color: "#8b5cf6", divisions: 4 },
  { tier: "Master", min: 2100, max: 2399, color: "#ec4899" },
  { tier: "Grandmaster", min: 2400, max: 9999, color: "#ef4444" },
];

const ROMAN_DIVISIONS = ["IV", "III", "II", "I"];

export function getRankTier(rating: number): RankTierInfo {
  const clampedRating = Math.max(0, rating);
  const bracket =
    TIER_BRACKETS.find((b) => clampedRating >= b.min && clampedRating <= b.max) ||
    TIER_BRACKETS[TIER_BRACKETS.length - 1];

  if (!bracket.divisions) {
    const isGM = bracket.tier === "Grandmaster";
    const span = bracket.max - bracket.min;
    const progress = isGM ? 100 : Math.min(100, Math.round(((clampedRating - bracket.min) / span) * 100));
    const pointsToNext = isGM ? 0 : Math.max(0, bracket.max + 1 - clampedRating);
    return {
      tier: bracket.tier,
      fullName: bracket.tier,
      badgeColor: bracket.color,
      minRating: bracket.min,
      maxRating: bracket.max,
      progressPercent: progress,
      pointsToNext,
    };
  }

  const range = bracket.max - bracket.min + 1;
  const divSpan = range / bracket.divisions;
  const offset = clampedRating - bracket.min;
  const divIdx = Math.min(bracket.divisions - 1, Math.floor(offset / divSpan));
  const division = ROMAN_DIVISIONS[divIdx];
  const divMin = Math.round(bracket.min + divIdx * divSpan);
  const divMax = Math.round(bracket.min + (divIdx + 1) * divSpan - 1);

  const intoDiv = clampedRating - divMin;
  const progressPercent = Math.min(100, Math.max(0, Math.round((intoDiv / divSpan) * 100)));
  const pointsToNext = Math.max(1, divMax + 1 - clampedRating);

  return {
    tier: bracket.tier,
    division,
    fullName: `${bracket.tier} ${division}`,
    badgeColor: bracket.color,
    minRating: divMin,
    maxRating: divMax,
    progressPercent,
    pointsToNext,
  };
}

// ── Complete Match Calculation ──────────────────────────────────────────────
export function calculateEloMatch(params: EloMatchParams): EloMatchResult {
  const { playerRating, opponentRating, score, gamesPlayed = 30, currentStreak = 0 } = params;

  const expected = calculateExpectedScore(playerRating, opponentRating);
  const k = getAdaptiveKFactor(gamesPlayed, playerRating);

  let rawDelta = k * (score - expected);

  // Apply win streak momentum bonus (only on victory)
  let streakBonus = 0;
  if (score === 1 && currentStreak >= 2) {
    if (currentStreak >= 4) {
      streakBonus = Math.round(rawDelta * 0.25); // +25% bonus for 5+ win streak
    } else {
      streakBonus = Math.round(rawDelta * 0.12); // +12% bonus for 3-4 win streak
    }
  }

  let finalDelta = Math.round(rawDelta + streakBonus);

  // Guarantee minimum movement of ±1 point unless exact draw with identical ratings
  if (score === 1 && finalDelta < 1) finalDelta = 1;
  if (score === 0 && finalDelta > -1) finalDelta = -1;

  const oldRating = playerRating;
  const newRating = Math.max(100, oldRating + finalDelta);
  const actualDelta = newRating - oldRating;

  const oldTier = getRankTier(oldRating);
  const newTier = getRankTier(newRating);

  const promoted = newTier.minRating > oldTier.minRating;
  const demoted = newTier.maxRating < oldTier.maxRating;

  return {
    oldRating,
    newRating,
    delta: actualDelta,
    expectedScore: expected,
    expectedWinPct: Math.round(expected * 1000) / 10,
    kFactor: k,
    streakBonus,
    oldTier,
    newTier,
    promoted,
    demoted,
  };
}
