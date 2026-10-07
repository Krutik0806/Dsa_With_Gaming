"use strict";
// ─── Small formatting helpers ─────────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeAgo = timeAgo;
exports.formatDuration = formatDuration;
exports.formatDurationLong = formatDurationLong;
exports.avatarColor = avatarColor;
exports.formatValue = formatValue;
function timeAgo(iso) {
    const d = typeof iso === "string" ? new Date(iso) : iso;
    const sec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (sec < 10)
        return "just now";
    if (sec < 60)
        return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60)
        return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24)
        return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day < 30)
        return `${day}d ago`;
    return d.toLocaleDateString();
}
function formatDuration(totalSec) {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}
function formatDurationLong(totalSec) {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    if (m === 0)
        return `${s}s`;
    return `${m}m ${s.toString().padStart(2, "0")}s`;
}
const AVATAR_COLORS = [
    "#34d399", "#fbbf24", "#f472b6", "#5eead4", "#fb923c",
    "#a3e635", "#e879f9", "#f87171", "#2dd4bf", "#facc15",
];
function avatarColor(seed) {
    let h = 0;
    for (let i = 0; i < seed.length; i++)
        h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function formatValue(v) {
    if (v === undefined)
        return "undefined";
    if (typeof v === "string")
        return v;
    try {
        return JSON.stringify(v) ?? String(v);
    }
    catch {
        return String(v);
    }
}
//# sourceMappingURL=format.js.map