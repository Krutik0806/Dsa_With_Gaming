"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ─── Leaderboard route ────────────────────────────────────────────────────────
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const User_1 = require("../models/User");
const bots_1 = require("../lib/bots");
const game_1 = require("../lib/game");
const streak_1 = require("../lib/streak");
const router = (0, express_1.Router)();
router.get("/", auth_1.optionalAuth, async (req, res) => {
    const me = req.user;
    const users = await User_1.User.find().sort({ rating: -1 }).limit(25).lean();
    const entries = [
        ...users.map((u) => ({
            id: u._id.toString(),
            name: u.username,
            rating: u.rating,
            wins: u.wins,
            losses: u.losses,
            draws: u.draws,
            level: (0, game_1.getLevelInfo)(u.xp).level,
            isBot: false,
            isMe: me?._id.toString() === u._id.toString(),
            xp: u.xp,
            streak: (0, streak_1.computeStreakState)(u.streakCount, u.lastActiveDay).count,
        })),
        ...bots_1.BOTS.map((b, i) => ({
            id: `bot-${i}`,
            name: b.name,
            rating: b.rating,
            wins: Math.round(b.rating * 0.06 + (i % 5) * 3),
            losses: Math.round(b.rating * 0.045),
            draws: Math.round(2 + (i % 3)),
            level: Math.max(1, Math.round((b.rating - 700) / 90)),
            isBot: true,
            isMe: false,
            xp: Math.round((b.rating - 750) * 11 + b.rating * 0.6),
            streak: [4, 2, 7, 0, 11, 3, 5, 1, 9, 2, 6, 0][i % 12],
        })),
    ];
    entries.sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name));
    res.json({ entries: entries.slice(0, 30) });
});
exports.default = router;
//# sourceMappingURL=leaderboard.js.map