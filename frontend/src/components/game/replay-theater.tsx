
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  Loader2,
  Minus,
  Pause,
  Play,
  RotateCcw,
  Skull,
  Swords,
  Trophy,
  Volume2,
  X,
} from "lucide-react";
import { PlayerAvatar } from "@/components/game/player-avatar";
import { DifficultyBadge } from "@/components/game/difficulty-badge";
import { formatDuration } from "@/lib/format";
import type { CodingMatchDetails, MatchSummary, QuizMatchDetails } from "@/lib/types";
import { cn } from "@/lib/utils";

const QUESTION_MS = 15000;
const RESOLVE_DELAY_MS = 750;
const REVEAL_MS = 2800;

// ── deterministic synthesis helpers ────────────────────────────────────────
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Synthesize a plausible bot answer time (ms) for a question. */
function synthBotTime(questionId: string, botAnswer: number, botCorrect: boolean): number {
  if (botAnswer < 0) return QUESTION_MS; // timed out
  const h = hashStr(questionId);
  return botCorrect ? 2200 + (h % 5800) : 7200 + (h % 7300);
}

// ── derived timelines ──────────────────────────────────────────────────────
interface QuizSeg {
  index: number;
  botTimeMs: number;
  lockUserMs: number;
  revealAtMs: number; // relative to segment start
  durationMs: number; // relative
  startMs: number; // absolute
  botPts: number;
}

function buildQuizTimeline(review: QuizMatchDetails["review"], opponentScore: number) {
  const segs: QuizSeg[] = [];
  let cursor = 0;
  let synthBotSum = 0;
  const raw: { seg: QuizSeg; rawBotPts: number }[] = [];
  for (let i = 0; i < review.length; i++) {
    const r = review[i];
    const botTimeMs = synthBotTime(r.questionId, r.botAnswer, r.botCorrect);
    const lockUserMs = r.userAnswer >= 0 ? r.userTimeMs : QUESTION_MS;
    const revealAt = Math.max(lockUserMs, botTimeMs) + RESOLVE_DELAY_MS;
    const duration = revealAt + REVEAL_MS;
    const rawBotPts = r.botCorrect ? 100 + Math.round(60 * ((QUESTION_MS - botTimeMs) / QUESTION_MS)) : 0;
    synthBotSum += rawBotPts;
    const seg: QuizSeg = { index: i, botTimeMs, lockUserMs, revealAtMs: revealAt, durationMs: duration, startMs: cursor, botPts: rawBotPts };
    raw.push({ seg, rawBotPts });
    segs.push(seg);
    cursor += duration;
  }
  // scale synthesized bot points so the broadcast ends on the recorded score
  const factor = synthBotSum > 0 && opponentScore > 0 ? opponentScore / synthBotSum : 0;
  if (factor > 0 && Math.abs(factor - 1) > 0.001) {
    for (const { seg, rawBotPts } of raw) seg.botPts = Math.round(rawBotPts * factor);
  }
  return { segs, totalMs: cursor };
}

interface QuizState {
  seg: QuizSeg;
  phase: "question" | "reveal";
  userLocked: boolean;
  botLocked: boolean;
  userPts: number;
  botPts: number;
}

interface CodingEvent {
  t: number; // seconds into match
  who: "you" | "opp";
  label: string;
  tests?: number;
  kind: "submit" | "progress" | "solve" | "error" | "start";
}

function parseBotTests(label: string): number | undefined {
  const m = label.match(/(\d+)\/(\d+)/);
  if (!m) return undefined;
  return parseInt(m[1], 10);
}

