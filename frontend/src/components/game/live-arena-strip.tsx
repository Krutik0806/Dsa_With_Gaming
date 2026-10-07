
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { Swords, Zap } from "lucide-react";
import { onQueueStats, type ArenaQueueStats } from "@/lib/arena-client";

/**
 * Dashboard strip showing live arena presence — how many players are online
 * and queued right now — with one-click queue links for both battle modes.
 */
export function LiveArenaStrip() {
  const [stats, setStats] = useState<ArenaQueueStats | null>(null);

  useEffect(() => onQueueStats(setStats), []);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-red-500/25 bg-gradient-to-r from-red-500/[0.07] via-zinc-900/40 to-zinc-900/40 p-4 sm:p-5">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-red-500/10 blur-3xl"
        aria-hidden
      />
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-400" />
          </span>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-red-400">live arena</p>
        </div>
        <p className="font-mono text-xs text-zinc-400">
          {stats ? (
            <>
              <span className="font-bold text-zinc-200">{stats.online}</span> online ·{" "}
              <span className="font-bold text-zinc-200">{stats.inQueue.QUIZ + stats.inQueue.CODE}</span> in queue
            </>
          ) : (
            "connecting to the matchmaking relay…"
          )}
        </p>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Link to="/app/game/quiz"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3.5 font-mono text-xs font-bold text-emerald-400 transition-all hover:bg-emerald-500/20"
          >
            <Zap className="h-3.5 w-3.5" /> queue quiz
            {stats && stats.inQueue.QUIZ > 0 && (
              <span className="rounded bg-emerald-500/20 px-1 text-[10px] tabular-nums">{stats.inQueue.QUIZ}</span>
            )}
          </Link>
          <Link to="/app/game/battle"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-3.5 font-mono text-xs font-bold text-red-400 transition-all hover:bg-red-500/20"
          >
            <Swords className="h-3.5 w-3.5" /> queue code
            {stats && stats.inQueue.CODE > 0 && (
              <span className="rounded bg-red-500/20 px-1 text-[10px] tabular-nums">{stats.inQueue.CODE}</span>
            )}
          </Link>
        </div>
      </div>
    </section>
  );
}
