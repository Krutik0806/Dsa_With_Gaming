"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ─── Profile route: GET /api/profile ─────────────────────────────────────────
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const Match_1 = require("../models/Match");
const Progress_1 = require("../models/Progress");
const TournamentEntry_1 = require("../models/TournamentEntry");
const Purchase_1 = require("../models/Purchase");
const Transaction_1 = require("../models/Transaction");
const auth_2 = require("../lib/auth");
const game_1 = require("../lib/game");
const lessons_1 = require("../../../modules/data/lessons");
const problems_1 = require("../../../modules/data/problems");
const tournaments_1 = require("../../../modules/data/tournaments");
const streak_1 = require("../lib/streak");
const shop_1 = require("../lib/shop");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
const SKILL_CATEGORIES = ["Complexity", "Arrays & Hashing", "Lists, Stacks & Queues", "Trees & Graphs", "Sorting & Searching", "Recursion & DP"];
function mapCategory(c) { return c === "CS Fundamentals" ? "Complexity" : c; }
router.get("/", async (req, res) => {
    const user = req.user;
    const [progressRows, matches, entries, purchaseRows, transactionRows] = await Promise.all([
        Progress_1.Progress.find({ userId: user._id }).lean(),
        Match_1.Match.find({ userId: user._id }).sort({ createdAt: -1 }).limit(60).lean(),
        TournamentEntry_1.TournamentEntry.find({ userId: user._id }).sort({ createdAt: -1 }).lean(),
        Purchase_1.Purchase.find({ userId: user._id }).sort({ createdAt: -1 }).limit(20).lean(),
        Transaction_1.Transaction.find({ userId: user._id }).sort({ createdAt: -1 }).limit(20).lean(),
    ]);
    const lessonsDone = progressRows.filter((r) => r.kind === "LESSON").map((r) => r.refId);
    const problemsDone = progressRows.filter((r) => r.kind === "PROBLEM").map((r) => r.refId);
    const quizStat = {};
    for (const m of matches) {
        if (m.type !== "QUIZ")
            continue;
        try {
            const details = JSON.parse(m.details || "{}");
            for (const item of details.review ?? []) {
                const cat = mapCategory(item.category);
                quizStat[cat] ?? (quizStat[cat] = { correct: 0, total: 0 });
                quizStat[cat].total += 1;
                if (item.userCorrect)
                    quizStat[cat].correct += 1;
            }
        }
        catch { /* ignore */ }
    }
    const skills = SKILL_CATEGORIES.map((cat) => {
        const components = [];
        const q = quizStat[cat];
        if (q && q.total > 0)
            components.push({ w: 55, v: q.correct / q.total });
        const probTotal = problems_1.PROBLEMS.filter((p) => p.topics.includes(cat)).length;
        const probDone = problemsDone.filter((slug) => problems_1.PROBLEMS.find((p) => p.slug === slug)?.topics.includes(cat)).length;
        if (probTotal > 0)
            components.push({ w: 30, v: probDone / probTotal });
        const lesTotal = lessons_1.LESSONS.filter((l) => l.category === cat).length;
        const lesDone = lessonsDone.filter((slug) => lessons_1.LESSONS.find((l) => l.slug === slug)?.category === cat).length;
        if (lesTotal > 0)
            components.push({ w: 15, v: lesDone / lesTotal });
        if (components.length === 0)
            return { category: cat, value: 0 };
        const wSum = components.reduce((s, c) => s + c.w, 0);
        const value = components.reduce((s, c) => s + c.w * c.v, 0) / wSum;
        return { category: cat, value: Math.round(value * 100) };
    });
    const totalMatches = matches.length;
    let streak = 0;
    for (const m of matches) {
        if (m.result === "WIN")
            streak += 1;
        else
            break;
    }
    const winStreak = streak;
    const dayStreak = (0, streak_1.computeStreakState)(user.streakCount, user.lastActiveDay, user.freezes);
    const purchases = purchaseRows.map((p) => ({
        id: p._id.toString(), itemId: p.itemId, itemName: (0, shop_1.getShopItem)(p.itemId)?.name ?? p.itemId,
        kind: (0, shop_1.getShopItem)(p.itemId)?.kind ?? "CONSUMABLE", cost: p.cost, at: p.createdAt.toISOString(),
    }));
    const transactions = transactionRows.map((t) => ({
        id: t._id.toString(), amount: t.amount, source: t.source, description: t.description, at: t.createdAt.toISOString(),
    }));
    const langWins = new Set();
    let fastWin = false, ironWill = false;
    for (const m of matches) {
        if (m.type !== "CODING" || m.result !== "WIN")
            continue;
        try {
            const d = JSON.parse(m.details || "{}");
            if (d.language)
                langWins.add(d.language);
            if ((m.durationSec ?? 0) <= 60)
                fastWin = true;
            if ((d.errors?.length ?? 0) > 0)
                ironWill = true;
        }
        catch { /* ignore */ }
    }
    let ratingCursor = user.rating, clutchWin = false, comeback = false, lossRun = 0;
    for (const m of matches) {
        const r = ratingCursor;
        if (m.result === "WIN") {
            if (m.opponentRating >= r + 100)
                clutchWin = true;
            if (lossRun >= 2)
                comeback = true;
            lossRun = 0;
        }
        else if (m.result === "LOSS")
            lossRun += 1;
        else
            lossRun = 0;
        ratingCursor = Math.max(100, ratingCursor - m.ratingChange);
    }
    const langCount = langWins.size;
    const achievements = [
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
        { key: "professor", name: "Professor of Algorithms", description: "Complete every lesson", icon: "graduation-cap", unlocked: lessonsDone.length >= lessons_1.LESSONS.length, category: "mastery", rarity: "epic", progress: { current: lessonsDone.length, target: lessons_1.LESSONS.length } },
        { key: "practitioner", name: "Practitioner", description: "Solve 5 practice problems", icon: "target", unlocked: problemsDone.length >= 5, category: "mastery", rarity: "common", progress: { current: Math.min(problemsDone.length, 5), target: 5 } },
        { key: "problem_slayer", name: "Problem Slayer", description: "Solve every practice problem", icon: "flame", unlocked: problemsDone.length >= problems_1.PROBLEMS.length, category: "mastery", rarity: "legendary", progress: { current: problemsDone.length, target: problems_1.PROBLEMS.length } },
        { key: "quiz_duelist", name: "Quiz Duelist", description: "Win a rapid-fire quiz battle", icon: "zap", unlocked: user.quizWins >= 1, category: "mastery", rarity: "common", progress: { current: Math.min(user.quizWins, 1), target: 1 } },
        { key: "code_duelist", name: "Code Duelist", description: "Win a 1v1 coding battle", icon: "code", unlocked: user.codeWins >= 1, category: "mastery", rarity: "common", progress: { current: Math.min(user.codeWins, 1), target: 1 } },
        { key: "polyglot", name: "Polyglot", description: "Win coding battles in 3 different languages", icon: "languages", unlocked: langCount >= 3, category: "mastery", rarity: "epic", progress: { current: Math.min(langCount, 3), target: 3 } },
        { key: "quad_lingual", name: "Quad Lingual", description: "Win coding battles in all 4 languages", icon: "globe", unlocked: langCount >= 4, category: "mastery", rarity: "legendary", progress: { current: Math.min(langCount, 4), target: 4 } },
        { key: "cup_debut", name: "Cup Debut", description: "Enter your first tournament", icon: "crown", unlocked: entries.length >= 1, category: "cups", rarity: "common", progress: { current: Math.min(entries.length, 1), target: 1 } },
        { key: "bracket_runner", name: "Bracket Runner", description: "Reach a cup semifinal", icon: "git-branch", unlocked: entries.some((e) => e.round >= 2 || e.status === "CHAMPION"), category: "cups", rarity: "rare" },
        { key: "cup_champion", name: "Cup Champion", description: "Win a tournament bracket", icon: "trophy", unlocked: entries.some((e) => e.status === "CHAMPION"), category: "cups", rarity: "legendary" },
        { key: "habit_formed", name: "Habit Formed", description: "Hold a 3-day activity streak", icon: "flame", unlocked: dayStreak.count >= 3, category: "grind", rarity: "common", progress: { current: Math.min(dayStreak.count, 3), target: 3 } },
        { key: "unstoppable", name: "Unstoppable", description: "Hold a 7-day activity streak", icon: "zap", unlocked: dayStreak.count >= 7, category: "grind", rarity: "rare", progress: { current: Math.min(dayStreak.count, 7), target: 7 } },
        { key: "inferno", name: "Inferno", description: "Hold a 30-day activity streak", icon: "sun", unlocked: dayStreak.count >= 30, category: "grind", rarity: "legendary", progress: { current: Math.min(dayStreak.count, 30), target: 30 } },
        { key: "diamond_rising", name: "Diamond in the Rough", description: "Reach 1400 rating", icon: "gem", unlocked: user.rating >= 1400, category: "grind", rarity: "epic", progress: { current: Math.min(user.rating, 1400), target: 1400 } },
    ];
    const recentMatches = matches.slice(0, 8).map((m) => ({
        id: m._id.toString(), type: m.type, result: m.result,
        opponentName: m.opponentName, opponentRating: m.opponentRating, ratingChange: m.ratingChange,
        xpEarned: m.xpEarned, score: m.score, opponentScore: m.opponentScore,
        problemTitle: m.problemTitle, durationSec: m.durationSec, createdAt: m.createdAt.toISOString(),
    }));
    const historyNewestFirst = [];
    let cursor = user.rating;
    for (const m of matches) {
        historyNewestFirst.push({ rating: cursor, change: m.ratingChange, result: m.result, opponent: m.opponentName, type: m.type, problemTitle: m.problemTitle, at: m.createdAt.toISOString() });
        cursor = Math.max(100, cursor - m.ratingChange);
    }
    const ratingHistory = historyNewestFirst.reverse();
    const level = (0, game_1.getLevelInfo)(user.xp);
    const placements = entries.map((e) => e.placement).filter((p) => p !== null);
    const payload = {
        user: (0, auth_2.serializeUser)(user),
        level: level.level, levelInto: level.intoLevel, levelSpan: level.levelSpan,
        skills, achievements,
        lessonsCompleted: lessonsDone.length, lessonsTotal: lessons_1.LESSONS.length,
        problemsSolved: problemsDone.length, problemsTotal: problems_1.PROBLEMS.length,
        recentMatches, ratingHistory, streak: dayStreak,
        transactions,
        wallet: {
            coins: user.coins, freezes: user.freezes,
            equippedFrameName: user.equippedFrame ? ((0, shop_1.getShopItem)(user.equippedFrame)?.name ?? null) : null,
            equippedTitleName: user.equippedTitle ? ((0, shop_1.getShopItem)(user.equippedTitle)?.name ?? null) : null,
            purchases,
        },
        tournaments: {
            entered: entries.length,
            championships: entries.filter((e) => e.status === "CHAMPION").length,
            bestPlacement: placements.length > 0 ? Math.min(...placements) : null,
            history: entries.map((e) => ({
                slug: e.slug, name: (0, tournaments_1.getTournament)(e.slug)?.name ?? e.slug,
                status: e.status, placement: e.placement, round: e.round,
                gameType: (0, tournaments_1.getTournament)(e.slug)?.gameType ?? "CODING",
            })),
        },
    };
    res.json(payload);
});
exports.default = router;
//# sourceMappingURL=profile.js.map