function buildCodingTimeline(d: CodingMatchDetails): { events: CodingEvent[]; totalMs: number } {
  const events: CodingEvent[] = [{ t: 0, who: "you", label: "entered the arena", kind: "start" }];
  const total = Math.max(30, d.durationSec);

  // user submissions (times are reconstructed — only the accepted time is recorded)
  const subs = Math.max(1, d.userSubmissions);
  const userSolve = d.userSolvedAtSec;
  const horizon = userSolve !== null ? userSolve : Math.round(total * 0.85);
  const errCount = Math.min(d.errors.length, Math.max(0, subs - (userSolve !== null ? 1 : 0)));
  let errIdx = 0;
  for (let k = 0; k < subs; k++) {
    const last = k === subs - 1;
    const t = last ? horizon : Math.max(4, Math.round((horizon * (k + 1)) / (subs + 1)));
    const tests = Math.max(0, Math.round((d.userTestsPassed * (k + 1)) / subs) - (last ? 0 : subs - k));
    if (last && userSolve !== null) {
      events.push({ t, who: "you", label: `SUBMITTED — ${d.userTestsPassed}/${d.totalTests} tests ✓ ACCEPTED`, tests: d.userTestsPassed, kind: "solve" });
    } else if (errIdx < errCount) {
      events.push({ t, who: "you", label: `submission rejected — ${d.errors[errIdx].slice(0, 60)}`, tests, kind: "error" });
      errIdx++;
    } else {
      events.push({ t, who: "you", label: `submitted — tests passing: ${tests}/${d.totalTests}`, tests, kind: "submit" });
    }
  }

  // opponent events (recorded with timestamps)
  for (const ev of d.botEvents) {
    events.push({ t: ev.t, who: "opp", label: ev.label, tests: parseBotTests(ev.label), kind: ev.label.includes("ACCEPTED") ? "solve" : "progress" });
  }
  if (d.botSolvedAtSec !== null && !d.botEvents.some((e) => e.label.includes("ACCEPTED"))) {
    events.push({ t: d.botSolvedAtSec, who: "opp", label: `SUBMITTED — ${d.totalTests}/${d.totalTests} tests ✓ ACCEPTED`, tests: d.totalTests, kind: "solve" });
  }

  events.sort((a, b) => a.t - b.t || (a.who === "you" ? -1 : 1));
  return { events, totalMs: total * 1000 };
}

// ── the theater ────────────────────────────────────────────────────────────
interface Props {
  match: MatchSummary;
  quizDetails?: QuizMatchDetails;
  codingDetails?: CodingMatchDetails;
  onClose: () => void;
  /** Spectator (public share-link) mode — the owner plays under their scoreboard name and there is no exit-to-analysis shortcut. */
  spectator?: { ownerName: string };
}

