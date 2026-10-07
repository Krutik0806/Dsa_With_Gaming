// ─── Express server entry point ───────────────────────────────────────────────
import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./db";

// Routes
import authRouter from "./routes/auth";
import matchRouter from "./routes/match";
import runRouter from "./routes/run";
import leaderboardRouter from "./routes/leaderboard";
import profileRouter from "./routes/profile";
import progressRouter from "./routes/progress";
import replayRouter from "./routes/replay";
import seasonsRouter from "./routes/seasons";
import shopRouter from "./routes/shop";
import streakRouter from "./routes/streak";
import tournamentsRouter from "./routes/tournaments";

import http from "http";
import { setupArenaServer } from "./arena-server";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api/match", matchRouter);
app.use("/api/run", runRouter);
app.use("/api/leaderboard", leaderboardRouter);
app.use("/api/profile", profileRouter);
app.use("/api/progress", progressRouter);
app.use("/api/replay", replayRouter);
app.use("/api/seasons", seasonsRouter);
app.use("/api/shop", shopRouter);
app.use("/api/streak", streakRouter);
app.use("/api/tournaments", tournamentsRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

// ── Start ─────────────────────────────────────────────────────────────────────
async function main() {
  await connectDB();
  const httpServer = http.createServer(app);
  setupArenaServer(httpServer, FRONTEND_URL);

  httpServer.listen(PORT, () => {
    console.log(`🚀 Backend running on http://localhost:${PORT}`);
    console.log(`⚔️ Real-time Arena WebSocket running on ws://localhost:${PORT}`);
  });
}

main().catch(console.error);
