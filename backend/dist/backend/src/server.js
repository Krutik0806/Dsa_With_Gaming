"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// ─── Express server entry point ───────────────────────────────────────────────
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const db_1 = require("./db");
// Routes
const auth_1 = __importDefault(require("./routes/auth"));
const match_1 = __importDefault(require("./routes/match"));
const run_1 = __importDefault(require("./routes/run"));
const leaderboard_1 = __importDefault(require("./routes/leaderboard"));
const profile_1 = __importDefault(require("./routes/profile"));
const progress_1 = __importDefault(require("./routes/progress"));
const replay_1 = __importDefault(require("./routes/replay"));
const seasons_1 = __importDefault(require("./routes/seasons"));
const shop_1 = __importDefault(require("./routes/shop"));
const streak_1 = __importDefault(require("./routes/streak"));
const tournaments_1 = __importDefault(require("./routes/tournaments"));
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT ?? 4000);
// ── Middleware ────────────────────────────────────────────────────────────────
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
}));
app.use(express_1.default.json({ limit: "2mb" }));
app.use((0, cookie_parser_1.default)());
// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", auth_1.default);
app.use("/api/match", match_1.default);
app.use("/api/run", run_1.default);
app.use("/api/leaderboard", leaderboard_1.default);
app.use("/api/profile", profile_1.default);
app.use("/api/progress", progress_1.default);
app.use("/api/replay", replay_1.default);
app.use("/api/seasons", seasons_1.default);
app.use("/api/shop", shop_1.default);
app.use("/api/streak", streak_1.default);
app.use("/api/tournaments", tournaments_1.default);
// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));
// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
});
// ── Start ─────────────────────────────────────────────────────────────────────
async function main() {
    await (0, db_1.connectDB)();
    app.listen(PORT, () => {
        console.log(`🚀 Backend running on http://localhost:${PORT}`);
    });
}
main().catch(console.error);
//# sourceMappingURL=server.js.map