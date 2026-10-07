import type { Difficulty } from "./game";
import type { LangId } from "./languages";
export interface UserSummary {
    id: string;
    username: string;
    isGuest: boolean;
    xp: number;
    rating: number;
    wins: number;
    losses: number;
    draws: number;
    quizWins: number;
    codeWins: number;
    coins: number;
    freezes: number;
    equippedFrame: string | null;
    equippedTitle: string | null;
    createdAt: string;
}
export type MatchType = "QUIZ" | "CODING";
export type MatchResult = "WIN" | "LOSS" | "DRAW";
export interface MatchSummary {
    id: string;
    type: MatchType;
    result: MatchResult;
    opponentName: string;
    opponentRating: number;
    ratingChange: number;
    xpEarned: number;
    score: number;
    opponentScore: number;
    problemTitle: string | null;
    durationSec: number;
    createdAt: string;
    /** Set when the match was played inside a tournament bracket. */
    tournamentName?: string | null;
    /** True when the opponent was a real player from the live queue. */
    human?: boolean;
}
export interface QuizReviewItem {
    questionId: string;
    category: string;
    question: string;
    options: string[];
    answer: number;
    userAnswer: number;
    botAnswer: number;
    userCorrect: boolean;
    botCorrect: boolean;
    userTimeMs: number;
    points: number;
}
export interface QuizMatchDetails {
    totalQuestions: number;
    review: QuizReviewItem[];
    userAccuracy: number;
    botAccuracy: number;
    avgResponseMs: number;
    /** True when the opponent was a real player matched through the live queue. */
    human?: boolean;
    /** Question-set seed shared by both live players (human matches only). */
    seed?: number;
}
export interface CodeTestResult {
    passed: boolean;
    args: unknown[];
    expected: unknown;
    got: unknown;
    error?: string;
    logs: string[];
}
export interface CodeRunResponse {
    ok: boolean;
    compileError?: string;
    /** Plain-language fix hint derived from the compiler/runtime error. */
    suggestion?: string;
    results: CodeTestResult[];
    passed: number;
    total: number;
    timeMs: number;
    /** Language the code was judged as. */
    language: LangId;
}
export interface BotEvent {
    t: number;
    label: string;
}
export interface CodingMatchDetails {
    problemSlug: string;
    problemTitle: string;
    difficulty: Difficulty;
    durationSec: number;
    totalTests: number;
    userTestsPassed: number;
    userSubmissions: number;
    userSolvedAtSec: number | null;
    botSolvedAtSec: number | null;
    botEvents: BotEvent[];
    finalCode: string;
    botCode: string;
    errors: string[];
    language?: string;
    /** True when the opponent was a real player matched through the live queue. */
    human?: boolean;
    /** Problem-set seed shared by both live players (human matches only). */
    seed?: number;
}
export interface LeaderboardEntry {
    id: string;
    name: string;
    rating: number;
    wins: number;
    losses: number;
    draws: number;
    level: number;
    isBot: boolean;
    isMe: boolean;
    /** Total XP — used by the leaderboard metric tabs. */
    xp: number;
    /** Current activity streak in days (0 when unknown). */
    streak: number;
}
export interface SkillStat {
    category: string;
    value: number;
}
export type AchievementCategory = "combat" | "mastery" | "cups" | "grind";
export type AchievementRarity = "common" | "rare" | "epic" | "legendary";
export interface Achievement {
    key: string;
    name: string;
    description: string;
    icon: string;
    unlocked: boolean;
    category: AchievementCategory;
    rarity: AchievementRarity;
    /** current/target for progressive achievements — omitted for pure booleans */
    progress?: {
        current: number;
        target: number;
    };
}
export interface ProfileResponse {
    user: UserSummary;
    level: number;
    levelInto: number;
    levelSpan: number;
    skills: SkillStat[];
    achievements: Achievement[];
    lessonsCompleted: number;
    lessonsTotal: number;
    problemsSolved: number;
    problemsTotal: number;
    recentMatches: MatchSummary[];
    /** Rating after each rated match, oldest first (drives the trajectory chart). */
    ratingHistory: RatingPoint[];
    streak: StreakState;
    /** Latest coin mutations (ledger), newest first — drives the coin activity feed. */
    transactions: LedgerEntry[];
    wallet: {
        coins: number;
        freezes: number;
        equippedFrameName: string | null;
        equippedTitleName: string | null;
        purchases: PurchaseLogEntry[];
    };
    tournaments: {
        entered: number;
        championships: number;
        bestPlacement: number | null;
        history: {
            slug: string;
            name: string;
            status: "ACTIVE" | "ELIMINATED" | "CHAMPION";
            placement: number | null;
            round: number;
            gameType: "CODING" | "QUIZ";
        }[];
    };
}
export interface RatingPoint {
    /** Rating immediately after this match. */
    rating: number;
    change: number;
    result: MatchResult;
    opponent: string;
    type: MatchType;
    problemTitle: string | null;
    at: string;
}
export interface StreakState {
    count: number;
    activeToday: boolean;
    alive: boolean;
    multiplier: number;
    multiplierLabel: string;
    bonusPct: number;
    daysToNextTier: number | null;
    nextTierLabel: string | null;
    nextTierBonusPct: number | null;
    /** Streak-freeze consumables currently banked. */
    freezes: number;
    /** True when the current gap is covered by freezes (streak will continue). */
    freezeProtected: boolean;
    /** Freezes that will be consumed by the next activity touch. */
    freezesToConsume: number;
}
export interface StreakResponse {
    state: StreakState;
    checkInXp?: number;
    user?: UserSummary;
    checkInBonus?: number;
    alreadyCheckedIn?: boolean;
    coinsEarned?: number;
    freezesConsumed?: number;
}
export interface ProgressResponse {
    lessons: string[];
    problems: string[];
    dailyDone: boolean;
    coinsEarned?: number;
}
export type ShopItemKind = "CONSUMABLE" | "FRAME" | "TITLE";
export interface ShopItemView {
    id: string;
    kind: ShopItemKind;
    name: string;
    description: string;
    cost: number;
    accent: string;
    flair?: string;
    owned: boolean;
    count?: number;
    equipped: boolean;
    affordable: boolean;
}
export interface PurchaseLogEntry {
    id: string;
    itemId: string;
    itemName: string;
    kind: ShopItemKind;
    cost: number;
    at: string;
}
export interface ShopResponse {
    coins: number;
    freezes: number;
    items: ShopItemView[];
    purchases: PurchaseLogEntry[];
    equippedFrame: string | null;
    equippedTitle: string | null;
}
export interface LedgerEntry {
    id: string;
    /** Positive = earned, negative = spent. */
    amount: number;
    /** Faucet tag: MATCH_WIN | MATCH_DRAW | MATCH_LOSS | CUP_ROUND | CUP_CHAMPION | DAILY_CHECKIN | DAILY_CHALLENGE | SHOP_PURCHASE | SEED | SEASON. */
    source: string;
    description: string;
    at: string;
}
export interface DailyBonusInfo {
    dailyBonus: number;
    streakBonus: number;
}
export type TournamentFormat = "KNOCKOUT" | "ARENA" | "SPRINT";
export type TournamentStatus = "LIVE" | "UPCOMING" | "COMPLETED";
export type EntryStatus = "ACTIVE" | "ELIMINATED" | "CHAMPION";
export interface TournamentOpponent {
    name: string;
    rating: number;
    skill: number;
    tagline: string;
    color: string;
}
export interface BracketMatch {
    a: string;
    b: string;
    scoreA: number | null;
    scoreB: number | null;
    winner: string | null;
}
export interface BracketRound {
    name: string;
    matches: BracketMatch[];
}
export interface TournamentEntryState {
    status: EntryStatus;
    round: number;
    roundsTotal: number;
    placement: number | null;
    bracket: {
        rounds: BracketRound[];
        playerName: string;
        players: Record<string, TournamentOpponent>;
    };
    nextOpponent: TournamentOpponent | null;
    xpAwarded: number;
}
export interface TournamentSummary {
    slug: string;
    name: string;
    tagline: string;
    format: TournamentFormat;
    gameType: "CODING" | "QUIZ";
    difficulty: Difficulty;
    status: TournamentStatus;
    maxPlayers: number;
    playerCount: number;
    prizeXp: number;
    prizeTitle?: string;
    startsIn?: string;
    roundsTotal: number;
    themeColor: string;
    ratingRequirement?: number;
    standings?: {
        name: string;
        points: number;
        place: number;
    }[];
}
export interface TournamentDetailResponse {
    tournament: TournamentSummary;
    entry: TournamentEntryState | null;
}
export interface TournamentListResponse {
    tournaments: TournamentSummary[];
    entries: Record<string, EntryStatus>;
}
export interface TournamentMatchUpdate {
    advanced: boolean;
    status: EntryStatus;
    round: number;
    placement: number | null;
    xpBonus: number;
    eliminatedIn: string | null;
}
/**
 * Spectator-safe payload returned by the public `GET /api/replay/[id]` endpoint.
 * Deliberately excludes the owner's id, email and any progression fields
 * (rating change / XP) — only what a broadcast scoreboard needs, plus the
 * stored `details` JSON blob that drives the ReplayTheater.
 */
export interface PublicReplayResponse {
    id: string;
    /** Scoreboard name of the match owner (their username — public on the ladder). */
    ownerName: string;
    type: MatchType;
    result: MatchResult;
    score: number;
    opponentScore: number;
    opponentName: string;
    opponentRating: number;
    problemTitle: string | null;
    durationSec: number;
    createdAt: string;
    /** Tournament banner, when the match was played inside a cup bracket. */
    tournamentName: string | null;
    /** Stored broadcast payload — QuizMatchDetails or CodingMatchDetails. */
    details: QuizMatchDetails | CodingMatchDetails | null;
}
//# sourceMappingURL=types.d.ts.map