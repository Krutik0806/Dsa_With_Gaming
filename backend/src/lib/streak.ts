// ─── Daily streak engine (server-only, Mongoose version) ─────────────────────
import { IUser } from "../models/User";
import { User } from "../models/User";

export interface StreakTier {
  multiplier: number;
  label: string;
  bonusPct: number;
}

export const STREAK_TIERS: { min: number; tier: StreakTier }[] = [
  { min: 30, tier: { multiplier: 1.75, label: "Inferno", bonusPct: 75 } },
  { min: 14, tier: { multiplier: 1.5, label: "Blazing", bonusPct: 50 } },
  { min: 7, tier: { multiplier: 1.25, label: "On Fire", bonusPct: 25 } },
  { min: 3, tier: { multiplier: 1.1, label: "Heating Up", bonusPct: 10 } },
  { min: 0, tier: { multiplier: 1, label: "Warming Up", bonusPct: 0 } },
];

export const CHECK_IN_XP = 25;

function dayKey(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dayGap(a: string, b: string): number | null {
  const da = Date.parse(`${a}T00:00:00Z`);
  const db = Date.parse(`${b}T00:00:00Z`);
  if (Number.isNaN(da) || Number.isNaN(db)) return null;
  return Math.round((db - da) / 86400000);
}

export function todayKey(): string {
  return dayKey(0);
}

export function tierFor(streakCount: number): StreakTier {
  return STREAK_TIERS.find((t) => streakCount >= t.min)!.tier;
}

export interface StreakState {
  count: number;
  activeToday: boolean;
  alive: boolean;
  multiplier: number;
  multiplierLabel: string;
  bonusPct: number;
  daysToNextTier: number | null;
  nextTierLabel: string | null;
  nextTierBonusPct: number | null;
  freezes: number;
  freezeProtected: boolean;
  freezesToConsume: number;
}

export function computeStreakState(
  streakCount: number,
  lastActiveDay: string | null | undefined,
  freezes = 0
): StreakState {
  const today = todayKey();
  const activeToday = lastActiveDay === today;
  const gap = lastActiveDay ? dayGap(lastActiveDay, today) : null;
  const missed = gap === null || gap <= 1 ? 0 : gap - 1;
  const freezeProtected = !activeToday && missed > 0 && missed <= freezes;
  const alive = activeToday || gap === 1 || freezeProtected;
  const effectiveCount = alive ? streakCount : 0;
  const tier = tierFor(effectiveCount);
  const nextTierDef = [...STREAK_TIERS]
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

export async function touchStreakActivity(user: IUser): Promise<{
  user: IUser;
  state: StreakState;
  justActivated: boolean;
  freezesConsumed: number;
}> {
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

  const updated = await User.findByIdAndUpdate(
    user._id,
    { streakCount: newCount, lastActiveDay: today, freezes: Math.max(0, freezesLeft) },
    { new: true }
  );
  return {
    user: updated!,
    state: computeStreakState(newCount, today, Math.max(0, freezesLeft)),
    justActivated: true,
    freezesConsumed: bridged ? missed : 0,
  };
}
