
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Circle, Flame, Target } from "lucide-react";
import { PageHeader } from "@/components/game/page-header";
import { DifficultyBadge } from "@/components/game/difficulty-badge";
import { PROBLEMS, PROBLEM_TOPICS } from "@/lib/data/problems";
import { dailyProblem } from "@/lib/daily";
import type { ProgressResponse } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/lib/game";

type DiffFilter = "ALL" | Difficulty;
type StatusFilter = "ALL" | "SOLVED" | "UNSOLVED";

export default function PracticePage() {
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [diff, setDiff] = useState<DiffFilter>("ALL");
  const [topic, setTopic] = useState<string>("ALL");
  const [status, setStatus] = useState<StatusFilter>("ALL");

  useEffect(() => {
    api.get("/progress").then(r=>r.data)
      .then(setProgress)
      .catch(() => setProgress({ lessons: [], problems: [], dailyDone: false }));
  }, []);

  const solved = progress?.problems ?? [];
  const daily = dailyProblem();

  const filtered = PROBLEMS.filter((p) => {
    if (diff !== "ALL" && p.difficulty !== diff) return false;
    if (topic !== "ALL" && !p.topics.includes(topic)) return false;
    if (status === "SOLVED" && !solved.includes(p.slug)) return false;
    if (status === "UNSOLVED" && solved.includes(p.slug)) return false;
    return true;
  });

  const solvedCount = solved.length;

  return (
    <div>
      <PageHeader
        icon={Target}
        title="Practice"
        description="The same judge that powers coding battles, minus the opponent. Hints when you're stuck, full solutions when you're done."
        actions={
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2 font-mono text-sm">
            <span className="font-bold text-emerald-400">{solvedCount}</span>
            <span className="text-zinc-500"> / {PROBLEMS.length} solved</span>
          </div>
        }
      />

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl border border-zinc-800 bg-zinc-900/50 p-1" role="group" aria-label="Difficulty filter">
          {(["ALL", "EASY", "MEDIUM", "HARD"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDiff(d)}
              className={cn(
                "rounded-lg px-3 py-1.5 font-mono text-xs font-bold transition-colors",
                diff === d ? "bg-emerald-500 text-zinc-950" : "text-zinc-400 hover:text-zinc-100"
              )}
            >
              {d.toLowerCase()}
            </button>
          ))}
        </div>
        <div className="flex rounded-xl border border-zinc-800 bg-zinc-900/50 p-1" role="group" aria-label="Status filter">
          {(["ALL", "SOLVED", "UNSOLVED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "rounded-lg px-3 py-1.5 font-mono text-xs font-bold transition-colors",
                status === s ? "bg-zinc-700 text-zinc-50" : "text-zinc-400 hover:text-zinc-100"
              )}
            >
              {s.toLowerCase()}
            </button>
          ))}
        </div>
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="h-9 rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 font-mono text-xs text-zinc-300 outline-none transition-colors hover:border-zinc-600 focus:border-emerald-600/50"
          aria-label="Topic filter"
        >
          <option value="ALL">all topics</option>
          {PROBLEM_TOPICS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Problem list */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800">
        {daily && !solved.includes(daily.slug) && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/25 bg-amber-500/5 px-5 py-3">
            <p className="flex items-center gap-2 font-mono text-xs text-amber-300">
              <Flame className="cc-flame h-3.5 w-3.5" /> today&apos;s challenge — <span className="font-bold">{daily.title}</span> · first solve banks 2× XP
            </p>
            <Link to={`/app/practice/${daily.slug}`}
              className="font-mono text-xs font-bold text-amber-400 transition-colors hover:text-amber-300"
            >
              jump in →
            </Link>
          </div>
        )}
        <div className="hidden grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 border-b border-zinc-800 bg-zinc-900/70 px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-zinc-500 md:grid">
          <span className="w-6">status</span>
          <span>problem</span>
          <span>difficulty</span>
          <span className="text-right">acceptance</span>
          <span className="text-right">xp</span>
        </div>
        <ul className="divide-y divide-zinc-800/70">
          {filtered.length === 0 && (
            <li className="px-5 py-10 text-center font-mono text-sm text-zinc-500">
              no problems match these filters
            </li>
          )}
          {filtered.map((p) => {
            const isSolved = solved.includes(p.slug);
            const isDaily = p.slug === daily?.slug;
            return (
              <li key={p.slug} className={cn(isDaily && "border-l-2 border-l-amber-500/60")}>
                <Link to={`/app/practice/${p.slug}`}
                  className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 bg-zinc-900/30 px-5 py-3.5 transition-colors hover:bg-zinc-900/80 md:grid-cols-[auto_1fr_auto_auto_auto]"
                >
                  <span className="w-6">
                    {isSolved ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Circle className="h-5 w-5 text-zinc-700 transition-colors group-hover:text-zinc-500" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-zinc-200 transition-colors group-hover:text-emerald-300">
                        {p.title}
                      </p>
                      {isDaily && (
                        <span className="shrink-0 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-amber-300">
                          today · 2×
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 hidden truncate font-mono text-[11px] text-zinc-600 sm:block">
                      {p.topics.join(" · ")}
                    </p>
                  </div>
                  <DifficultyBadge difficulty={p.difficulty} />
                  <span className="hidden text-right font-mono text-xs text-zinc-500 md:block">{p.acceptance}%</span>
                  <span className={cn("hidden text-right font-mono text-xs font-bold md:block", isDaily && !isSolved ? "text-amber-400" : "text-emerald-400")}>
                    +{p.difficulty === "EASY" ? 100 : p.difficulty === "MEDIUM" ? 200 : 300}
                    {isDaily && !isSolved ? " ×2" : ""}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="mt-4 flex items-center justify-center gap-1.5 font-mono text-xs text-zinc-600">
        solved everything? <ArrowRight className="h-3 w-3" /> the{" "}
        <Link to="/app/game/battle" className="text-emerald-400 hover:text-emerald-300">
          coding arena
        </Link>{" "}
        is waiting
      </p>
    </div>
  );
}
