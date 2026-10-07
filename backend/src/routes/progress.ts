// ─── Progress routes: GET+POST /api/progress ─────────────────────────────────
import { Router, Request, Response } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { User } from "../models/User";
import { Progress } from "../models/Progress";
import { serializeUser } from "../lib/auth";
import { getLesson } from "../../../modules/data/lessons";
import { getProblem } from "../../../modules/data/problems";
import { XP_REWARDS } from "../lib/game";
import { touchStreakActivity, todayKey } from "../lib/streak";
import { dailyProblem, xpForProblem } from "../lib/daily";
import { COIN_REWARDS } from "../lib/shop";
import { recordTransaction } from "../lib/ledger";

const router = Router();
router.use(requireAuth);

const schema = z.object({
  kind: z.enum(["LESSON", "PROBLEM"]),
  refId: z.string().min(1).max(64),
});

function xpFor(kind: string, refId: string): number {
  if (kind === "LESSON") return getLesson(refId) ? XP_REWARDS.LESSON : 0;
  const problem = getProblem(refId);
  if (!problem) return 0;
  return xpForProblem(problem.difficulty);
}

router.get("/", async (req: Request, res: Response) => {
  const rows = await Progress.find({ userId: req.user!._id }).lean();
  const lessons = rows.filter((r: any) => r.kind === "LESSON").map((r: any) => r.refId);
  const problems = rows.filter((r: any) => r.kind === "PROBLEM").map((r: any) => r.refId);
  const dailyDone = rows.some((r: any) => r.kind === "DAILY" && r.refId === todayKey());
  res.json({ lessons, problems, dailyDone });
});

router.post("/", async (req: Request, res: Response) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const { kind, refId } = parsed.data;
  const user = req.user!;

  const baseXp = xpFor(kind, refId);
  if (baseXp === 0) { res.status(404).json({ error: "Unknown lesson or problem" }); return; }

  const existing = await Progress.findOne({ userId: user._id, kind, refId });
  if (existing) {
    res.json({ xpEarned: 0, alreadyCompleted: true, user: serializeUser(user) });
    return;
  }

  const touched = await touchStreakActivity(user);
  const u = touched.user;
  const multiplier = touched.state.multiplier;
  const award = Math.round(baseXp * multiplier);

  await Progress.create({ userId: u._id, kind, refId, xpAwarded: award });

  let dailyBonus = 0;
  let coinsEarned = 0;
  let dailyClaimed = false;
  if (kind === "PROBLEM" && refId === dailyProblem().slug) {
    const dailyKey = todayKey();
    const alreadyDaily = await Progress.findOne({ userId: u._id, kind: "DAILY", refId: dailyKey });
    if (!alreadyDaily) {
      dailyBonus = award;
      coinsEarned = COIN_REWARDS.DAILY_CHALLENGE;
      dailyClaimed = true;
      await Progress.create({ userId: u._id, kind: "DAILY", refId: dailyKey, xpAwarded: dailyBonus });
    }
  }

  const updated = await User.findByIdAndUpdate(
    u._id,
    { xp: u.xp + award + dailyBonus, coins: u.coins + coinsEarned },
    { new: true }
  );
  if (dailyClaimed && coinsEarned > 0) {
    await recordTransaction(u._id, coinsEarned, "DAILY_CHALLENGE", `daily challenge solved: ${refId}`);
  }

  res.status(201).json({ xpEarned: award, dailyBonus, coinsEarned, streakMultiplier: multiplier, streakDays: touched.state.count, user: serializeUser(updated!) });
});

export default router;
