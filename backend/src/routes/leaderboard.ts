// ─── Leaderboard route ────────────────────────────────────────────────────────
import { Router, Request, Response } from "express";
import { optionalAuth } from "../middleware/auth";
import { User } from "../models/User";
import { BOTS } from "../lib/bots";
import { getLevelInfo } from "../lib/game";
import { computeStreakState } from "../lib/streak";
import type { LeaderboardEntry } from "../../../modules/types";

const router = Router();

router.get("/", optionalAuth, async (req: Request, res: Response) => {
  const me = req.user;
  const users = await User.find().sort({ rating: -1 }).limit(25).lean();

  const entries: LeaderboardEntry[] = [
    ...users.map((u: any) => ({
      id: u._id.toString(),
      name: u.username,
      rating: u.rating,
      wins: u.wins,
      losses: u.losses,
      draws: u.draws,
      level: getLevelInfo(u.xp).level,
      isBot: false,
      isMe: me?._id.toString() === u._id.toString(),
      xp: u.xp,
      streak: computeStreakState(u.streakCount, u.lastActiveDay).count,
    })),
    ...BOTS.map((b: any, i: number) => ({
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

export default router;
