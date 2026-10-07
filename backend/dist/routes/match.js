"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ─── Match routes: GET+POST /api/match ───────────────────────────────────────
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const Match_1 = require("../models/Match");
const User_1 = require("../models/User");
const TournamentEntry_1 = require("../models/TournamentEntry");
const auth_2 = require("../lib/auth");
const game_1 = require("../lib/game");
const tournaments_1 = require("../../../modules/data/tournaments");
const tournament_engine_1 = require("../lib/tournament-engine");
const streak_1 = require("../lib/streak");
const shop_1 = require("../lib/shop");
const ledger_1 = require("../lib/ledger");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
const schema = zod_1.z.object({
    type: zod_1.z.enum(["QUIZ", "CODING"]),
    result: zod_1.z.enum(["WIN", "LOSS", "DRAW"]),
    opponentName: zod_1.z.string().trim().min(1).max(40),
    opponentRating: zod_1.z.number().int().min(100).max(3000),
    score: zod_1.z.number().int().min(0).max(100000),
    opponentScore: zod_1.z.number().int().min(0).max(100000),
    problemTitle: zod_1.z.string().max(120).optional().nullable(),
    durationSec: zod_1.z.number().int().min(1).max(7200),
    details: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional().default({}),
    tournament: zod_1.z.object({ slug: zod_1.z.string().min(1).max(64), round: zod_1.z.number().int().min(1).max(5) }).optional(),
});
router.get("/", async (req, res) => {
    const matches = await Match_1.Match.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
    const annotated = matches.map((m) => {
        let tournamentName = null;
        let human = false;
        try {
            const d = JSON.parse(m.details || "{}");
            tournamentName = d.tournamentName ?? null;
            human = d.human === true;
        }
        catch { /* malformed payload */ }
        return { ...m, id: m._id.toString(), tournamentName, human };
    });
    res.json({ matches: annotated });
});
router.get("/:id", async (req, res) => {
    try {
        const match = await Match_1.Match.findById(req.params.id).lean();
        if (!match || match.userId.toString() !== req.user._id.toString()) {
            res.status(404).json({ error: "Match not found" });
            return;
        }
        let quizDetails = null;
        let codingDetails = null;
        let tournamentName = null;
        try {
            const parsed = JSON.parse(match.details || "{}");
            if (match.type === "QUIZ" && parsed.review)
                quizDetails = parsed;
            if (match.type === "CODING" && parsed.problemSlug)
                codingDetails = parsed;
            if (typeof parsed.tournamentName === "string")
                tournamentName = parsed.tournamentName;
        }
        catch { /* summary only */ }
        const summary = {
            ...match,
            id: match._id.toString(),
            tournamentName,
            createdAt: match.createdAt ? new Date(match.createdAt).toISOString() : new Date().toISOString(),
        };
        res.json({ match: summary, quizDetails, codingDetails, tournamentName });
    }
    catch {
        res.status(500).json({ error: "Could not load match" });
    }
});
router.post("/", async (req, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Invalid match payload" });
        return;
    }
    const m = parsed.data;
    const user = req.user;
    // ELO
    const score = m.result === "WIN" ? 1 : m.result === "LOSS" ? 0 : 0.5;
    const change = (0, game_1.ratingChange)(user.rating, m.opponentRating, score);
    const rating = (0, game_1.newRating)(user.rating, change);
    // Streak
    const touched = await (0, streak_1.touchStreakActivity)(user);
    const u = touched.user;
    const multiplier = touched.state.multiplier;
    // XP
    let xpEarned = 0;
    if (m.type === "QUIZ") {
        xpEarned = game_1.XP_REWARDS.QUIZ_PLAY + (m.result === "WIN" ? game_1.XP_REWARDS.QUIZ_WIN : 0);
    }
    else {
        const details = m.details;
        const tests = (0, game_1.clamp)(details.userTestsPassed ?? 0, 0, details.totalTests ?? 20);
        xpEarned = game_1.XP_REWARDS.CODE_PLAY + tests * game_1.XP_REWARDS.CODE_PER_TEST + (m.result === "WIN" ? game_1.XP_REWARDS.CODE_WIN : 0);
    }
    xpEarned = Math.round(xpEarned * multiplier);
    // Tournament
    let tournamentUpdate;
    let xpBonus = 0;
    let coinsEarned = (0, shop_1.coinsForMatch)(m.result);
    let cupRoundBonus = 0;
    let cupChampionBonus = 0;
    let cupName = null;
    let cupRound = 0;
    const details = { ...(m.details ?? {}) };
    if (m.tournament) {
        const t = (0, tournaments_1.getTournament)(m.tournament.slug);
        const entry = t
            ? await TournamentEntry_1.TournamentEntry.findOne({ userId: u._id, slug: t.slug })
            : null;
        if (t && entry && entry.status === "ACTIVE" && entry.round === m.tournament.round) {
            const bracket = (0, tournament_engine_1.parseBracket)(entry.bracket, u.username);
            const adv = (0, tournament_engine_1.advanceBracket)(bracket, m.tournament.round, m.result, m.score, m.opponentScore, t.gameType, t.prizeXp);
            xpBonus = Math.round(adv.xpBonus * multiplier);
            await TournamentEntry_1.TournamentEntry.findByIdAndUpdate(entry._id, {
                status: adv.status,
                round: adv.round,
                placement: adv.placement,
                bracket: JSON.stringify(adv.bracket),
                xpAwarded: entry.xpAwarded + adv.xpBonus,
            });
            tournamentUpdate = {
                advanced: adv.advanced,
                status: adv.status,
                round: adv.round,
                placement: adv.placement,
                xpBonus: adv.xpBonus,
                eliminatedIn: adv.eliminatedIn,
            };
            details.tournamentSlug = t.slug;
            details.tournamentName = t.name;
            details.tournamentRound = m.tournament.round;
            if (adv.advanced) {
                coinsEarned += shop_1.COIN_REWARDS.CUP_ROUND_WIN;
                cupRoundBonus = shop_1.COIN_REWARDS.CUP_ROUND_WIN;
            }
            if (adv.status === "CHAMPION") {
                coinsEarned += shop_1.COIN_REWARDS.CUP_CHAMPION;
                cupChampionBonus = shop_1.COIN_REWARDS.CUP_CHAMPION;
            }
            cupName = t.name;
            cupRound = m.tournament.round;
        }
    }
    const match = await Match_1.Match.create({
        userId: u._id,
        type: m.type,
        result: m.result,
        opponentName: m.opponentName,
        opponentRating: m.opponentRating,
        ratingChange: change,
        xpEarned,
        score: m.score,
        opponentScore: m.opponentScore,
        problemTitle: m.problemTitle ?? null,
        durationSec: m.durationSec,
        details: JSON.stringify(details),
    });
    const updated = await User_1.User.findByIdAndUpdate(u._id, {
        rating,
        xp: u.xp + xpEarned + xpBonus,
        coins: u.coins + coinsEarned,
        wins: u.wins + (m.result === "WIN" ? 1 : 0),
        losses: u.losses + (m.result === "LOSS" ? 1 : 0),
        draws: u.draws + (m.result === "DRAW" ? 1 : 0),
        quizWins: u.quizWins + (m.type === "QUIZ" && m.result === "WIN" ? 1 : 0),
        codeWins: u.codeWins + (m.type === "CODING" && m.result === "WIN" ? 1 : 0),
    }, { new: true });
    const matchSource = m.result === "WIN" ? "MATCH_WIN" : m.result === "DRAW" ? "MATCH_DRAW" : "MATCH_LOSS";
    const ledgerRows = [
        { amount: (0, shop_1.coinsForMatch)(m.result), source: matchSource, description: `${m.type === "QUIZ" ? "quiz" : "coding"} ${m.result.toLowerCase()} vs ${m.opponentName}` },
    ];
    if (cupRoundBonus > 0)
        ledgerRows.push({ amount: cupRoundBonus, source: "CUP_ROUND", description: `cup round ${cupRound} bonus · ${cupName}` });
    if (cupChampionBonus > 0)
        ledgerRows.push({ amount: cupChampionBonus, source: "CUP_CHAMPION", description: `cup champion purse · ${cupName}` });
    await Promise.all(ledgerRows.map((row) => (0, ledger_1.recordTransaction)(u._id, row.amount, row.source, row.description)));
    res.status(201).json({
        match: { ...match.toObject(), id: match._id.toString() },
        user: (0, auth_2.serializeUser)(updated),
        ratingChange: change,
        xpEarned,
        coinsEarned,
        tournament: tournamentUpdate,
        streak: { multiplier, days: touched.state.count },
    });
});
exports.default = router;
//# sourceMappingURL=match.js.map