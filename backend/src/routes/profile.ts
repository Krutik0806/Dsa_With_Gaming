// ─── Profile route: GET /api/profile ─────────────────────────────────────────
import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { Match } from "../models/Match";
import { Progress } from "../models/Progress";
import { TournamentEntry } from "../models/TournamentEntry";
import { Purchase } from "../models/Purchase";
import { Transaction } from "../models/Transaction";
import { serializeUser } from "../lib/auth";
import { getLevelInfo } from "../lib/game";
import { LESSONS } from "../../../modules/data/lessons";
import { PROBLEMS } from "../../../modules/data/problems";
import { getTournament } from "../../../modules/data/tournaments";
import { computeStreakState } from "../lib/streak";
import { getShopItem } from "../lib/shop";
import type {
  ProfileResponse, SkillStat, Achievement, MatchSummary, MatchType, MatchResult,
  QuizMatchDetails, CodingMatchDetails, RatingPoint, PurchaseLogEntry, LedgerEntry
} from "../../../modules/types";

const router = Router();
router.use(requireAuth);

const SKILL_CATEGORIES = ["Complexity", "Arrays & Hashing", "Lists, Stacks & Queues", "Trees & Graphs", "Sorting & Searching", "Recursion & DP"] as const;
function mapCategory(c: string): string { return c === "CS Fundamentals" ? "Complexity" : c; }

