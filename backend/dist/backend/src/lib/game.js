"use strict";
// ─── CodeClash game engine: ranks, levels, ELO, XP ───────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIFFICULTY_META = exports.XP_REWARDS = exports.ELO_K = exports.RANKS = void 0;
exports.getRank = getRank;
exports.xpForLevel = xpForLevel;
exports.getLevelInfo = getLevelInfo;
exports.expectedScore = expectedScore;
exports.ratingChange = ratingChange;
exports.newRating = newRating;
exports.clamp = clamp;
exports.RANKS = [
    { key: "BRONZE", name: "Bronze", min: 0, max: 899, color: "#b45309", text: "text-amber-600", chip: "border-amber-700/50 bg-amber-950/50 text-amber-500" },
    { key: "SILVER", name: "Silver", min: 900, max: 1049, color: "#a1a1aa", text: "text-zinc-300", chip: "border-zinc-500/50 bg-zinc-800/60 text-zinc-300" },
    { key: "GOLD", name: "Gold", min: 1050, max: 1199, color: "#fbbf24", text: "text-amber-400", chip: "border-amber-500/50 bg-amber-950/40 text-amber-300" },
    { key: "PLATINUM", name: "Platinum", min: 1200, max: 1399, color: "#5eead4", text: "text-teal-300", chip: "border-teal-400/50 bg-teal-950/40 text-teal-300" },
    { key: "DIAMOND", name: "Diamond", min: 1400, max: 1599, color: "#34d399", text: "text-emerald-400", chip: "border-emerald-500/50 bg-emerald-950/40 text-emerald-300" },
    { key: "MASTER", name: "Master", min: 1600, max: 1799, color: "#f472b6", text: "text-pink-400", chip: "border-pink-500/50 bg-pink-950/40 text-pink-300" },
    { key: "GRANDMASTER", name: "Grandmaster", min: 1800, max: 99999, color: "#ef4444", text: "text-red-400", chip: "border-red-500/50 bg-red-950/40 text-red-300" },
];
function getRank(rating) {
    return exports.RANKS.find((r) => rating >= r.min && rating <= r.max) ?? exports.RANKS[0];
}
// ─── Levels (XP) ─────────────────────────────────────────────────────────────
// Level thresholds: L1=0, L2=300, L3=700, L4=1200, L5=1800, L6=2500 ...
function xpForLevel(level) {
    if (level <= 1)
        return 0;
    const n = level - 1;
    return 300 * n + 50 * n * (n - 1);
}
function getLevelInfo(xp) {
    let level = 1;
    while (xp >= xpForLevel(level + 1))
        level++;
    const base = xpForLevel(level);
    const next = xpForLevel(level + 1);
    const span = next - base;
    const into = xp - base;
    return { level, intoLevel: into, levelSpan: span, progress: span > 0 ? into / span : 0, nextAt: next };
}
// ─── ELO ─────────────────────────────────────────────────────────────────────
exports.ELO_K = 32;
function expectedScore(a, b) {
    return 1 / (1 + Math.pow(10, (b - a) / 400));
}
function ratingChange(userRating, opponentRating, score, k = exports.ELO_K) {
    return Math.round(k * (score - expectedScore(userRating, opponentRating)));
}
function newRating(rating, change) {
    return Math.max(100, rating + change);
}
// ─── XP rewards ──────────────────────────────────────────────────────────────
exports.XP_REWARDS = {
    LESSON: 75,
    PROBLEM_EASY: 100,
    PROBLEM_MEDIUM: 200,
    PROBLEM_HARD: 300,
    PROBLEM_REPEAT: 25,
    QUIZ_PLAY: 50,
    QUIZ_WIN: 50,
    CODE_PLAY: 75,
    CODE_WIN: 75,
    CODE_PER_TEST: 5,
};
exports.DIFFICULTY_META = {
    EASY: { label: "Easy", chip: "border-emerald-500/40 bg-emerald-950/50 text-emerald-400", text: "text-emerald-400", color: "#34d399" },
    MEDIUM: { label: "Medium", chip: "border-amber-500/40 bg-amber-950/50 text-amber-400", text: "text-amber-400", color: "#fbbf24" },
    HARD: { label: "Hard", chip: "border-red-500/40 bg-red-950/50 text-red-400", text: "text-red-400", color: "#ef4444" },
};
function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}
//# sourceMappingURL=game.js.map