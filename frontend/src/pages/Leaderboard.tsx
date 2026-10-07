
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { Bot, Crown, Flame, Trophy } from "lucide-react";
import { PageHeader } from "@/components/game/page-header";
import { PlayerAvatar } from "@/components/game/player-avatar";
import { RankBadge } from "@/components/game/rank-badge";
import { SeasonChip } from "@/components/game/season-chip";
import { useAuth } from "@/lib/auth-context";
import type { LeaderboardEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type Metric = "rating" | "xp" | "wins";

const METRICS: { key: Metric; label: string; hint: string }[] = [
  { key: "rating", label: "rating", hint: "ELO — competitive skill" },
  { key: "xp", label: "xp", hint: "grind — lessons, solves & battles" },
  { key: "wins", label: "wins", hint: "sheer victory count" },
];

function metricValue(e: LeaderboardEntry, m: Metric): number {
  return m === "rating" ? e.rating : m === "xp" ? e.xp : e.wins;
}

function metricLabel(e: LeaderboardEntry, m: Metric): string {
  if (m === "rating") return String(e.rating);
  if (m === "xp") return e.xp.toLocaleString();
  return `${e.wins}W`;
}

export default function LeaderboardPage() {
  const { user: userRaw } = useAuth(); const user = userRaw!;
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [metric, setMetric] = useState<Metric>("rating");

  useEffect(() => {
    api.get("/leaderboard").then(r=>r.data)
      .then((d) => setEntries(d.entries ?? []))
      .catch(() => setEntries([]));
  }, []);

  const sorted = useMemo(() => {
    if (!entries) return null;
    return [...entries].sort((a, b) => metricValue(b, metric) - metricValue(a, metric) || a.name.localeCompare(b.name));
  }, [entries, metric]);

  const podium = sorted?.slice(0, 3) ?? [];
  const rest = sorted?.slice(3) ?? [];
  const myRank = sorted?.findIndex((e) => e.isMe);
  const activeMetric = METRICS.find((m) => m.key === metric)!;

  return (
    <div>
      <PageHeader
        icon={Trophy}
        title="Leaderboard"
        description="Every accepted submission, quiz point and rating swing on one board. Bots hold their ground until you take it from them. Cup circuit rankings reset weekly with each new cup."
        actions={
          myRank !== undefined && myRank >= 0 ? (
            <div className="flex flex-col items-end gap-2">
              <SeasonChip compact />
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2 font-mono text-sm">
                your position: <span className="font-bold text-emerald-400">#{myRank + 1}</span>
              </div>
            </div>
          ) : (
            <SeasonChip compact />
          )
        }
      />

      {/* Metric tabs */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            title={m.hint}
            className={cn(
              "rounded-xl border px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-all",
              metric === m.key
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                : "border-zinc-800 bg-zinc-900/40 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300",
            )}
          >
            {m.label}
          </button>
        ))}
        <span className="ml-1 font-mono text-[11px] text-zinc-600">— {activeMetric.hint}</span>
      </div>

      {/* Podium */}
      {entries === null ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-56 w-full bg-zinc-800/60" />
          <Skeleton className="h-56 w-full bg-zinc-800/60" />
          <Skeleton className="h-56 w-full bg-zinc-800/60" />
        </div>
      ) : (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {podium.length === 0 && (
            <p className="col-span-full py-6 text-center font-mono text-sm text-zinc-500">nobody has rated up yet — be the first</p>
          )}
          {podium.map((entry, i) => (
            <div
              key={entry.id}
              className={cn(
                "relative rounded-2xl border p-5 text-center",
                i === 0
                  ? "border-amber-400/40 bg-amber-400/5 sm:-translate-y-3"
                  : i === 1
                    ? "border-zinc-400/30 bg-zinc-800/30"
                    : "border-amber-700/40 bg-amber-950/10",
              )}
            >
              <span
                className={cn(
                  "absolute -top-3 left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full border font-mono text-xs font-black",
                  i === 0
                    ? "border-amber-400 bg-amber-400 text-zinc-950"
                    : i === 1
                      ? "border-zinc-400 bg-zinc-700 text-zinc-100"
                      : "border-amber-700 bg-amber-800 text-amber-100",
                )}
              >
                {i + 1}
              </span>
              {i === 0 && <Crown className="absolute -top-8 left-1/2 h-6 w-6 -translate-x-1/2 text-amber-400" />}
              <div className="mt-2 flex flex-col items-center">
                <PlayerAvatar name={entry.name} size="lg" isBot={entry.isBot} />
                <p className="mt-2.5 font-mono text-sm font-bold text-zinc-100">{entry.name}</p>
                <p className="font-mono text-2xl font-black text-amber-300">{metricLabel(entry, metric)}</p>
                <div className="mt-2">
                  <RankBadge rating={entry.rating} />
                </div>
                <p className="mt-2 font-mono text-[11px] text-zinc-500">
                  {entry.wins}W · {entry.losses}L · lvl {entry.level}
                  {entry.streak > 0 && (
                    <span className="ml-1.5 inline-flex items-center gap-0.5 text-orange-400" title={`${entry.streak}-day streak`}>
                      <Flame className="h-3 w-3" />
                      {entry.streak}
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800">
        <div className="hidden grid-cols-[3rem_1fr_6.5rem_9rem_7rem_4.5rem_5rem] items-center gap-3 border-b border-zinc-800 bg-zinc-900/70 px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-zinc-500 md:grid">
          <span>#</span>
          <span>player</span>
          <span className="text-right">{metric === "rating" ? "rating" : metric === "xp" ? "xp" : "wins"}</span>
          <span>rank</span>
          <span className="text-right">w / l / d</span>
          <span className="text-right">streak</span>
          <span className="text-right">lvl</span>
        </div>
        <ul className="divide-y divide-zinc-800/70">
          {entries === null && (
            <li className="space-y-2 p-5">
              <Skeleton className="h-10 w-full bg-zinc-800/60" />
              <Skeleton className="h-10 w-full bg-zinc-800/60" />
              <Skeleton className="h-10 w-full bg-zinc-800/60" />
            </li>
          )}
          {rest.map((entry, i) => (
            <li
              key={entry.id}
              className={cn(
                "grid grid-cols-[3rem_1fr_6.5rem] items-center gap-3 px-5 py-3 md:grid-cols-[3rem_1fr_6.5rem_9rem_7rem_4.5rem_5rem]",
                entry.isMe ? "bg-emerald-500/10" : "bg-zinc-900/30 hover:bg-zinc-900/70",
              )}
            >
              <span className="font-mono text-sm text-zinc-500">{i + 4}</span>
              <div className="flex min-w-0 items-center gap-2.5">
                <PlayerAvatar name={entry.name} size="sm" isBot={entry.isBot} />
                <span className="truncate font-mono text-sm text-zinc-200">{entry.name}</span>
                {entry.isMe && (
                  <span className="shrink-0 rounded bg-emerald-500 px-1.5 py-px font-mono text-[9px] font-bold uppercase text-zinc-950">you</span>
                )}
                {entry.isBot && <Bot className="h-3 w-3 shrink-0 text-zinc-600" />}
              </div>
              <span className="text-right font-mono text-sm font-bold text-zinc-100">{metricLabel(entry, metric)}</span>
              <span className="hidden md:block">
                <RankBadge rating={entry.rating} />
              </span>
              <span className="hidden text-right font-mono text-xs text-zinc-500 md:block">
                {entry.wins} / {entry.losses} / {entry.draws}
              </span>
              <span className="hidden text-right font-mono text-xs md:block">
                {entry.streak > 2 ? (
                  <span className="inline-flex items-center gap-1 font-bold text-orange-400" title={`${entry.streak}-day streak`}>
                    <Flame className="h-3 w-3" />
                    {entry.streak}d
                  </span>
                ) : (
                  <span className="text-zinc-600">{entry.streak > 0 ? `${entry.streak}d` : "—"}</span>
                )}
              </span>
              <span className="hidden text-right font-mono text-xs text-zinc-500 md:block">{entry.level}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-4 text-center font-mono text-[11px] text-zinc-600">
        bot ratings drift as they fight · your record: {user.wins}W {user.losses}L {user.draws}D ·{" "}
        <Link to="/app/seasons" className="text-amber-400/90 underline-offset-2 transition-colors hover:text-amber-300 hover:underline">
          season archive →
        </Link>
      </p>
    </div>
  );
}
