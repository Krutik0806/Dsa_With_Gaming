"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ─── Streak route ─────────────────────────────────────────────────────────────
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const User_1 = require("../models/User");
const auth_2 = require("../lib/auth");
const streak_1 = require("../lib/streak");
const shop_1 = require("../lib/shop");
const ledger_1 = require("../lib/ledger");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.get("/", (req, res) => {
    const user = req.user;
    const state = (0, streak_1.computeStreakState)(user.streakCount, user.lastActiveDay, user.freezes);
    res.json({ state, checkInXp: streak_1.CHECK_IN_XP, checkInCoins: shop_1.COIN_REWARDS.DAILY_CHECKIN });
});
router.post("/", async (req, res) => {
    const user = req.user;
    const before = (0, streak_1.computeStreakState)(user.streakCount, user.lastActiveDay, user.freezes);
    if (before.activeToday) {
        res.json({ state: before, user: (0, auth_2.serializeUser)(user), checkInBonus: 0, coinsEarned: 0, alreadyCheckedIn: true });
        return;
    }
    const { user: touched, state, justActivated, freezesConsumed } = await (0, streak_1.touchStreakActivity)(user);
    const bonus = justActivated ? streak_1.CHECK_IN_XP : 0;
    const coinsEarned = justActivated ? shop_1.COIN_REWARDS.DAILY_CHECKIN : 0;
    const updated = await User_1.User.findByIdAndUpdate(touched._id, { xp: touched.xp + bonus, coins: touched.coins + coinsEarned }, { new: true });
    if (coinsEarned > 0) {
        await (0, ledger_1.recordTransaction)(touched._id, coinsEarned, "DAILY_CHECKIN", `daily check-in · day ${state.count}`);
    }
    res.status(201).json({ state, user: (0, auth_2.serializeUser)(updated), checkInBonus: bonus, coinsEarned, freezesConsumed, alreadyCheckedIn: false });
});
exports.default = router;
//# sourceMappingURL=streak.js.map