// ─── Streak route ─────────────────────────────────────────────────────────────
import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { User } from "../models/User";
import { serializeUser } from "../lib/auth";
import { CHECK_IN_XP, computeStreakState, touchStreakActivity } from "../lib/streak";
import { COIN_REWARDS } from "../lib/shop";
import { recordTransaction } from "../lib/ledger";

const router = Router();
router.use(requireAuth);

router.get("/", (req: Request, res: Response) => {
  const user = req.user!;
  const state = computeStreakState(user.streakCount, user.lastActiveDay, user.freezes);
  res.json({ state, checkInXp: CHECK_IN_XP, checkInCoins: COIN_REWARDS.DAILY_CHECKIN });
});

router.post("/", async (req: Request, res: Response) => {
  const user = req.user!;
  const before = computeStreakState(user.streakCount, user.lastActiveDay, user.freezes);
  if (before.activeToday) {
    res.json({ state: before, user: serializeUser(user), checkInBonus: 0, coinsEarned: 0, alreadyCheckedIn: true });
    return;
  }

  const { user: touched, state, justActivated, freezesConsumed } = await touchStreakActivity(user);
  const bonus = justActivated ? CHECK_IN_XP : 0;
  const coinsEarned = justActivated ? COIN_REWARDS.DAILY_CHECKIN : 0;
  const updated = await User.findByIdAndUpdate(
    touched._id,
    { xp: touched.xp + bonus, coins: touched.coins + coinsEarned },
    { new: true }
  );
  if (coinsEarned > 0) {
    await recordTransaction(touched._id, coinsEarned, "DAILY_CHECKIN", `daily check-in · day ${state.count}`);
  }
  res.status(201).json({ state, user: serializeUser(updated!), checkInBonus: bonus, coinsEarned, freezesConsumed, alreadyCheckedIn: false });
});

export default router;
