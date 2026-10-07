
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  Minus,
  PlayCircle,
  Share2,
  Skull,
  Swords,
  Trophy,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { CodeBlock } from "@/components/game/code-block";
import { PlayerAvatar } from "@/components/game/player-avatar";
import { RankBadge } from "@/components/game/rank-badge";
import { DifficultyBadge } from "@/components/game/difficulty-badge";
import { ReplayTheater } from "@/components/game/replay-theater";
import { formatDuration, formatDurationLong, timeAgo } from "@/lib/format";
import type { CodingMatchDetails, MatchSummary, QuizMatchDetails } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  match: MatchSummary;
  quizDetails?: QuizMatchDetails;
  codingDetails?: CodingMatchDetails;
}

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

export function MatchAnalysis({ match, quizDetails, codingDetails }: Props) {
  const [open, setOpen] = useState<number | null>(null);
  const [replayOpen, setReplayOpen] = useState(false);
  const won = match.result === "WIN";
  const hasReplay = (quizDetails?.review?.length ?? 0) > 0 || !!codingDetails;

  // ?replay=1 auto-opens the broadcast (rAF-wrapped to satisfy set-state-in-effect lint)
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      if (new URLSearchParams(window.location.search).get("replay") === "1" && hasReplay) setReplayOpen(true);
    });
    return () => cancelAnimationFrame(raf);
  }, [hasReplay]);

  if (replayOpen && hasReplay) {
    return (
      <div className="mx-auto max-w-4xl">
        <Link to="/app/history"
          className="mb-5 inline-flex items-center gap-1.5 font-mono text-xs text-zinc-500 transition-colors hover:text-emerald-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> match history
        </Link>
        <ReplayTheater match={match} quizDetails={quizDetails} codingDetails={codingDetails} onClose={() => setReplayOpen(false)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/app/history"
        className="mb-5 inline-flex items-center gap-1.5 font-mono text-xs text-zinc-500 transition-colors hover:text-emerald-400"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> match history
      </Link>

      {/* Banner */}
      <div
        className={cn(
          "rounded-2xl border p-6 sm:p-8",
          won ? "border-emerald-500/40 bg-emerald-500/10" : match.result === "LOSS" ? "border-red-500/40 bg-red-500/10" : "border-zinc-700 bg-zinc-800/40"
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-2xl",
                won ? "bg-emerald-500/20 text-emerald-400" : match.result === "LOSS" ? "bg-red-500/20 text-red-400" : "bg-zinc-700/40 text-zinc-300"
              )}
            >
              {won ? <Trophy className="h-7 w-7" /> : match.result === "LOSS" ? <Skull className="h-7 w-7" /> : <Minus className="h-7 w-7" />}
            </span>
            <div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                {won ? "VICTORY" : match.result === "LOSS" ? "DEFEAT" : "DRAW"}
              </h1>
              <p className="mt-0.5 font-mono text-xs text-zinc-400">
                {match.type === "QUIZ" ? "quiz battle" : "coding battle"} · {timeAgo(match.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            {hasReplay && (
              <>
                <button
                  onClick={() => setReplayOpen(true)}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 font-mono text-xs font-bold text-emerald-400 transition-colors hover:bg-emerald-500/20"
                >
                  <PlayCircle className="h-4 w-4" /> watch replay
                </button>
                <button
                  onClick={() => copyReplayLink(match.id)}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/60 px-4 font-mono text-xs font-bold text-zinc-300 transition-colors hover:border-emerald-500/50 hover:text-emerald-400"
                  aria-label="Copy public spectator replay link"
                  title="copy public spectator link"
                >
                  <Share2 className="h-4 w-4" /> share
                </button>
              </>
            )}
            <div className="text-center">
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">score</p>
              <p className="mt-1 font-mono text-2xl font-bold text-zinc-100">
                {match.score} <span className="text-zinc-600">:</span> {match.opponentScore}
              </p>
            </div>
            <div className="text-center">
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">rating</p>
              <p className={cn("mt-1 font-mono text-2xl font-bold", match.ratingChange >= 0 ? "text-emerald-400" : "text-red-400")}>
                {match.ratingChange >= 0 ? "+" : ""}
                {match.ratingChange}
              </p>
            </div>
            <div className="text-center">
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">xp</p>
              <p className="mt-1 font-mono text-2xl font-bold text-amber-400">+{match.xpEarned}</p>
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-4 rounded-xl border border-zinc-800/60 bg-zinc-950/40 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <PlayerAvatar name="you" size="sm" />
            <span className="font-mono text-xs text-zinc-300">you</span>
          </div>
          <span className="font-mono text-xs text-zinc-600">vs</span>
          <div className="flex items-center gap-2.5">
            <PlayerAvatar name={match.opponentName} size="sm" isBot={!(quizDetails?.human ?? codingDetails?.human)} />
            <span className="font-mono text-xs text-zinc-300">{match.opponentName}</span>
            {(quizDetails?.human ?? codingDetails?.human) ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-red-500/40 bg-red-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-red-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" /> live human
              </span>
            ) : (
              <span className="inline-flex items-center rounded-md border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">bot</span>
            )}
            <RankBadge rating={match.opponentRating} />
          </div>
          <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-xs text-zinc-500">
            <Clock className="h-3.5 w-3.5" /> {formatDurationLong(match.durationSec)}
          </span>
        </div>
      </div>

      {/* Quiz analysis */}
      {quizDetails && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              [`${Math.round((quizDetails.review.filter((r) => r.userCorrect).length / Math.max(1, quizDetails.review.length)) * 100)}%`, "your accuracy", "text-emerald-400"],
              [`${Math.round(quizDetails.botAccuracy * 100)}%`, "opponent accuracy", "text-amber-400"],
              [`${quizDetails.review.length}`, "questions", "text-zinc-300"],
              [`${(quizDetails.avgResponseMs / 1000).toFixed(1)}s`, "avg response", "text-zinc-300"],
            ].map(([v, l, c]) => (
              <div key={l} className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-center">
                <div className={cn("font-mono text-xl font-bold", c)}>{v}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-500">{l}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">question by question</h2>
            <div className="space-y-2">
              {quizDetails.review.map((r, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60">
                  <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                    {r.userCorrect ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm text-zinc-300">{r.question}</span>
                    <span className="shrink-0 rounded bg-zinc-800/80 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">{r.category}</span>
                    <span className="shrink-0 font-mono text-xs text-zinc-600">+{r.points}</span>
                    <ChevronRight className={cn("h-4 w-4 shrink-0 text-zinc-600 transition-transform", open === i && "rotate-90")} />
                  </button>
                  {open === i && (
                    <div className="space-y-1.5 border-t border-zinc-800/70 px-4 py-3 text-sm">
                      <p className="text-zinc-400">
                        correct: <span className="font-medium text-emerald-400">{r.options[r.answer]}</span>
                      </p>
                      <p className="text-zinc-400">
                        you:{" "}
                        {r.userAnswer >= 0 ? (
                          <span className={cn("font-medium", r.userCorrect ? "text-emerald-400" : "text-red-400")}>{r.options[r.userAnswer]}</span>
                        ) : (
                          <span className="font-medium text-red-400">timed out</span>
                        )}
                        {r.userAnswer >= 0 && <span className="ml-2 text-xs text-zinc-600">({(r.userTimeMs / 1000).toFixed(1)}s)</span>}
                      </p>
                      <p className="text-zinc-400">
                        {match.opponentName}:{" "}
                        {r.botAnswer >= 0 ? (
                          <span className={cn("font-medium", r.botCorrect ? "text-amber-300" : "text-zinc-500")}>{r.options[r.botAnswer]}</span>
                        ) : (
                          <span className="font-medium text-zinc-500">timed out</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Coding analysis */}
      {codingDetails && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              [`${codingDetails.userTestsPassed}/${codingDetails.totalTests}`, "your tests", "text-emerald-400"],
              [
                `${codingDetails.userSubmissions}`,
                "submissions",
                "text-zinc-300",
              ],
              [codingDetails.userSolvedAtSec !== null ? formatDuration(codingDetails.userSolvedAtSec) : "—", "your solve time", "text-zinc-300"],
              [codingDetails.errors.length, "errors hit", "text-red-400"],
            ].map(([v, l, c]) => (
              <div key={String(l)} className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-center">
                <div className={cn("font-mono text-xl font-bold", String(c))}>{v}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-500">{l}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <div className="mb-4 flex flex-wrap items-center gap-2.5">
              <DifficultyBadge difficulty={codingDetails.difficulty} />
              <h2 className="font-bold text-zinc-100">{codingDetails.problemTitle}</h2>
              <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-xs text-zinc-500">
                <Eye className="h-3.5 w-3.5" /> clock: {formatDuration(codingDetails.durationSec)}
              </span>
            </div>

            {/* Timeline */}
            <h3 className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">timeline</h3>
            <ol className="cc-scroll-thin max-h-56 space-y-1.5 overflow-y-auto pr-1">
              <li className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-1.5 font-mono text-[11px] text-zinc-400">
                <span>
                  <span className="text-emerald-400">you</span> — entered the arena
                </span>
                <span className="text-zinc-600">0:00</span>
              </li>
              {codingDetails.botEvents.map((ev, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-1.5 font-mono text-[11px] text-zinc-400">
                  <span>
                    <span className="text-amber-400">{match.opponentName}</span> — {ev.label}
                  </span>
                  <span className="text-zinc-600">{formatDuration(ev.t)}</span>
                </li>
              ))}
              {codingDetails.userSolvedAtSec !== null && (
                <li className="flex items-center justify-between rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 font-mono text-[11px] text-emerald-300">
                  <span>
                    <span className="font-bold">you</span> — SUBMITTED · ACCEPTED
                  </span>
                  <span>{formatDuration(codingDetails.userSolvedAtSec)}</span>
                </li>
              )}
              {codingDetails.botSolvedAtSec !== null && (
                <li className="flex items-center justify-between rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 font-mono text-[11px] text-red-300">
                  <span>
                    <span className="font-bold">{match.opponentName}</span> — SUBMITTED · ACCEPTED
                  </span>
                  <span>{formatDuration(codingDetails.botSolvedAtSec)}</span>
                </li>
              )}
            </ol>

            {codingDetails.errors.length > 0 && (
              <div className="mt-4">
                <h3 className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">errors encountered</h3>
                <div className="space-y-1.5">
                  {codingDetails.errors.map((err, i) => (
                    <p key={i} className="rounded-lg border border-red-500/25 bg-red-950/20 px-3 py-1.5 font-mono text-[11px] text-red-300/90">
                      {err}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Solutions */}
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">
                <Zap className="h-3.5 w-3.5 text-emerald-400" /> your final solution
                <span className="text-zinc-600">{codingDetails.language ?? "js"}</span>
              </h3>
              <CodeBlock
                code={codingDetails.finalCode || "// no submission"}
                title={`you.${codingDetails.language ?? "js"}`}
                maxHeight={340}
              />
            </div>
            <div>
              <h3 className="mb-2 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">
                <Swords className="h-3.5 w-3.5 text-amber-400" /> {match.opponentName}&apos;s solution
              </h3>
              <CodeBlock
                code={codingDetails.botCode || "// opponent did not submit"}
                title={`${match.opponentName}.${codingDetails.language ?? "js"}`}
                maxHeight={340}
              />
            </div>
          </div>
        </>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link to={
            match.type === "QUIZ"
              ? `/app/game/quiz?opponent=${encodeURIComponent(match.opponentName)}&rating=${match.opponentRating}`
              : `/app/game/battle?opponent=${encodeURIComponent(match.opponentName)}&rating=${match.opponentRating}&difficulty=${
                  codingDetails?.difficulty === "MEDIUM" ? "MEDIUM" : codingDetails?.difficulty === "HARD" ? "HARD" : "EASY"
                }`
          }
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-500 px-5 font-mono text-sm font-bold text-zinc-950 transition-colors hover:bg-emerald-400"
        >
          {match.type === "QUIZ" ? <Zap className="h-4 w-4" /> : <Swords className="h-4 w-4" />} rematch {match.opponentName}
        </Link>
        <Link to={match.type === "QUIZ" ? "/app/game/quiz" : "/app/game/battle"}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/60 px-5 font-mono text-sm text-zinc-300 transition-colors hover:border-zinc-500"
        >
          new opponent
        </Link>
        <Link to="/app/profile"
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/60 px-5 font-mono text-sm text-zinc-300 transition-colors hover:border-zinc-500"
        >
          view skill map
        </Link>
      </div>
    </div>
  );
}
