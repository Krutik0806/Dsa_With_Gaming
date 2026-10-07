
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { CalendarDays, Check, Flame, Loader2, Shield, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { DifficultyBadge } from "@/components/game/difficulty-badge";
import { playSound } from "@/lib/sound";
import { dailyProblem } from "@/lib/daily";
import type { ProgressResponse, StreakState } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * "Today in the arena" — daily check-in streak + the daily challenge,
 * the two daily-retention hooks on the dashboard.
 */
export function DailyHub({ progress }: { progress: ProgressResponse | null }) {
  const { user: userRaw, setUser } = useAuth(); const user = userRaw!;
  const [streak, setStreak] = useState<StreakState | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState(false);

  useEffect(() => {
    api.get("/streak").then(r=>r.data)
      .then((d) => setStreak(d.state))
      .catch(() => setStreak(null));
  }, []);

  const checkIn = async () => {
    if (checkingIn || streak?.activeToday) return;
    setCheckingIn(true);
    try {
      const data = await api.post("/streak").then(r => r.data);
      setStreak(data.state);
      if (data.user) setUser(data.user);
      setJustCheckedIn(true);
      playSound("xp");
      toast.success(`Day ${data.state.count} streak — +${data.checkInBonus} XP · +${data.coinsEarned} coins`, {
        description:
          data.state.bonusPct > 0
            ? `Multiplier: ×${data.state.multiplier} (${data.state.multiplierLabel}) on all XP today.`
            : "Check back tomorrow — 3 days unlocks the ×1.1 multiplier.",
      });
    } catch {
      toast.error("Check-in failed — try again.");
    } finally {
      setCheckingIn(false);
    }
  };

  const daily = dailyProblem();
  const problemSolved = progress?.problems.includes(daily.slug) ?? false;
  const dailyDone = progress?.dailyDone ?? false;

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {/* ── Streak card ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
            <Flame className="h-3.5 w-3.5 text-orange-400" /> daily streak
          </h2>
          {streak && streak.bonusPct > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/40 bg-orange-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-orange-300">
              <Sparkles className="h-3 w-3" /> ×{streak.multiplier} · {streak.multiplierLabel}
            </span>
          )}
        </div>

        {streak === null ? (
          <div className="cc-shimmer h-28 w-full rounded-xl" />
        ) : (
          <div className="flex items-start gap-5">
            <div className="relative shrink-0 text-center">
              {justCheckedIn && (
                <span className="cc-burst pointer-events-none absolute inset-0 m-auto h-14 w-14 rounded-full border-2 border-orange-400/70" aria-hidden />
              )}
              <Flame
                className={cn(
                  "mx-auto h-10 w-10",
                  streak.count >= 3 ? "cc-flame text-orange-400" : "text-zinc-600",
                  !streak.alive && streak.count === 0 && "text-zinc-700"
                )}
                aria-hidden
              />
              <p className="mt-1 font-mono text-3xl font-black leading-none text-zinc-100">{streak.count}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                {streak.count === 1 ? "day" : "days"}
              </p>
            </div>

            <div className="min-w-0 flex-1">
              {/* 7-day dots */}
              <div className="flex items-center gap-1.5" aria-label={`${Math.min(streak.count, 7)} of last 7 days active`}>
                {Array.from({ length: 7 }, (_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-2.5 flex-1 rounded-full transition-colors",
                      i < Math.min(streak.count, 7) ? "bg-orange-400" : "bg-zinc-800"
                    )}
                  />
                ))}
              </div>

              {streak.activeToday ? (
                <p className="mt-3 flex items-center gap-1.5 font-mono text-xs text-emerald-400">
                  <Check className="h-3.5 w-3.5" /> checked in — streak safe until midnight
                </p>
              ) : streak.alive ? (
                <button
                  onClick={checkIn}
                  disabled={checkingIn}
                  className="cc-pulse-glow mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-orange-500 px-4 font-mono text-xs font-bold text-zinc-950 transition-all hover:bg-orange-400 disabled:opacity-60"
                >
                  {checkingIn ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Flame className="h-3.5 w-3.5" />}
                  check in · +25 XP · +15 coins
                </button>
              ) : (
                <button
                  onClick={checkIn}
                  disabled={checkingIn}
                  className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg border border-orange-500/50 bg-orange-500/10 px-4 font-mono text-xs font-bold text-orange-300 transition-all hover:bg-orange-500/20 disabled:opacity-60"
                >
                  {checkingIn ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Flame className="h-3.5 w-3.5" />}
                  start a new streak
                </button>
              )}

              <p className="mt-2.5 font-mono text-[11px] leading-relaxed text-zinc-500">
                {streak.daysToNextTier !== null
                  ? `${streak.daysToNextTier} more ${streak.daysToNextTier === 1 ? "day" : "days"} → ${streak.nextTierLabel} (+${streak.nextTierBonusPct}% XP)`
                  : "maximum multiplier — the arena burns"}
                {" · every lesson, solve and battle counts"}
              </p>
              {streak.freezes > 0 && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 font-mono text-[10px] font-bold text-sky-300">
                  <Shield className="h-3 w-3" />
                  {streak.freezes} streak freeze{streak.freezes === 1 ? "" : "s"} banked
                  {streak.freezeProtected && streak.freezesToConsume > 0
                    ? ` — ${streak.freezesToConsume} will bridge your gap`
                    : " — auto-protects missed days"}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Daily challenge card ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
        {/* animated gold hairline */}
        <div className="cc-gold-sweep h-1 w-full" aria-hidden />
        <div className="p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
              <CalendarDays className="h-3.5 w-3.5 text-amber-400" /> today&apos;s challenge
            </h2>
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300">
              2× XP · +50 coins
            </span>
          </div>

          {progress === null ? (
            <div className="cc-shimmer h-28 w-full rounded-xl" />
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-bold text-zinc-100">{daily.title}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <DifficultyBadge difficulty={daily.difficulty} />
                  <span className="font-mono text-[11px] text-zinc-500">{daily.topics[0]}</span>
                </div>
                <p className="mt-2.5 font-mono text-[11px] leading-relaxed text-zinc-500">
                  {dailyDone
                    ? "solved today — double XP banked. Same problem for everyone, all day."
                    : problemSolved
                      ? "you solved this one before — no double XP for repeats."
                      : "first solve of the day banks double. one problem, everyone, 24 hours."}
                </p>
              </div>

              <div className="shrink-0 text-right">
                {dailyDone ? (
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-amber-500/50 bg-amber-500/15 text-amber-400">
                    <Check className="h-5 w-5" />
                  </span>
                ) : !problemSolved ? (
                  <Link to={`/app/practice/${daily.slug}`}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-amber-500 px-4 font-mono text-xs font-bold text-zinc-950 transition-all hover:bg-amber-400"
                  >
                    solve it
                  </Link>
                ) : (
                  <Link to="/app/practice"
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/60 px-4 font-mono text-xs text-zinc-300 transition-colors hover:border-zinc-500"
                  >
                    browse all
                  </Link>
                )}
                <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-zinc-600">
                  +{daily.difficulty === "EASY" ? 100 : daily.difficulty === "MEDIUM" ? 200 : 300} base
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
