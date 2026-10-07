"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHECK_IN_XP = exports.STREAK_TIERS = void 0;
exports.todayKey = todayKey;
exports.tierFor = tierFor;
exports.computeStreakState = computeStreakState;
exports.touchStreakActivity = touchStreakActivity;
const User_1 = require("../models/User");
exports.STREAK_TIERS = [
    { min: 30, tier: { multiplier: 1.75, label: "Inferno", bonusPct: 75 } },
    { min: 14, tier: { multiplier: 1.5, label: "Blazing", bonusPct: 50 } },
    { min: 7, tier: { multiplier: 1.25, label: "On Fire", bonusPct: 25 } },
    { min: 3, tier: { multiplier: 1.1, label: "Heating Up", bonusPct: 10 } },
    { min: 0, tier: { multiplier: 1, label: "Warming Up", bonusPct: 0 } },
];
exports.CHECK_IN_XP = 25;
function dayKey(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function dayGap(a, b) {
    const da = Date.parse(`${a}T00:00:00Z`);
    const db = Date.parse(`${b}T00:00:00Z`);
    if (Number.isNaN(da) || Number.isNaN(db))
        return null;
    return Math.round((db - da) / 86400000);
}
function todayKey() {
    return dayKey(0);
}
function tierFor(streakCount) {
    return exports.STREAK_TIERS.find((t) => streakCount >= t.min).tier;
}
function computeStreakState(streakCount, lastActiveDay, freezes = 0) {
    const today = todayKey();
    const activeToday = lastActiveDay === today;
    const gap = lastActiveDay ? dayGap(lastActiveDay, today) : null;
    const missed = gap === null || gap <= 1 ? 0 : gap - 1;
    const freezeProtected = !activeToday && missed > 0 && missed <= freezes;
    const alive = activeToday || gap === 1 || freezeProtected;
    const effectiveCount = alive ? streakCount : 0;
    const tier = tierFor(effectiveCount);
    const nextTierDef = [...exports.STREAK_TIERS]
        .sort((a, b) => a.min - b.min)
        .find((t) => t.min > effectiveCount);
    return {
        count: effectiveCount,
        activeToday,
        alive,
        multiplier: tier.multiplier,
        multiplierLabel: tier.label,
        bonusPct: tier.bonusPct,
        daysToNextTier: nextTierDef ? nextTierDef.min - effectiveCount : null,
        nextTierLabel: nextTierDef ? nextTierDef.tier.label : null,
        nextTierBonusPct: nextTierDef ? nextTierDef.tier.bonusPct : null,
        freezes,
        freezeProtected,
        freezesToConsume: freezeProtected ? missed : 0,
    };
}
async function touchStreakActivity(user) {
    const today = todayKey();
    if (user.lastActiveDay === today) {
        return {
            user,
            state: computeStreakState(user.streakCount, user.lastActiveDay, user.freezes),
            justActivated: false,
            freezesConsumed: 0,
        };
    }
    const gap = user.lastActiveDay ? dayGap(user.lastActiveDay, today) : null;
    const missed = gap === null || gap <= 1 ? 0 : gap - 1;
    const bridged = missed > 0 && missed <= user.freezes;
    const newCount = gap === 1 || bridged ? user.streakCount + 1 : 1;
    const freezesLeft = bridged ? user.freezes - missed : user.freezes;
    const updated = await User_1.User.findByIdAndUpdate(user._id, { streakCount: newCount, lastActiveDay: today, freezes: Math.max(0, freezesLeft) }, { new: true });
    return {
        user: updated,
        state: computeStreakState(newCount, today, Math.max(0, freezesLeft)),
        justActivated: true,
        freezesConsumed: bridged ? missed : 0,
    };
}
//# sourceMappingURL=streak.js.map