router.get("/", async (req: Request, res: Response) => {
  const user = req.user!;

  const [progressRows, matches, entries, purchaseRows, transactionRows] = await Promise.all([
    Progress.find({ userId: user._id }).lean(),
    Match.find({ userId: user._id }).sort({ createdAt: -1 }).limit(60).lean(),
    TournamentEntry.find({ userId: user._id }).sort({ createdAt: -1 }).lean(),
    Purchase.find({ userId: user._id }).sort({ createdAt: -1 }).limit(20).lean(),
    Transaction.find({ userId: user._id }).sort({ createdAt: -1 }).limit(20).lean(),
  ]);

  const lessonsDone = (progressRows as any[]).filter((r) => r.kind === "LESSON").map((r) => r.refId);
  const problemsDone = (progressRows as any[]).filter((r) => r.kind === "PROBLEM").map((r) => r.refId);

  const quizStat: Record<string, { correct: number; total: number }> = {};
  for (const m of matches as any[]) {
    if (m.type !== "QUIZ") continue;
    try {
      const details = JSON.parse(m.details || "{}") as QuizMatchDetails;
      for (const item of details.review ?? []) {
        const cat = mapCategory(item.category);
        quizStat[cat] ??= { correct: 0, total: 0 };
        quizStat[cat].total += 1;
        if (item.userCorrect) quizStat[cat].correct += 1;
      }
    } catch { /* ignore */ }
  }

  const skills: SkillStat[] = SKILL_CATEGORIES.map((cat) => {
    const components: { w: number; v: number }[] = [];
    const q = quizStat[cat];
    if (q && q.total > 0) components.push({ w: 55, v: q.correct / q.total });
    const probTotal = PROBLEMS.filter((p) => p.topics.includes(cat)).length;
    const probDone = problemsDone.filter((slug) => PROBLEMS.find((p) => p.slug === slug)?.topics.includes(cat)).length;
    if (probTotal > 0) components.push({ w: 30, v: probDone / probTotal });
    const lesTotal = LESSONS.filter((l) => l.category === cat).length;
    const lesDone = lessonsDone.filter((slug) => LESSONS.find((l) => l.slug === slug)?.category === cat).length;
    if (lesTotal > 0) components.push({ w: 15, v: lesDone / lesTotal });
    if (components.length === 0) return { category: cat, value: 0 };
    const wSum = components.reduce((s, c) => s + c.w, 0);
    const value = components.reduce((s, c) => s + c.w * c.v, 0) / wSum;
    return { category: cat, value: Math.round(value * 100) };
  });

  const totalMatches = matches.length;
  let streak = 0;
  for (const m of matches as any[]) { if (m.result === "WIN") streak += 1; else break; }
  const winStreak = streak;
  const dayStreak = computeStreakState(user.streakCount, user.lastActiveDay, user.freezes);

  const purchases: PurchaseLogEntry[] = (purchaseRows as any[]).map((p) => ({
    id: p._id.toString(), itemId: p.itemId, itemName: getShopItem(p.itemId)?.name ?? p.itemId,
    kind: getShopItem(p.itemId)?.kind ?? "CONSUMABLE", cost: p.cost, at: p.createdAt.toISOString(),
  }));

  const transactions: LedgerEntry[] = (transactionRows as any[]).map((t) => ({
    id: t._id.toString(), amount: t.amount, source: t.source, description: t.description, at: t.createdAt.toISOString(),
  }));

  const langWins = new Set<string>();
  let fastWin = false, ironWill = false;
  for (const m of matches as any[]) {
    if (m.type !== "CODING" || m.result !== "WIN") continue;
    try {
      const d = JSON.parse(m.details || "{}") as CodingMatchDetails;
      if (d.language) langWins.add(d.language);
      if ((m.durationSec ?? 0) <= 60) fastWin = true;
      if ((d.errors?.length ?? 0) > 0) ironWill = true;
    } catch { /* ignore */ }
  }
  let ratingCursor = user.rating, clutchWin = false, comeback = false, lossRun = 0;
  for (const m of matches as any[]) {
    const r = ratingCursor;
    if (m.result === "WIN") { if (m.opponentRating >= r + 100) clutchWin = true; if (lossRun >= 2) comeback = true; lossRun = 0; }
    else if (m.result === "LOSS") lossRun += 1;
    else lossRun = 0;
    ratingCursor = Math.max(100, ratingCursor - m.ratingChange);
  }
  const langCount = langWins.size;

  const achievements: Achievement[] = [
    { key: "first_blood", name: "First Blood", description: "Win your first competitive match", icon: "swords", unlocked: user.wins >= 1, category: "combat", rarity: "common", progress: { current: Math.min(user.wins, 1), target: 1 } },
    { key: "on_a_roll", name: "On a Roll", description: "Win 3 matches in a row", icon: "trending-up", unlocked: winStreak >= 3, category: "combat", rarity: "rare", progress: { current: Math.min(winStreak, 3), target: 3 } },
    { key: "rampage", name: "Rampage", description: "Win 5 matches in a row", icon: "flame", unlocked: winStreak >= 5, category: "combat", rarity: "epic", progress: { current: Math.min(winStreak, 5), target: 5 } },
    { key: "arena_regular", name: "Arena Regular", description: "Play 10 matches", icon: "medal", unlocked: totalMatches >= 10, category: "combat", rarity: "common", progress: { current: Math.min(totalMatches, 10), target: 10 } },
    { key: "arena_veteran", name: "Arena Veteran", description: "Play 25 matches", icon: "shield", unlocked: totalMatches >= 25, category: "combat", rarity: "rare", progress: { current: Math.min(totalMatches, 25), target: 25 } },
    { key: "clutch", name: "Clutch", description: "Beat an opponent rated 100+ above you", icon: "zap", unlocked: clutchWin, category: "combat", rarity: "epic" },
    { key: "comeback_kid", name: "Comeback Kid", description: "Win right after two straight losses", icon: "rotate-ccw", unlocked: comeback, category: "combat", rarity: "rare" },
    { key: "iron_will", name: "Iron Will", description: "Win a coding battle after hitting a compile error", icon: "hammer", unlocked: ironWill, category: "combat", rarity: "rare" },
    { key: "speedrunner", name: "Speedrunner", description: "Win a coding battle in under a minute", icon: "timer", unlocked: fastWin, category: "combat", rarity: "epic" },
    { key: "scholar", name: "Scholar", description: "Complete 3 lessons", icon: "book-open", unlocked: lessonsDone.length >= 3, category: "mastery", rarity: "common", progress: { current: Math.min(lessonsDone.length, 3), target: 3 } },
    { key: "professor", name: "Professor of Algorithms", description: "Complete every lesson", icon: "graduation-cap", unlocked: lessonsDone.length >= LESSONS.length, category: "mastery", rarity: "epic", progress: { current: lessonsDone.length, target: LESSONS.length } },
    { key: "practitioner", name: "Practitioner", description: "Solve 5 practice problems", icon: "target", unlocked: problemsDone.length >= 5, category: "mastery", rarity: "common", progress: { current: Math.min(problemsDone.length, 5), target: 5 } },
    { key: "problem_slayer", name: "Problem Slayer", description: "Solve every practice problem", icon: "flame", unlocked: problemsDone.length >= PROBLEMS.length, category: "mastery", rarity: "legendary", progress: { current: problemsDone.length, target: PROBLEMS.length } },
    { key: "quiz_duelist", name: "Quiz Duelist", description: "Win a rapid-fire quiz battle", icon: "zap", unlocked: user.quizWins >= 1, category: "mastery", rarity: "common", progress: { current: Math.min(user.quizWins, 1), target: 1 } },
    { key: "code_duelist", name: "Code Duelist", description: "Win a 1v1 coding battle", icon: "code", unlocked: user.codeWins >= 1, category: "mastery", rarity: "common", progress: { current: Math.min(user.codeWins, 1), target: 1 } },
    { key: "polyglot", name: "Polyglot", description: "Win coding battles in 3 different languages", icon: "languages", unlocked: langCount >= 3, category: "mastery", rarity: "epic", progress: { current: Math.min(langCount, 3), target: 3 } },
    { key: "quad_lingual", name: "Quad Lingual", description: "Win coding battles in all 4 languages", icon: "globe", unlocked: langCount >= 4, category: "mastery", rarity: "legendary", progress: { current: Math.min(langCount, 4), target: 4 } },
    { key: "cup_debut", name: "Cup Debut", description: "Enter your first tournament", icon: "crown", unlocked: entries.length >= 1, category: "cups", rarity: "common", progress: { current: Math.min(entries.length, 1), target: 1 } },
    { key: "bracket_runner", name: "Bracket Runner", description: "Reach a cup semifinal", icon: "git-branch", unlocked: (entries as any[]).some((e) => e.round >= 2 || e.status === "CHAMPION"), category: "cups", rarity: "rare" },
    { key: "cup_champion", name: "Cup Champion", description: "Win a tournament bracket", icon: "trophy", unlocked: (entries as any[]).some((e) => e.status === "CHAMPION"), category: "cups", rarity: "legendary" },
    { key: "habit_formed", name: "Habit Formed", description: "Hold a 3-day activity streak", icon: "flame", unlocked: dayStreak.count >= 3, category: "grind", rarity: "common", progress: { current: Math.min(dayStreak.count, 3), target: 3 } },
    { key: "unstoppable", name: "Unstoppable", description: "Hold a 7-day activity streak", icon: "zap", unlocked: dayStreak.count >= 7, category: "grind", rarity: "rare", progress: { current: Math.min(dayStreak.count, 7), target: 7 } },
    { key: "inferno", name: "Inferno", description: "Hold a 30-day activity streak", icon: "sun", unlocked: dayStreak.count >= 30, category: "grind", rarity: "legendary", progress: { current: Math.min(dayStreak.count, 30), target: 30 } },
    { key: "diamond_rising", name: "Diamond in the Rough", description: "Reach 1400 rating", icon: "gem", unlocked: user.rating >= 1400, category: "grind", rarity: "epic", progress: { current: Math.min(user.rating, 1400), target: 1400 } },
  ];

  const recentMatches: MatchSummary[] = (matches as any[]).slice(0, 8).map((m) => ({
    id: m._id.toString(), type: m.type as MatchType, result: m.result as MatchResult,
    opponentName: m.opponentName, opponentRating: m.opponentRating, ratingChange: m.ratingChange,
    xpEarned: m.xpEarned, score: m.score, opponentScore: m.opponentScore,
    problemTitle: m.problemTitle, durationSec: m.durationSec, createdAt: m.createdAt.toISOString(),
  }));

  const historyNewestFirst: RatingPoint[] = [];
  let cursor = user.rating;
  for (const m of matches as any[]) {
    historyNewestFirst.push({ rating: cursor, change: m.ratingChange, result: m.result as MatchResult, opponent: m.opponentName, type: m.type as MatchType, problemTitle: m.problemTitle, at: m.createdAt.toISOString() });
    cursor = Math.max(100, cursor - m.ratingChange);
  }
  const ratingHistory = historyNewestFirst.reverse();

  const level = getLevelInfo(user.xp);
  const placements = (entries as any[]).map((e) => e.placement).filter((p): p is number => p !== null);
  const payload: ProfileResponse = {
    user: serializeUser(user) as any,
    level: level.level, levelInto: level.intoLevel, levelSpan: level.levelSpan,
    skills, achievements,
    lessonsCompleted: lessonsDone.length, lessonsTotal: LESSONS.length,
    problemsSolved: problemsDone.length, problemsTotal: PROBLEMS.length,
    recentMatches, ratingHistory, streak: dayStreak,
    transactions,
    wallet: {
      coins: user.coins, freezes: user.freezes,
      equippedFrameName: user.equippedFrame ? (getShopItem(user.equippedFrame)?.name ?? null) : null,
      equippedTitleName: user.equippedTitle ? (getShopItem(user.equippedTitle)?.name ?? null) : null,
      purchases,
    },
    tournaments: {
      entered: entries.length,
      championships: (entries as any[]).filter((e) => e.status === "CHAMPION").length,
      bestPlacement: placements.length > 0 ? Math.min(...placements) : null,
      history: (entries as any[]).map((e) => ({
        slug: e.slug, name: getTournament(e.slug)?.name ?? e.slug,
        status: e.status, placement: e.placement, round: e.round,
        gameType: getTournament(e.slug)?.gameType ?? "CODING",
      })),
    },
  };
  res.json(payload);
});

export default router;