export function ReplayTheater({ match, quizDetails, codingDetails, onClose, spectator }: Props) {
  // In spectator mode the broadcast names the owner instead of "you".
  const youLabel = spectator?.ownerName ?? "you";
  const [playhead, setPlayhead] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(2);
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);

  const quiz = useMemo(
    () => (quizDetails && quizDetails.review.length > 0 ? buildQuizTimeline(quizDetails.review, match.opponentScore) : null),
    [quizDetails, match.opponentScore]
  );
  const coding = useMemo(() => (codingDetails ? buildCodingTimeline(codingDetails) : null), [codingDetails]);
  const totalMs = quiz?.totalMs ?? coding?.totalMs ?? 0;

  // playback engine — rAF advances the playhead by wall-clock delta × speed
  useEffect(() => {
    if (!playing) return;
    lastTsRef.current = performance.now();
    const tick = (now: number) => {
      const dt = now - lastTsRef.current;
      lastTsRef.current = now;
      setPlayhead((p) => {
        const next = p + dt * speed;
        if (next >= totalMs) {
          setPlaying(false);
          return totalMs;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, speed, totalMs]);

  const restart = useCallback(() => {
    setPlayhead(0);
    setPlaying(true);
  }, []);

  const seek = useCallback((ms: number) => setPlayhead(Math.max(0, Math.min(totalMs, ms))), [totalMs]);

  const done = totalMs > 0 && playhead >= totalMs - 1;
  const won = match.result === "WIN";

  // derive quiz broadcast state from the playhead (pure — scrub-safe)
  const quizState: QuizState | null = useMemo(() => {
    if (!quiz || !quizDetails) return null;
    let seg = quiz.segs[quiz.segs.length - 1];
    let rel = seg.durationMs + 1;
    let userPts = 0;
    let botPts = 0;
    for (let i = 0; i < quiz.segs.length; i++) {
      const s = quiz.segs[i];
      if (playhead >= s.startMs) {
        seg = s;
        rel = playhead - s.startMs;
        userPts += quizDetails.review[i].points;
        botPts += s.botPts;
      }
    }
    const revealed = rel >= seg.revealAtMs;
    if (!revealed) {
      userPts -= quizDetails.review[seg.index].points;
      botPts -= seg.botPts;
    }
    return {
      seg,
      phase: revealed ? "reveal" : "question",
      userLocked: rel >= seg.lockUserMs,
      botLocked: rel >= seg.botTimeMs,
      userPts,
      botPts,
    };
  }, [quiz, quizDetails, playhead]);

  // derive coding broadcast state
  const codingPast = useMemo(() => {
    if (!coding) return null;
    const past = coding.events.filter((e) => e.t * 1000 <= playhead);
    let userTests = 0;
    let oppTests = 0;
    let userSubs = 0;
    let userSolved = false;
    let oppSolved = false;
    for (const e of past) {
      if (e.who === "you") {
        if (e.kind !== "start" && e.kind !== "progress") userSubs++;
        if (typeof e.tests === "number") userTests = e.tests;
        if (e.kind === "solve") userSolved = true;
      } else {
        if (typeof e.tests === "number") oppTests = e.tests;
        if (e.kind === "solve") oppSolved = true;
      }
    }
    return { feed: past.slice().reverse(), userTests, oppTests, userSubs, userSolved, oppSolved };
  }, [coding, playhead]);

  // keyboard: space toggles play; esc exits (spectators have nothing to exit to)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && (e.target as HTMLElement)?.tagName !== "INPUT") {
        e.preventDefault();
        if (done) restart();
        else setPlaying((p) => !p);
      }
      if (e.key === "Escape" && !spectator) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [done, restart, onClose, spectator]);

  const fmt = (ms: number) => formatDuration(Math.floor(ms / 1000));

  return (
    <div className="cc-rise relative overflow-hidden rounded-2xl border border-zinc-700/80 bg-zinc-950 shadow-[0_0_60px_-15px_rgba(16,185,129,0.15)]">
      {/* broadcast header */}
      <div className="flex flex-wrap items-center gap-3 border-b border-zinc-800 bg-zinc-900/60 px-4 py-3 sm:px-5">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1 font-mono text-[10px] font-bold tracking-widest text-red-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
          </span>
          REPLAY
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          spectator mode · {match.type === "QUIZ" ? "quiz battle" : "coding battle"}
        </span>
        {match.tournamentName && (
          <span className="hidden rounded bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-400 sm:inline">
            {match.tournamentName}
          </span>
        )}
        {!spectator && (
          <button
            onClick={onClose}
            className="ml-auto inline-flex items-center gap-1 rounded-md border border-zinc-700 px-2 py-1 font-mono text-[10px] text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
          >
            <ChevronLeft className="h-3 w-3" /> back to analysis
          </button>
        )}
      </div>

      {/* scoreboard */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-5 sm:gap-6 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <PlayerAvatar name={youLabel} size="md" />
          <p className="min-w-0 truncate font-mono text-sm font-bold text-emerald-400">{youLabel}</p>
        </div>
        <div className="flex items-center gap-3 font-mono sm:gap-5">
          <span className="text-2xl font-black tabular-nums text-emerald-400 sm:text-4xl">
            {match.type === "QUIZ"
              ? (quizState?.userPts ?? 0).toLocaleString()
              : `${codingPast?.userTests ?? 0}/${codingDetails?.totalTests ?? 0}`}
          </span>
          <span className="text-lg text-zinc-600 sm:text-2xl">{match.type === "QUIZ" ? ":" : "vs"}</span>
          <span className="text-2xl font-black tabular-nums text-amber-400 sm:text-4xl">
            {match.type === "QUIZ"
              ? (quizState?.botPts ?? 0).toLocaleString()
              : `${codingPast?.oppTests ?? 0}/${codingDetails?.totalTests ?? 0}`}
          </span>
        </div>
        <div className="flex min-w-0 items-center justify-end gap-3">
          <p className="hidden min-w-0 truncate font-mono text-sm font-bold text-amber-400 sm:block">{match.opponentName}</p>
          <PlayerAvatar name={match.opponentName} size="md" isBot={!(quizDetails?.human ?? codingDetails?.human)} />
        </div>
      </div>

      {/* stage */}
      <div className="relative min-h-[320px] border-y border-zinc-800 bg-zinc-900/30 px-4 py-6 sm:px-8">
        {match.type === "QUIZ" && quizState && quizDetails ? (
          <QuizStage
            match={match}
            details={quizDetails}
            state={quizState}
            rel={playhead - quizState.seg.startMs}
            done={done}
            won={won}
            youLabel={youLabel}
          />
        ) : codingDetails && codingPast ? (
          <CodingStage
            match={match}
            details={codingDetails}
            feed={codingPast.feed}
            userTests={codingPast.userTests}
            oppTests={codingPast.oppTests}
            userSubs={codingPast.userSubs}
            userSolved={codingPast.userSolved}
            oppSolved={codingPast.oppSolved}
            clockSec={Math.floor(playhead / 1000)}
            done={done}
            won={won}
            youLabel={youLabel}
          />
        ) : null}
      </div>

      {/* controls */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-6">
        <button
          onClick={() => (done ? restart() : setPlaying((p) => !p))}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-zinc-950 transition-transform hover:scale-105 hover:bg-emerald-400"
          aria-label={done ? "Restart replay" : playing ? "Pause replay" : "Play replay"}
        >
          {done ? <RotateCcw className="h-4 w-4" /> : playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
        </button>
        <div className="flex shrink-0 overflow-hidden rounded-lg border border-zinc-700" role="group" aria-label="Playback speed">
          {[1, 2, 4, 8].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={cn(
                "px-2.5 py-1.5 font-mono text-[11px] font-bold transition-colors",
                speed === s ? "bg-emerald-500 text-zinc-950" : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
              )}
            >
              {s}×
            </button>
          ))}
        </div>

        {/* scrubber */}
        <div className="relative min-w-[160px] flex-1">
          <input
            type="range"
            min={0}
            max={Math.max(1, totalMs)}
            value={playhead}
            onChange={(e) => {
              setPlaying(false);
              seek(Number(e.target.value));
            }}
            className="cc-range h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-800"
            aria-label="Replay progress"
          />
          <div
            className="pointer-events-none absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
            style={{ width: `${totalMs > 0 ? (playhead / totalMs) * 100 : 0}%` }}
          />
          {quiz?.segs.map((s) => (
            <span
              key={s.index}
              className="pointer-events-none absolute top-1/2 h-2.5 w-0.5 -translate-y-1/2 rounded-full bg-zinc-500/70"
              style={{ left: `${(s.startMs / totalMs) * 100}%` }}
            />
          ))}
        </div>

        <span className="shrink-0 font-mono text-[11px] tabular-nums text-zinc-500">
          {fmt(playhead)} <span className="text-zinc-700">/</span> {fmt(totalMs)}
        </span>
        <span className="shrink-0 font-mono text-[10px] text-zinc-600 sm:inline">
          {spectator ? "space = play/pause" : "space = play/pause · esc = exit"}
        </span>
      </div>
    </div>
  );
}

// ── quiz stage ─────────────────────────────────────────────────────────────
function QuizStage({
  match,
  details,
  state,
  rel,
  done,
  won,
  youLabel = "you",
}: {
  match: MatchSummary;
  details: QuizMatchDetails;
  state: QuizState;
  rel: number;
  done: boolean;
  won: boolean;
  /** Owner's scoreboard name in spectator mode; defaults to "you" for the owner viewing their own replay. */
  youLabel?: string;
}) {
  const r = details.review[state.seg.index];
  if (!r) return null;

  if (done) {
    return (
      <div className="flex min-h-[260px] flex-col items-center justify-center gap-4 py-6 text-center">
        <span
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-2xl",
            won ? "bg-emerald-500/20 text-emerald-400" : match.result === "LOSS" ? "bg-red-500/20 text-red-400" : "bg-zinc-700/40 text-zinc-300"
          )}
        >
          {won ? <Trophy className="h-8 w-8" /> : match.result === "LOSS" ? <Skull className="h-8 w-8" /> : <Minus className="h-8 w-8" />}
        </span>
        <div>
          <p className="text-2xl font-black tracking-tight">{won ? "VICTORY" : match.result === "LOSS" ? "DEFEAT" : "DRAW"}</p>
          <p className="mt-1 font-mono text-xs text-zinc-500">
            {match.score.toLocaleString()} : {match.opponentScore.toLocaleString()} ·{" "}
            {details.review.filter((x) => x.userCorrect).length}/{details.review.length} correct
          </p>
        </div>
        <p className="font-mono text-[11px] text-zinc-600">end of broadcast</p>
      </div>
    );
  }

  const revealed = state.phase === "reveal";
  const elapsedInQuestion = Math.min(QUESTION_MS, rel);
  const questionCountdown = Math.max(0, Math.ceil((QUESTION_MS - elapsedInQuestion) / 1000));

  return (
    <div>
      {/* round dots */}
      <div className="mb-4 flex items-center justify-center gap-1.5">
        {details.review.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 w-6 rounded-full transition-colors duration-300",
              i < state.seg.index ? "bg-emerald-500" : i === state.seg.index ? "bg-zinc-200" : "bg-zinc-800"
            )}
          />
        ))}
        <span className="ml-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          round {state.seg.index + 1}/{details.review.length}
        </span>
      </div>

      {/* lock indicators + countdown */}
      <div className="mb-5 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[10px] font-bold transition-all duration-300",
            state.userLocked ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 opacity-100" : "border-zinc-800 text-zinc-600 opacity-60"
          )}
        >
          {state.userLocked ? <Check className="h-3 w-3" /> : <Loader2 className="h-3 w-3 animate-spin" />}
          <span className="hidden max-w-[120px] truncate sm:inline">
            {youLabel} {state.userLocked ? "locked in" : "reading…"}
          </span>
          <span className="max-w-[60px] truncate sm:hidden">{youLabel}</span>
        </span>
        {!revealed && <span className="font-mono text-sm font-bold tabular-nums text-zinc-300">{questionCountdown}s</span>}
        {revealed && (
          <span className="inline-flex items-center gap-2 font-mono text-xs">
            <span className="text-emerald-400">+{r.points}</span>
            <span className="text-zinc-700">·</span>
            <span className="text-amber-400">+{state.seg.botPts}</span>
          </span>
        )}
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[10px] font-bold transition-all duration-300",
            state.botLocked ? "border-amber-500/50 bg-amber-500/10 text-amber-400 opacity-100" : "border-zinc-800 text-zinc-600 opacity-60"
          )}
        >
          {state.botLocked ? <Check className="h-3 w-3" /> : <Loader2 className="h-3 w-3 animate-spin" />}
          <span className="hidden sm:inline">{state.botLocked ? "locked in" : "thinking…"}</span>
          <span className="sm:hidden">opp</span>
        </span>
      </div>

      {/* question */}
      <div key={state.seg.index} className="cc-rise mx-auto max-w-2xl text-center">
        <span className="rounded bg-zinc-800/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500">{r.category}</span>
        <p className="mt-3 text-lg font-bold leading-snug text-zinc-100 sm:text-xl">{r.question}</p>
        <div className="mt-5 grid gap-2 text-left sm:grid-cols-2">
          {r.options.map((opt, oi) => {
            const isCorrect = revealed && oi === r.answer;
            const isUserPick = revealed && oi === r.userAnswer;
            const isBotPick = revealed && oi === r.botAnswer;
            return (
              <div
                key={oi}
                className={cn(
                  "relative flex min-h-[52px] items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm transition-all duration-300",
                  isCorrect
                    ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-200"
                    : isUserPick
                      ? "border-red-500/50 bg-red-500/10 text-red-200"
                      : revealed
                        ? "border-zinc-800 bg-zinc-950/60 text-zinc-500"
                        : "border-zinc-800 bg-zinc-950/60 text-zinc-300"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-bold",
                    isCorrect ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-400"
                  )}
                >
                  {String.fromCharCode(65 + oi)}
                </span>
                <span className="flex-1">{opt}</span>
                {isUserPick && (
                  <span className="shrink-0 rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-300">{youLabel}</span>
                )}
                {isBotPick && !isUserPick && (
                  <span className="shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-300">opp</span>
                )}
                {isCorrect && <Check className="h-4 w-4 shrink-0 text-emerald-400" />}
                {!isCorrect && isUserPick && r.userAnswer !== r.answer && <X className="h-4 w-4 shrink-0 text-red-400" />}
              </div>
            );
          })}
        </div>
        {revealed && (
          <p className="mt-4 font-mono text-[11px] text-zinc-500">
            {r.userAnswer >= 0 ? (
              <>
                {youLabel} answered in <span className="text-zinc-300">{(r.userTimeMs / 1000).toFixed(1)}s</span>
              </>
            ) : (
              <span className="text-red-400">{youLabel} timed out</span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

// ── coding stage ───────────────────────────────────────────────────────────
function CodingStage({
  match,
  details,
  feed,
  userTests,
  oppTests,
  userSubs,
  userSolved,
  oppSolved,
  clockSec,
  done,
  won,
  youLabel = "you",
}: {
  match: MatchSummary;
  details: CodingMatchDetails;
  feed: CodingEvent[];
  userTests: number;
  oppTests: number;
  userSubs: number;
  userSolved: boolean;
  oppSolved: boolean;
  clockSec: number;
  done: boolean;
  won: boolean;
  /** Owner's scoreboard name in spectator mode; defaults to "you" for the owner viewing their own replay. */
  youLabel?: string;
}) {
  const userPct = Math.round((userTests / Math.max(1, details.totalTests)) * 100);
  const oppPct = Math.round((oppTests / Math.max(1, details.totalTests)) * 100);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      {/* live event feed */}
      <div className="min-w-0">
        <div className="mb-2.5 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            <Volume2 className="h-3 w-3 text-emerald-500" /> live feed
          </h3>
          <span className="font-mono text-xs tabular-nums text-zinc-400">{formatDuration(clockSec)}</span>
        </div>
        <ol className="cc-scroll-thin max-h-[280px] space-y-1.5 overflow-y-auto pr-1">
          {feed.length === 0 && (
            <li className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 font-mono text-[11px] text-zinc-500">
              <Loader2 className="h-3 w-3 animate-spin" /> waiting for first submission…
            </li>
          )}
          {feed.map((e, i) => (
            <li
              key={`${e.t}-${e.label}-${i}`}
              className={cn(
                "cc-rise flex items-center justify-between gap-2 rounded-lg border px-3 py-1.5 font-mono text-[11px]",
                e.kind === "solve"
                  ? e.who === "you"
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                    : "border-red-500/50 bg-red-500/10 text-red-300"
                  : e.kind === "error"
                    ? "border-red-500/25 bg-red-950/20 text-red-300/90"
                    : "border-zinc-800 bg-zinc-950/60 text-zinc-400",
                i === 0 && "ring-1 ring-zinc-600/50"
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className={cn("shrink-0 font-bold", e.who === "you" ? "text-emerald-400" : "text-amber-400")}>
                  {e.who === "you" ? youLabel : match.opponentName}
                </span>
                <span className="min-w-0 truncate">— {e.label}</span>
              </span>
              <span className="shrink-0 text-zinc-600">{formatDuration(e.t)}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* status panels */}
      <div className="space-y-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500">the problem</span>
            <DifficultyBadge difficulty={details.difficulty} />
          </div>
          <p className="flex items-center gap-2 text-sm font-bold text-zinc-200">
            <Swords className="h-4 w-4 text-emerald-400" />
            {details.problemTitle}
          </p>
          <p className="mt-1 font-mono text-[10px] text-zinc-600">
            language: {details.language ?? "js"} · first to all {details.totalTests} tests wins
          </p>
        </div>

        {/* your meter */}
        <div className={cn("rounded-xl border p-4 transition-colors", userSolved ? "border-emerald-500/50 bg-emerald-500/5" : "border-zinc-800 bg-zinc-950/60")}>
          <div className="mb-2 flex items-center justify-between">
            <span className="max-w-[140px] truncate font-mono text-[11px] font-bold text-emerald-400">{youLabel}</span>
            <span className="font-mono text-[11px] text-zinc-500">
              {userSubs} submission{userSubs === 1 ? "" : "s"}
            </span>
          </div>
          <div className="flex items-center justify-between font-mono">
            <span className="text-lg font-bold tabular-nums text-zinc-200">
              {userTests}
              <span className="text-zinc-600">/{details.totalTests}</span>
            </span>
            {userSolved ? (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                <Check className="h-3 w-3" /> SOLVED
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-wider text-zinc-600">in progress</span>
            )}
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
              style={{ width: `${userPct}%` }}
            />
          </div>
        </div>

        {/* opponent meter */}
        <div className={cn("rounded-xl border p-4 transition-colors", oppSolved ? "border-red-500/50 bg-red-500/5" : "border-zinc-800 bg-zinc-950/60")}>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold text-amber-400">{match.opponentName}</span>
            <span className="font-mono text-[10px] text-zinc-600">{details.human ? "LIVE" : "BOT"}</span>
          </div>
          <div className="flex items-center justify-between font-mono">
            <span className="text-lg font-bold tabular-nums text-zinc-200">
              {oppTests}
              <span className="text-zinc-600">/{details.totalTests}</span>
            </span>
            {oppSolved ? (
              <span className="inline-flex items-center gap-1 rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-300">
                <X className="h-3 w-3" /> SOLVED
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-wider text-zinc-600">in progress</span>
            )}
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
              style={{ width: `${oppPct}%` }}
            />
          </div>
        </div>

        {(userSolved || oppSolved || done) && (
          <div
            className={cn(
              "cc-rise flex items-center justify-center gap-3 rounded-xl border px-4 py-3 text-center",
              won ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300" : "border-red-500/50 bg-red-500/10 text-red-300"
            )}
          >
            {won ? <Trophy className="h-5 w-5 shrink-0" /> : <Skull className="h-5 w-5 shrink-0" />}
            <span className="font-mono text-sm font-bold">
              {done
                ? won
                  ? "VICTORY — end of broadcast"
                  : "DEFEAT — end of broadcast"
                : userSolved
                  ? `${youLabel} solved it first!`
                  : `${match.opponentName} solved it first`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
