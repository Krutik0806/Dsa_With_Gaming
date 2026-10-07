"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ─── Progress routes: GET+POST /api/progress ─────────────────────────────────
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const User_1 = require("../models/User");
const Progress_1 = require("../models/Progress");
const auth_2 = require("../lib/auth");
const lessons_1 = require("../../../modules/data/lessons");
const problems_1 = require("../../../modules/data/problems");
const game_1 = require("../lib/game");
const streak_1 = require("../lib/streak");
const daily_1 = require("../lib/daily");
const shop_1 = require("../lib/shop");
const ledger_1 = require("../lib/ledger");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
const schema = zod_1.z.object({
    kind: zod_1.z.enum(["LESSON", "PROBLEM"]),
    refId: zod_1.z.string().min(1).max(64),
});
function xpFor(kind, refId) {
    if (kind === "LESSON")
        return (0, lessons_1.getLesson)(refId) ? game_1.XP_REWARDS.LESSON : 0;
    const problem = (0, problems_1.getProblem)(refId);
    if (!problem)
        return 0;
    return (0, daily_1.xpForProblem)(problem.difficulty);
}
router.get("/", async (req, res) => {
    const rows = await Progress_1.Progress.find({ userId: req.user._id }).lean();
    const lessons = rows.filter((r) => r.kind === "LESSON").map((r) => r.refId);
    const problems = rows.filter((r) => r.kind === "PROBLEM").map((r) => r.refId);
    const dailyDone = rows.some((r) => r.kind === "DAILY" && r.refId === (0, streak_1.todayKey)());
    res.json({ lessons, problems, dailyDone });
});
router.post("/", async (req, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Invalid input" });
        return;
    }
    const { kind, refId } = parsed.data;
    const user = req.user;
    const baseXp = xpFor(kind, refId);
    if (baseXp === 0) {
        res.status(404).json({ error: "Unknown lesson or problem" });
        return;
    }
    const existing = await Progress_1.Progress.findOne({ userId: user._id, kind, refId });
    if (existing) {
        res.json({ xpEarned: 0, alreadyCompleted: true, user: (0, auth_2.serializeUser)(user) });
        return;
    }
    const touched = await (0, streak_1.touchStreakActivity)(user);
    const u = touched.user;
    const multiplier = touched.state.multiplier;
    const award = Math.round(baseXp * multiplier);
    await Progress_1.Progress.create({ userId: u._id, kind, refId, xpAwarded: award });
    let dailyBonus = 0;
    let coinsEarned = 0;
    let dailyClaimed = false;
    if (kind === "PROBLEM" && refId === (0, daily_1.dailyProblem)().slug) {
        const dailyKey = (0, streak_1.todayKey)();
        const alreadyDaily = await Progress_1.Progress.findOne({ userId: u._id, kind: "DAILY", refId: dailyKey });
        if (!alreadyDaily) {
            dailyBonus = award;
            coinsEarned = shop_1.COIN_REWARDS.DAILY_CHALLENGE;
            dailyClaimed = true;
            await Progress_1.Progress.create({ userId: u._id, kind: "DAILY", refId: dailyKey, xpAwarded: dailyBonus });
        }
    }
    const updated = await User_1.User.findByIdAndUpdate(u._id, { xp: u.xp + award + dailyBonus, coins: u.coins + coinsEarned }, { new: true });
    if (dailyClaimed && coinsEarned > 0) {
        await (0, ledger_1.recordTransaction)(u._id, coinsEarned, "DAILY_CHALLENGE", `daily challenge solved: ${refId}`);
    }
    res.status(201).json({ xpEarned: award, dailyBonus, coinsEarned, streakMultiplier: multiplier, streakDays: touched.state.count, user: (0, auth_2.serializeUser)(updated) });
});
exports.default = router;
//# sourceMappingURL=progress.js.map