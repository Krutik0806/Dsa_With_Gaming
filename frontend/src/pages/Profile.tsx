
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import {
  Crown,
  Flame,
  Minus,
  Receipt,
  Shield,
  ShoppingBag,
  Sparkles,
  Swords,
  TrendingUp,
  Trophy,
  User as UserIcon,
  X,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/game/page-header";
import { PlayerAvatar } from "@/components/game/player-avatar";
import { RankBadge } from "@/components/game/rank-badge";
import { XPBar } from "@/components/game/xp-bar";
import { SkillRadar } from "@/components/game/skill-radar";
import { RatingChart } from "@/components/game/rating-chart";
import { AchievementsGallery } from "@/components/game/achievements-gallery";
import { CoinActivity } from "@/components/game/coin-activity";
import { useAuth } from "@/lib/auth-context";
import { timeAgo } from "@/lib/format";
import { placementLabel } from "@/lib/data/tournaments";
import type { ProfileResponse } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const { user: userRaw } = useAuth(); const user = userRaw!;
  const [profile, setProfile] = useState<ProfileResponse | null>(null);

  useEffect(() => {
    api.get("/profile").then(r=>r.data)
      .then(setProfile)
      .catch(() => setProfile(null));
  }, []);

  const totalMatches = user.wins + user.losses + user.draws;
  const winrate = totalMatches > 0 ? Math.round((user.wins / totalMatches) * 100) : 0;

  const cups = profile?.tournaments;

  const weakest = profile?.skills.reduce((min, s) => (s.value < min.value ? s : min), profile.skills[0]);
  const strongest = profile?.skills.reduce((max, s) => (s.value > max.value ? s : max), profile.skills[0]);

  return (
    <div>
      <PageHeader
        icon={UserIcon}
        title="Profile"
        description="Your competitive identity: rating, level, skill map, and every trophy you've pried from the arena — ladder and cups alike."
      />

      {/* Identity card */}
      <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <PlayerAvatar name={user.username} size="xl" frame={user.equippedFrame} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-mono text-xl font-bold">{user.username}</h2>
                {user.isGuest && (
                  <span className="rounded-md border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                    guest
                  </span>
                )}
                {profile?.wallet?.equippedTitleName && (
                  <span
                    title="equipped title — swap it in the shop"
                    className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300"
                  >
                    <Sparkles className="h-3 w-3" /> {profile.wallet.equippedTitleName}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">joined {new Date(user.createdAt).toLocaleDateString()}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <RankBadge rating={user.rating} showRating />
                {profile?.streak && profile.streak.count >= 1 && (
                  <span
                    title={profile.streak.bonusPct > 0 ? `×${profile.streak.multiplier} XP multiplier — ${profile.streak.multiplierLabel}` : "3+ days unlocks an XP multiplier"}
                    className="inline-flex items-center gap-1 rounded-lg border border-orange-500/40 bg-orange-500/10 px-2 py-1 font-mono text-[11px] font-bold text-orange-300"
                  >
                    <Flame className={cn("h-3.5 w-3.5", profile.streak.count >= 3 && "cc-flame")} />
                    {profile.streak.count}-day
                    {profile.streak.bonusPct > 0 && <span className="text-orange-400/80">×{profile.streak.multiplier}</span>}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex-1 sm:px-6">
            <XPBar xp={user.xp} />
            <div className="mt-4 grid grid-cols-4 gap-2 text-center font-mono">
              {[
                [user.wins, "wins", "text-emerald-400"],
                [user.losses, "losses", "text-red-400"],
                [user.draws, "draws", "text-zinc-300"],
                [`${winrate}%`, "win rate", "text-amber-400"],
              ].map(([v, l, c]) => (
                <div key={String(l)} className="rounded-xl border border-zinc-800 bg-zinc-950/60 py-2.5">
                  <div className={cn("text-lg font-bold", String(c))}>{v}</div>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Rating trajectory */}
      <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">rating trajectory</h2>
          <span className="hidden font-mono text-[10px] text-zinc-600 sm:inline">last {profile?.ratingHistory.length ?? 0} rated matches · hover a point</span>
        </div>
        {profile === null ? (
          <Skeleton className="h-56 w-full bg-zinc-800/60" />
        ) : profile.ratingHistory.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <TrendingUp className="h-8 w-8 text-zinc-700" />
            <p className="mt-3 font-mono text-xs text-zinc-500">no rated matches yet — your line starts with the first battle</p>
          </div>
        ) : (
          <RatingChart points={profile.ratingHistory} />
        )}
      </section>

      {/* Wallet — coins, freezes, equipped cosmetics */}
      <section className="mb-6 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
        <div className="flex items-center justify-between border-b border-zinc-800/70 px-5 py-3">
          <h2 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">
            <Receipt className="h-3.5 w-3.5 text-amber-400" /> wallet
          </h2>
          <Link to="/app/shop"
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1 font-mono text-xs font-bold text-amber-400 transition-colors hover:bg-amber-500/20"
          >
            <ShoppingBag className="h-3.5 w-3.5" /> visit shop
          </Link>
        </div>
        {profile === null ? (
          <div className="p-5"><Skeleton className="h-20 w-full bg-zinc-800/60" /></div>
        ) : (
          <div className="grid gap-4 px-5 py-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3">
              <span className="cc-coin-spin inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-amber-400/80 bg-gradient-to-br from-amber-300 to-amber-600 font-mono text-xs font-black text-amber-950" aria-hidden>
                C
              </span>
              <div>
                <p className="font-mono text-lg font-black leading-none text-amber-300">{profile.wallet.coins.toLocaleString()}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500">coins banked</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-sky-500/25 bg-sky-500/5 px-4 py-3">
              <Shield className="h-8 w-8 text-sky-400" />
              <div>
                <p className="font-mono text-lg font-black leading-none text-sky-300">{profile.wallet.freezes}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500">streak freezes</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
              <Sparkles className="h-8 w-8 text-pink-400" />
              <div className="min-w-0">
                <p className="truncate font-mono text-sm font-bold leading-none text-zinc-200">
                  {profile.wallet.equippedFrameName ?? <span className="text-zinc-600">no frame</span>}
                  {profile.wallet.equippedTitleName ? ` · ${profile.wallet.equippedTitleName}` : ""}
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  {profile.wallet.purchases.length} purchase{profile.wallet.purchases.length === 1 ? "" : "s"} logged
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Coin activity — the transaction ledger feed */}
      <CoinActivity entries={profile === null ? null : profile.transactions} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.2fr]">
        {/* Skill map */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
          <h2 className="mb-1 font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">skill map</h2>
          <p className="mb-3 text-xs text-zinc-600">quiz accuracy + practice + lessons, per category</p>
          {profile === null ? (
            <Skeleton className="mx-auto h-64 w-64 bg-zinc-800/60" />
          ) : (
            <>
              <SkillRadar skills={profile.skills} />
              <div className="mt-4 space-y-2.5">
                {profile.skills.map((s) => (
                  <div key={s.category}>
                    <div className="mb-1 flex items-center justify-between font-mono text-[11px]">
                      <span className="text-zinc-400">{s.category}</span>
                      <span className={cn("font-bold", s.value >= 60 ? "text-emerald-400" : s.value >= 30 ? "text-amber-400" : "text-zinc-500")}>
                        {s.value}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className={cn("h-full rounded-full transition-all duration-700", s.value >= 60 ? "bg-emerald-500" : s.value >= 30 ? "bg-amber-400" : "bg-zinc-600")}
                        style={{ width: `${Math.max(2, s.value)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {weakest && strongest && weakest.value !== strongest.value && (
                <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
                  <p className="text-xs leading-relaxed text-zinc-400">
                    Strongest: <span className="font-bold text-emerald-400">{strongest.category}</span> · weakest:{" "}
                    <span className="font-bold text-red-400">{weakest.category}</span> —{" "}
                    <Link to="/app/learn" className="text-emerald-400 underline-offset-2 hover:underline">
                      drill the weak spot
                    </Link>
                  </p>
                </div>
              )}
            </>
          )}
        </section>

        <div className="space-y-4">
          {/* Achievements */}
          <AchievementsGallery achievements={profile?.achievements ?? null} loading={profile === null} />

          {/* Tournament record */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">
                <Crown className="h-3.5 w-3.5 text-amber-400" /> tournament record
              </h2>
              <Link to="/app/tournaments" className="font-mono text-xs text-amber-400 transition-colors hover:text-amber-300">
                full circuit →
              </Link>
            </div>
            {profile === null ? (
              <Skeleton className="h-36 w-full bg-zinc-800/60" />
            ) : !cups || cups.entered === 0 ? (
              <div className="flex flex-col items-center py-5 text-center">
                <Crown className="h-8 w-8 text-zinc-700" />
                <p className="mt-3 text-sm text-zinc-500">No cups yet — the bracket awaits.</p>
                <Link to="/app/tournaments"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 font-mono text-xs font-bold text-amber-400 transition-colors hover:bg-amber-500/20"
                >
                  <Crown className="h-3.5 w-3.5" /> browse live cups
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 py-2.5">
                    <div className="text-lg font-bold text-zinc-100">{cups.entered}</div>
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500">cups entered</div>
                  </div>
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 py-2.5">
                    <div className="text-lg font-bold text-amber-400">{cups.championships}</div>
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500">titles</div>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 py-2.5">
                    <div className="text-lg font-bold text-zinc-100">{placementLabel(cups.bestPlacement)}</div>
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500">best finish</div>
                  </div>
                </div>
                <ul className="mt-3 space-y-1.5">
                  {cups.history.slice(0, 4).map((h) => (
                    <li key={h.slug}>
                      <Link to={`/app/tournaments/${h.slug}`}
                        className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 transition-colors hover:border-amber-500/40"
                      >
                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded bg-zinc-800/70 text-zinc-400">
                          {h.gameType === "CODING" ? <Swords className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-300">{h.name}</span>
                        {h.status === "ACTIVE" ? (
                          <span className="shrink-0 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-emerald-300">
                            round {h.round}
                          </span>
                        ) : h.status === "CHAMPION" ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-amber-300">
                            <Trophy className="h-3 w-3" /> champion
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-md border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-zinc-400">
                            {placementLabel(h.placement)}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {/* Progress overview */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
            <h2 className="mb-4 font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">the grind</h2>
            {profile === null ? (
              <Skeleton className="h-20 w-full bg-zinc-800/60" />
            ) : (
              <div className="grid grid-cols-2 gap-3 font-mono">
                <Link to="/app/learn" className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 transition-colors hover:border-emerald-600/40">
                  <p className="text-2xl font-bold text-zinc-100">
                    {profile.lessonsCompleted}
                    <span className="text-sm text-zinc-600">/{profile.lessonsTotal}</span>
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500">lessons mastered</p>
                </Link>
                <Link to="/app/practice" className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 transition-colors hover:border-emerald-600/40">
                  <p className="text-2xl font-bold text-zinc-100">
                    {profile.problemsSolved}
                    <span className="text-sm text-zinc-600">/{profile.problemsTotal}</span>
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500">problems solved</p>
                </Link>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <p className="text-2xl font-bold text-zinc-100">{user.xp.toLocaleString()}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500">total xp</p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <p className="text-2xl font-bold text-zinc-100">{totalMatches}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500">battles fought</p>
                </div>
              </div>
            )}
          </section>

          {/* Recent matches */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">recent battles</h2>
              <Link to="/app/history" className="font-mono text-xs text-emerald-400 hover:text-emerald-300">
                view all →
              </Link>
            </div>
            {profile === null ? (
              <Skeleton className="h-24 w-full bg-zinc-800/60" />
            ) : profile.recentMatches.length === 0 ? (
              <p className="py-4 text-center font-mono text-xs text-zinc-600">no battles yet — the arena awaits</p>
            ) : (
              <ul className="space-y-1.5">
                {profile.recentMatches.slice(0, 4).map((m) => (
                  <li key={m.id}>
                    <Link to={`/app/history/${m.id}`}
                      className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 transition-colors hover:border-zinc-600"
                    >
                      <span
                        className={cn(
                          "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded",
                          m.result === "WIN" ? "bg-emerald-500/15 text-emerald-400" : m.result === "LOSS" ? "bg-red-500/15 text-red-400" : "bg-zinc-700/40 text-zinc-300"
                        )}
                      >
                        {m.result === "WIN" ? <Trophy className="h-3 w-3" /> : m.result === "LOSS" ? <X className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-300">
                        vs {m.opponentName} · {m.type === "QUIZ" ? "quiz" : m.problemTitle}
                      </span>
                      <span className={cn("shrink-0 font-mono text-xs font-bold", m.ratingChange >= 0 ? "text-emerald-400" : "text-red-400")}>
                        {m.ratingChange >= 0 ? "+" : ""}
                        {m.ratingChange}
                      </span>
                      <span className="hidden shrink-0 text-[10px] text-zinc-600 sm:inline">{timeAgo(m.createdAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
