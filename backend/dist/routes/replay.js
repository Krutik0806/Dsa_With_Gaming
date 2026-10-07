"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ─── Replay route ─────────────────────────────────────────────────────────────
const express_1 = require("express");
const Match_1 = require("../models/Match");
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get("/:id", auth_1.optionalAuth, async (req, res) => {
    const match = await Match_1.Match.findById(req.params.id).lean();
    if (!match) {
        res.status(404).json({ error: "Match not found" });
        return;
    }
    const owner = await User_1.User.findById(match.userId).select("username").lean();
    let details = null;
    try {
        details = JSON.parse(match.details || "{}");
    }
    catch { /* ignore */ }
    const payload = {
        id: match._id.toString(),
        ownerName: owner?.username ?? "unknown",
        type: match.type,
        result: match.result,
        score: match.score,
        opponentScore: match.opponentScore,
        opponentName: match.opponentName,
        opponentRating: match.opponentRating,
        problemTitle: match.problemTitle,
        durationSec: match.durationSec,
        createdAt: match.createdAt.toISOString(),
        tournamentName: details?.tournamentName ?? null,
        details,
    };
    res.json(payload);
});
exports.default = router;
//# sourceMappingURL=replay.js.map