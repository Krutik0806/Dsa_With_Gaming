
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import {
  CalendarClock,
  Crown,
  Flame,
  History,
  Medal,
  Swords,
  Trophy,
} from "lucide-react";
import { PageHeader } from "@/components/game/page-header";
import { PlayerAvatar } from "@/components/game/player-avatar";
import { RankBadge } from "@/components/game/rank-badge";
import type { SeasonArchiveResponse } from "@/lib/season-archive";
import { cn } from "@/lib/utils";

const SEASON_REWARDS = [
  { place: "champion", icon: Crown, perk: "season champion title + 500 coins", accent: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  { place: "runner-up", icon: Medal, perk: "finalist flair + 250 coins", accent: "text-zinc-300 border-zinc-600/40 bg-zinc-700/20" },
  { place: "top 10%", icon: Trophy, perk: "contender badge + 100 coins", accent: "text-orange-300 border-orange-500/30 bg-orange-500/10" },
  { place: "everyone", icon: Flame, perk: "placement keeps next season's seed", accent: "text-sky-300 border-sky-500/30 bg-sky-500/10" },
];

export default function SeasonsPage() {
  const [data, setData] = useState<SeasonArchiveResponse | null>(null);

  useEffect(() => {
    api.get("/seasons").then(r=>r.data)
      .then(setData)
      .catch(() => setData(null));
  }, []);

  return (
    <div>
      <PageHeader
        icon={History}
        title="Season Archive"
        description="Every week is a season on the CodeClash ladder. Champions are crowned, coins are paid, seeds are set — this is the record book."
        actions={
          <Link to="/app/leaderboard"
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 font-mono text-xs font-bold text-emerald-400 transition-colors hover:bg-emerald-500/20"
          >
            <Trophy className="h-3.5 w-3.5" /> live ladder
          </Link>
        }
      />

      {data === null ? (
        <div className="space-y-4">
          <div className="cc-shimmer h-44 rounded-2xl" />
          <div className="cc-shimmer h-24 rounded-2xl" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="cc-shimmer h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Current season hero ─────────────────────────────────────────── */}
          <section className="relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-zinc-900/40 p-5 sm:p-7">
            <div className="cc-radial-fade pointer-events-none absolute inset-0" aria-hidden />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center">
              <div className="flex items-center gap-5">
                <div className="text-center">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-400/80">season</p>
                  <p className="font-mono text-5xl font-black leading-none text-zinc-50">
                    S{data.current.season}
                  </p>
                </div>
                <div className="h-16 w-px bg-zinc-800" aria-hidden />
                <div>
                  <p className="flex items-center gap-2 font-mono text-sm text-zinc-300">
                    <CalendarClock className="h-4 w-4 text-zinc-500" />
                    ends in {data.current.daysLeft}d {data.current.hoursLeft}h
                  </p>
                  <div className="mt-2.5 w-56 max-w-full">
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all duration-700"
                        style={{ width: `${Math.max(3, Math.round(data.current.progress * 100))}%` }}
                      />
                    </div>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-zinc-600">
                      week {Math.round(data.current.progress * 100)}% complete
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 lg:border-l lg:border-zinc-800 lg:pl-6">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">your standing</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span className="font-mono text-3xl font-black text-emerald-400">top {100 - data.yourStanding.pct}%</span>
                  <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    {data.yourStanding.label}
                  </span>
                  <RankBadge rating={data.yourStanding.rating} showRating />
                </div>
                <p className="mt-2 font-mono text-[11px] leading-relaxed text-zinc-500">
                  finish the week here and next season&apos;s seed is locked. rating is earned in battles and cups only —{" "}
                  <Link to="/app/game/battle" className="text-emerald-400 underline-offset-2 hover:underline">
                    go defend it
                  </Link>
                  .
                </p>
              </div>
            </div>
          </section>

          {/* ── Season rewards ──────────────────────────────────────────────── */}
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SEASON_REWARDS.map((r) => (
              <div key={r.place} className={cn("rounded-2xl border px-4 py-3.5", r.accent)}>
                <p className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider">
                  <r.icon className="h-3.5 w-3.5" /> {r.place}
                </p>
                <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-zinc-400">{r.perk}</p>
              </div>
            ))}
          </section>

          {/* ── Past seasons ────────────────────────────────────────────────── */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
              <Crown className="h-3.5 w-3.5 text-amber-400" /> the record book
            </h2>
            <div className="space-y-3">
              {data.pastSeasons.map((s) => (
                <article
                  key={s.season}
                  className="grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 transition-colors hover:border-zinc-700 sm:grid-cols-[auto_1fr_auto] sm:items-center"
                >
                  {/* season + date */}
                  <div className="flex items-center gap-4 sm:flex-col sm:gap-1 sm:text-center">
                    <p className="font-mono text-2xl font-black text-zinc-400">S{s.season}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">
                      {new Date(s.startAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>

                  {/* champion + finalist */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <PlayerAvatar name={s.champion.name} size="lg" color={s.champion.color} frame="frame-laurel" />
                      </div>
                      <div>
                        <p className="flex items-center gap-1.5 font-mono text-sm font-bold text-amber-300">
                          <Crown className="h-3.5 w-3.5" /> {s.champion.name}
                        </p>
                        <p className="font-mono text-[11px] text-zinc-500">
                          champion · {s.champion.rating} peak · <span className="text-zinc-400">“{s.champion.tagline}”</span>
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-600">
                          <Swords className="mr-1 inline h-3 w-3" />
                          {s.cupName} · {s.matchesPlayed.toLocaleString()} matches that week
                        </p>
                      </div>
                    </div>
                    <div className="hidden h-10 w-px bg-zinc-800 lg:block" aria-hidden />
                    <div className="flex items-center gap-2.5 lg:pl-2">
                      <PlayerAvatar name={s.finalist.name} size="md" color={s.finalist.color} />
                      <div>
                        <p className="font-mono text-xs font-bold text-zinc-300">{s.finalist.name}</p>
                        <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">finalist · {s.finalist.rating} peak</p>
                      </div>
                    </div>
                  </div>

                  {/* top-4 mini standings */}
                  <div className="min-w-0 sm:w-52">
                    <p className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-600">final four</p>
                    <ol className="space-y-1">
                      {s.topFour.map((t, i) => (
                        <li key={t.name} className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="w-3 text-zinc-600">{i + 1}</span>
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: t.color }} aria-hidden />
                          <span className={cn("truncate", i === 0 ? "font-bold text-amber-300" : "text-zinc-400")}>{t.name}</span>
                          <span className="ml-auto shrink-0 text-zinc-600">{t.rating}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
