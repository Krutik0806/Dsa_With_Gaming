
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, ChevronRight, Crown, History, Minus, PlayCircle, Share2, Swords, Trophy, X, Zap } from "lucide-react";
import { PageHeader } from "@/components/game/page-header";
import { EmptyState } from "@/components/game/empty-state";
import { timeAgo, formatDuration } from "@/lib/format";
import type { MatchSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type Filter = "ALL" | "QUIZ" | "CODING";

/** Copy the public spectator URL for this match's replay to the clipboard. */
async function copyReplayLink(matchId: string) {
  const url = `${window.location.origin}/replay/${matchId}`;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
    } else {
      // fallback for browsers without the async clipboard API
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    toast.success("replay link copied — send it to a friend");
  } catch {
    toast.error("couldn't copy — grab it from the address bar");
  }
}

export default function HistoryPage() {
  const [matches, setMatches] = useState<MatchSummary[] | null>(null);
  const [filter, setFilter] = useState<Filter>("ALL");

  useEffect(() => {
    api.get("/match").then(r=>r.data)
      .then((d) => setMatches(d.matches ?? []))
      .catch(() => setMatches([]));
  }, []);

  const filtered = matches?.filter((m) => filter === "ALL" || m.type === filter) ?? [];

  const stats = (list: MatchSummary[]) => {
    const wins = list.filter((m) => m.result === "WIN").length;
    const losses = list.filter((m) => m.result === "LOSS").length;
    const draws = list.filter((m) => m.result === "DRAW").length;
    return { wins, losses, draws, total: list.length };
  };
  const all = stats(matches ?? []);

  return (
    <div>
      <PageHeader
        icon={History}
        title="Match History"
        description="Every battle you've fought, with full post-match analysis — tests, timelines, solutions, and rating movement."
        actions={
          matches && matches.length > 0 ? (
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-400">{all.wins}W</span>
              <span className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-red-400">{all.losses}L</span>
              <span className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-2.5 py-1 text-zinc-400">{all.draws}D</span>
            </div>
          ) : undefined
        }
      />

      {/* Filter tabs */}
      <div className="mb-5 flex rounded-xl border border-zinc-800 bg-zinc-900/50 p-1" role="group" aria-label="Match type filter">
        {(
          [
            ["ALL", "all battles"],
            ["QUIZ", "quiz"],
            ["CODING", "coding"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "flex-1 rounded-lg px-3 py-1.5 font-mono text-xs font-bold transition-colors sm:flex-none sm:px-5",
              filter === key ? "bg-emerald-500 text-zinc-950" : "text-zinc-400 hover:text-zinc-100"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {matches === null ? (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full bg-zinc-800/60" />
          <Skeleton className="h-20 w-full bg-zinc-800/60" />
          <Skeleton className="h-20 w-full bg-zinc-800/60" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={History}
          title={matches.length === 0 ? "No battles yet" : "No battles of this type"}
          description={
            matches.length === 0
              ? "Your history starts with your first clash. The quiz arena is the fastest way in."
              : "Try the other arena — or fight another battle."
          }
          action={
            <Link to={matches.length === 0 ? "/app/game/quiz" : "/app/game/battle"}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 font-mono text-sm font-bold text-zinc-950 transition-colors hover:bg-emerald-400"
            >
              {matches.length === 0 ? <Zap className="h-4 w-4" /> : <Swords className="h-4 w-4" />}
              {matches.length === 0 ? "play a quiz battle" : "find a battle"}
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((m) => (
            <li key={m.id}>
              <div
                className={cn(
                  "group flex items-center gap-2 rounded-2xl border bg-zinc-900/40 p-4 transition-all hover:bg-zinc-900/80 sm:gap-3",
                  m.result === "WIN" ? "border-emerald-500/25 hover:border-emerald-500/50" : m.result === "LOSS" ? "border-red-500/25 hover:border-red-500/50" : "border-zinc-800 hover:border-zinc-600"
                )}
              >
                <Link to={`/app/history/${m.id}`} className="flex min-w-0 flex-1 items-center gap-4 sm:gap-5" aria-label={`Match vs ${m.opponentName} analysis`}>
                  <span
                    className={cn(
                      "flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl font-mono text-xs font-bold",
                      m.result === "WIN" ? "bg-emerald-500/15 text-emerald-400" : m.result === "LOSS" ? "bg-red-500/15 text-red-400" : "bg-zinc-700/30 text-zinc-300"
                    )}
                  >
                    {m.result === "WIN" ? <Trophy className="h-5 w-5" /> : m.result === "LOSS" ? <X className="h-5 w-5" /> : <Minus className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        {m.type === "QUIZ" ? <Zap className="h-3 w-3" /> : <Swords className="h-3 w-3" />}
                        {m.type === "QUIZ" ? "quiz" : "coding"}
                      </span>
                      {m.tournamentName && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300">
                          <Crown className="h-3 w-3" />
                          {m.tournamentName}
                        </span>
                      )}
                      {m.human && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-red-500/40 bg-red-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-red-400">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
                          live
                        </span>
                      )}
                      <p className="truncate font-mono text-sm font-bold text-zinc-100">
                        vs {m.opponentName} <span className="font-normal text-zinc-500">({m.opponentRating})</span>
                      </p>
                    </div>
                    <p className="mt-1 truncate text-xs text-zinc-500">
                      {m.problemTitle ?? "rapid-fire trivia"} · {formatDuration(m.durationSec)} · {timeAgo(m.createdAt)}
                    </p>
                  </div>
                  <div className="hidden text-right font-mono sm:block">
                    <p className="text-sm text-zinc-300">
                      {m.score} <span className="text-zinc-600">:</span> {m.opponentScore}
                    </p>
                    <p className={cn("text-xs font-bold", m.ratingChange >= 0 ? "text-emerald-400" : "text-red-400")}>
                      {m.ratingChange >= 0 ? "+" : ""}
                      {m.ratingChange} rating
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-zinc-700 transition-all group-hover:translate-x-0.5 group-hover:text-emerald-400" />
                </Link>
                <Link to={`/app/history/${m.id}?replay=1`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/60 text-zinc-400 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-400"
                  aria-label={`Watch replay vs ${m.opponentName}`}
                  title="watch replay"
                >
                  <PlayCircle className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => copyReplayLink(m.id)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/60 text-zinc-400 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-400"
                  aria-label={`Copy public share link for replay vs ${m.opponentName}`}
                  title="copy public replay link"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {matches && matches.length > 0 && (
        <p className="mt-6 flex items-center justify-center gap-1.5 font-mono text-xs text-zinc-600">
          analysis feeds the skill map on your{" "}
          <Link to="/app/profile" className="inline-flex items-center gap-0.5 text-emerald-400 hover:text-emerald-300">
            profile <ArrowRight className="h-3 w-3" />
          </Link>
        </p>
      )}
    </div>
  );
}
