"use strict";
// ─── Daily challenge ─────────────────────────────────────────────────────────
// One deterministic problem per calendar day — everyone in the arena faces
// the same one, and the first solve of the day banks double XP.
Object.defineProperty(exports, "__esModule", { value: true });
exports.todayKey = todayKey;
exports.dailyProblem = dailyProblem;
exports.isDailyProblem = isDailyProblem;
exports.xpForProblem = xpForProblem;
const problems_1 = require("../../../modules/data/problems");
function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
/** Deterministic date hash → problem index (same for everyone that day). */
function dailyProblem() {
    const key = todayKey();
    let h = 0;
    for (let i = 0; i < key.length; i++) {
        h = (h * 31 + key.charCodeAt(i)) >>> 0;
    }
    return problems_1.PROBLEMS[h % problems_1.PROBLEMS.length];
}
function isDailyProblem(slug) {
    return dailyProblem().slug === slug;
}
/** XP value of a problem by difficulty (mirrors XP_REWARDS). */
function xpForProblem(difficulty) {
    return difficulty === "EASY" ? 100 : difficulty === "MEDIUM" ? 200 : 300;
}
//# sourceMappingURL=daily.js.map