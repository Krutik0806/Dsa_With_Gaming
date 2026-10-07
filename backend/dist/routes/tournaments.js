"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ─── Tournaments routes ───────────────────────────────────────────────────────
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const TournamentEntry_1 = require("../models/TournamentEntry");
const tournaments_1 = require("../../../modules/data/tournaments");
const tournament_engine_1 = require("../lib/tournament-engine");
const streak_1 = require("../lib/streak");
const router = (0, express_1.Router)();
// GET /api/tournaments — public list, entries if logged in
router.get("/", auth_1.optionalAuth, async (req, res) => {
    let entries = {};
    if (req.user) {
        const rows = await TournamentEntry_1.TournamentEntry.find({ userId: req.user._id }).select("slug status").lean();
        entries = Object.fromEntries(rows.map((r) => [r.slug, r.status]));
    }
    res.json({ tournaments: tournaments_1.TOURNAMENTS, entries });
});
// GET /api/tournaments/:slug
router.get("/:slug", auth_1.requireAuth, async (req, res) => {
    const t = (0, tournaments_1.getTournament)(req.params.slug);
    if (!t) {
        res.status(404).json({ error: "Tournament not found" });
        return;
    }
    const entry = await TournamentEntry_1.TournamentEntry.findOne({ userId: req.user._id, slug: t.slug }).lean();
    const entryState = entry
        ? {
            status: entry.status,
            round: entry.round,
            roundsTotal: t.roundsTotal,
            placement: entry.placement,
            bracket: JSON.parse(entry.bracket || "{}"),
            nextOpponent: null,
            xpAwarded: entry.xpAwarded,
        }
        : null;
    const payload = { tournament: t, entry: entryState };
    res.json(payload);
});
// POST /api/tournaments/:slug/enter
router.post("/:slug/enter", auth_1.requireAuth, async (req, res) => {
    const t = (0, tournaments_1.getTournament)(req.params.slug);
    if (!t) {
        res.status(404).json({ error: "Tournament not found" });
        return;
    }
    const user = req.user;
    const existing = await TournamentEntry_1.TournamentEntry.findOne({ userId: user._id, slug: t.slug });
    if (existing) {
        res.status(409).json({ error: "Already entered" });
        return;
    }
    const touched = await (0, streak_1.touchStreakActivity)(user);
    const bracket = (0, tournament_engine_1.buildBracket)(t, touched.user.username);
    const entry = await TournamentEntry_1.TournamentEntry.create({
        userId: user._id,
        slug: t.slug,
        status: "ACTIVE",
        round: 1,
        bracket: JSON.stringify(bracket),
    });
    res.status(201).json({ entry: { ...entry.toObject(), id: entry._id.toString() }, tournament: t });
});
exports.default = router;
//# sourceMappingURL=tournaments.js.map