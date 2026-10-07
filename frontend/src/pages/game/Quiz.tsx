
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  Crown,
  Eye,
  Loader2,
  Play,
  RotateCcw,
  Swords,
  Trophy,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/game/page-header";
import { PlayerAvatar } from "@/components/game/player-avatar";
import { RankBadge } from "@/components/game/rank-badge";
import { CountUp } from "@/components/game/count-up";
import { useAuth } from "@/lib/auth-context"; import type { ClientUser } from "@/lib/auth-context";
import { pickQuizQuestions, type QuizQuestion } from "@/lib/data/quiz";
import { pickBot, BOTS } from "@/lib/bots";
import {
  getArenaSocket,
  joinQueue,
  leaveQueue,
  emitQuizLock,
  emitMatchEnd,
  onQueueStats,
  type ArenaMatchFound,
  type ArenaOpponent,
  type ArenaQuizLock,
  type ArenaQueueStats,
} from "@/lib/arena-client";
import { avatarColor } from "@/lib/format";
import { getRank } from "@/lib/game";
import { playSound } from "@/lib/sound";
import type { QuizReviewItem, TournamentDetailResponse, TournamentMatchUpdate } from "@/lib/types";
import { cn } from "@/lib/utils";

const QUESTION_MS = 15000;
const QUESTION_COUNT = 7;

type Phase = "lobby" | "searching" | "found" | "question" | "reveal" | "finished";

interface BotInfo {
  name: string;
  rating: number;
  skill: number;
  tagline: string;
  color: string;
  frame?: string | null;
}

interface MatchOutcome {
  result: "WIN" | "LOSS" | "DRAW";
  ratingChange: number;
  xpEarned: number;
  coinsEarned: number;
  oldRating: number;
  newRating: number;
  user: ClientUser;
  matchId: string;
  tournament?: TournamentMatchUpdate;
  tournamentSlug?: string;
}

const SEARCH_FLAVOR = [
  "scanning the arena…",
  "checking ELO brackets…",
  "eyeing the leaderboard…",
  "someone out there wants your rating…",
];

function CategoryChip({ category, difficulty }: { category: string; difficulty: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="rounded-md border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 font-mono text-[11px] text-zinc-300">
        {category}
      </span>
      <span className="flex items-center gap-1" aria-label={`difficulty ${difficulty} of 3`}>
        {[1, 2, 3].map((d) => (
          <span
            key={d}
            className={cn("h-1.5 w-1.5 rounded-full", d <= difficulty ? "bg-amber-400" : "bg-zinc-700")}
          />
        ))}
      </span>
    </div>
  );
}

export default function QuizPage() {
  const { user: userRaw, setUser } = useAuth(); const user = userRaw!;

  const [phase, setPhase] = useState<Phase>("lobby");
  const [bot, setBot] = useState<BotInfo | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [qi, setQi] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_MS);
  const [userAnswer, setUserAnswer] = useState<number | null>(null);
  const [userTimeMs, setUserTimeMs] = useState(0);
  const [botAnswer, setBotAnswer] = useState<number | null>(null);
  const [botTimeMs, setBotTimeMs] = useState(0);
  const [userScore, setUserScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [earned, setEarned] = useState<{ u: number; b: number }>({ u: 0, b: 0 });
  const [review, setReview] = useState<QuizReviewItem[]>([]);
  const [outcome, setOutcome] = useState<MatchOutcome | null>(null);
  const [searchFlavor, setSearchFlavor] = useState(0);
  const [openReview, setOpenReview] = useState<number | null>(null);
  const [tournament, setTournament] = useState<TournamentDetailResponse | null>(null);

  const timeLeftRef = useRef(QUESTION_MS);
  const botPlanRef = useRef({ correct: false, delayMs: 99999, pick: -1 });
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const matchStartRef = useRef(0);
  const submittingRef = useRef(false);

  const clearBotTimer = () => {
    if (botTimerRef.current) {
      clearTimeout(botTimerRef.current);
      botTimerRef.current = null;
    }
  };

  useEffect(() => () => clearBotTimer(), []);

  // ── live human matchmaking (arena relay, port 3003) ────────────────────────
  const [liveMatch, setLiveMatch] = useState(false);
  const [searchStage, setSearchStage] = useState<"humans" | "fallback" | null>(null);
  const [searchCountdown, setSearchCountdown] = useState<number>(7);
  const searchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [queueStats, setQueueStats] = useState<ArenaQueueStats | null>(null);
  const humanRef = useRef<{ matchId: string; opponent: ArenaOpponent } | null>(null);
  const seedRef = useRef<number>(0);
  const relayedPtsRef = useRef(0);
  const pendingLocksRef = useRef(new Map<number, ArenaQuizLock>());
  const phaseRef = useRef<Phase>("lobby");
  const qiRef = useRef(0);
  const reviewRef = useRef<QuizReviewItem[]>([]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    reviewRef.current = review;
  }, [review]);
  useEffect(() => onQueueStats(setQueueStats), []);

  const voidMatch = useCallback(() => {
    const h = humanRef.current;
    if (h) emitMatchEnd(h.matchId);
    humanRef.current = null;
    pendingLocksRef.current.clear();
    clearBotTimer();
    setLiveMatch(false);
    setPhase("lobby");
    setOutcome(null);
    setReview([]);
    setBot(null);
    setQuestions([]);
  }, []);

  // relay events from the live opponent
  useEffect(() => {
    const sock = getArenaSocket();
    const onOppLock = (data: ArenaQuizLock) => {
      if (!humanRef.current) return;
      if (phaseRef.current === "question" && data.round === qiRef.current) {
        // live lock for the round on screen
        relayedPtsRef.current = data.points;
        setBotAnswer(data.pick);
        setBotTimeMs(data.timeMs);
        return;
      }
      if (data.round <= qiRef.current) {
        // late arrival for a round already resolved on my side — patch the
        // review item and credit the relayed points so totals stay honest
        setReview((prev) =>
          prev.map((r, i) => (i === data.round ? { ...r, botAnswer: data.pick, botCorrect: data.pick === r.answer } : r)),
        );
        setBotScore((s) => s + data.points);
      } else {
        // opponent is a beat ahead — buffer for when I reach that round
        pendingLocksRef.current.set(data.round, data);
      }
    };
    const onOppLeft = () => {
      if (!humanRef.current) return;
      if (phaseRef.current === "found" || phaseRef.current === "question" || phaseRef.current === "reveal") {
        toast.error(`${humanRef.current.opponent.name} disconnected — the match is void.`);
        voidMatch();
      }
    };
    sock.on("quiz:opp:lock", onOppLock);
    sock.on("opp:left", onOppLeft);
    return () => {
      sock.off("quiz:opp:lock", onOppLock);
      sock.off("opp:left", onOppLeft);
    };
  }, [voidMatch]);

  // leave the queue / close the relay match when the page goes away
  useEffect(
    () => () => {
      leaveQueue();
      const h = humanRef.current;
      if (h) emitMatchEnd(h.matchId);
    },
    [],
  );

  // ── tournament context (?t=slug): jump straight into the current round ────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("t");
    if (!t) {
      // ── rematch context (?opponent=&rating=): same opponent, fresh questions
      const oppName = params.get("opponent");
      if (oppName) {
        const oppRating = parseInt(params.get("rating") ?? "", 10);
        const fromRoster = BOTS.find((b) => b.name === oppName);
        const oppInfo: BotInfo = {
          name: oppName,
          rating: Number.isFinite(oppRating) && oppRating > 0 ? oppRating : fromRoster?.rating ?? 1000,
          skill: fromRoster?.skill ?? 0.6,
          tagline: fromRoster?.tagline ?? "wants a rematch",
          color: fromRoster?.color ?? "#fbbf24",
        };
        setPhase("searching");
        setSearchFlavor(0);
        setQuestions(pickQuizQuestions(QUESTION_COUNT));
        setTimeout(() => {
          setBot(oppInfo);
          setPhase("found");
        }, 1600);
      }
      return;
    }
    (async () => {
      try {
        const data: TournamentDetailResponse = await api.get(`/tournaments/${encodeURIComponent(t)}`).then(r => r.data);
        setTournament(data);
        const entry = data.entry;
        const opp = entry && entry.status === "ACTIVE" ? entry.nextOpponent : null;
        if (!entry || !opp) return;
        setPhase("searching");
        setSearchFlavor(0);
        setQuestions(pickQuizQuestions(QUESTION_COUNT));
        setTimeout(() => {
          setBot({ name: opp.name, rating: opp.rating, skill: opp.skill, tagline: opp.tagline, color: opp.color });
          setPhase("found");
        }, 1600);
      } catch {
        /* stay in lobby */
      }
    })();
  }, []);

  // ── matchmaking: live humans first, bot fallback after countdown ────────
  const fallbackToBot = useCallback(() => {
    if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
    leaveQueue();
    setSearchStage("fallback");
    setTimeout(() => {
      const picked = pickBot(user.rating);
      setQuestions(pickQuizQuestions(QUESTION_COUNT));
      setBot(picked.bot);
      setLiveMatch(false);
      setPhase("found");
    }, 1000);
  }, [user.rating]);

  const cancelSearch = useCallback(() => {
    if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
    leaveQueue();
    setPhase("lobby");
    setSearchStage(null);
  }, []);

  const findMatch = () => {
    setPhase("searching");
    setSearchStage("humans");
    setSearchFlavor(0);
    setSearchCountdown(7);
    if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);

    const sock = getArenaSocket();
    let settled = false;

    const stopSearch = () => {
      sock.off("match:found", onFound);
      if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
    };

    const onFound = (data: ArenaMatchFound) => {
      if (settled || data.mode !== "QUIZ") return;
      settled = true;
      stopSearch();
      humanRef.current = { matchId: data.matchId, opponent: data.opponent };
      seedRef.current = data.seed;
      setQuestions(pickQuizQuestions(QUESTION_COUNT, data.seed));
      setBot({
        name: data.opponent.name,
        rating: data.opponent.rating,
        skill: 0.5,
        tagline: "live opponent",
        color: data.opponent.color,
        frame: data.opponent.frame,
      });
      setLiveMatch(true);
      setPhase("found");
    };

    let remainingSeconds = 7;
    searchIntervalRef.current = setInterval(() => {
      remainingSeconds -= 1;
      setSearchCountdown(remainingSeconds);
      if (remainingSeconds <= 0) {
        if (!settled) {
          settled = true;
          stopSearch();
          fallbackToBot();
        }
      }
    }, 1000);

    sock.on("match:found", onFound);
    joinQueue({
      userId: user.id,
      name: user.username,
      rating: user.rating,
      mode: "QUIZ",
      color: avatarColor(user.username),
      frame: user.equippedFrame ?? null,
    });
  };

  // ── rematch: same opponent, fresh questions ──────────────────────────────
  const rematch = () => {
    if (!bot) return;
    setPhase("searching");
    setSearchFlavor(0);
    setQuestions(pickQuizQuestions(QUESTION_COUNT));
    setTimeout(() => {
      setBot(bot);
      setPhase("found");
    }, 1600);
  };

  useEffect(() => {
    if (phase !== "searching") return;
    const t = setInterval(() => setSearchFlavor((f) => (f + 1) % SEARCH_FLAVOR.length), 700);
    return () => clearInterval(t);
  }, [phase]);

  // start the match after the VS screen
  useEffect(() => {
    if (phase !== "found") return;
    const t = setTimeout(() => {
      setUserScore(0);
      setBotScore(0);
      setReview([]);
      setOutcome(null);
      matchStartRef.current = Date.now();
      startQuestion(0);
      setPhase("question");
      playSound("match-start");
    }, 2400);
    return () => clearTimeout(t);
     
  }, [phase]);

  const startQuestion = (idx: number) => {
    clearBotTimer();
    const q = questions[idx];
    if (!q) return;
    setQi(idx);
    qiRef.current = idx;
    timeLeftRef.current = QUESTION_MS;
    setTimeLeft(QUESTION_MS);
    setUserAnswer(null);
    setUserTimeMs(0);
    setBotAnswer(null);
    setBotTimeMs(0);
    setEarned({ u: 0, b: 0 });
    relayedPtsRef.current = 0;

    if (humanRef.current) {
      // live opponent: their answer arrives over the relay — apply a buffered
      // lock if they locked before I reached this round
      const pending = pendingLocksRef.current.get(idx);
      if (pending) {
        pendingLocksRef.current.delete(idx);
        relayedPtsRef.current = pending.points;
        setBotAnswer(pending.pick);
        setBotTimeMs(pending.timeMs);
      }
      return;
    }

    // plan the opponent's behavior for this question
    const skillAdj = (bot?.skill ?? 0.6) + (q.difficulty === 1 ? 0.08 : q.difficulty === 3 ? -0.08 : 0);
    const correct = Math.random() < skillAdj;
    let pick = q.answer;
    if (!correct) {
      const wrongs = q.options.map((_, i) => i).filter((i) => i !== q.answer);
      pick = wrongs[Math.floor(Math.random() * wrongs.length)];
    }
    const timesOut = Math.random() < 0.07;
    const delayMs = timesOut ? QUESTION_MS + 5000 : 2200 + Math.random() * (QUESTION_MS - 3500);
    botPlanRef.current = { correct, delayMs, pick };

    if (delayMs < QUESTION_MS) {
      botTimerRef.current = setTimeout(() => {
        botTimerRef.current = null;
        setBotAnswer(pick);
        setBotTimeMs(delayMs);
      }, delayMs);
    }
  };

  // ── question countdown ───────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "question") return;
    const t = setInterval(() => {
      timeLeftRef.current = Math.max(0, timeLeftRef.current - 100);
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current === 0) clearInterval(t);
    }, 100);
    return () => clearInterval(t);
  }, [phase, qi]);

  const answer = (idx: number) => {
    if (phase !== "question" || userAnswer !== null) return;
    setUserAnswer(idx);
    const elapsed = QUESTION_MS - timeLeftRef.current;
    setUserTimeMs(elapsed);
    if (humanRef.current) {
      // broadcast my lock to the live opponent
      const q = questions[qi];
      const pts = q && idx === q.answer ? 100 + Math.round(60 * ((QUESTION_MS - elapsed) / QUESTION_MS)) : 0;
      emitQuizLock({ matchId: humanRef.current.matchId, round: qi, pick: idx, timeMs: elapsed, points: pts });
      return;
    }
    // hurry the bot up once the player has locked in
    if (botAnswer === null && botTimerRef.current === null && botPlanRef.current.delayMs < QUESTION_MS) {
      const wait = 500 + Math.random() * 900;
      botTimerRef.current = setTimeout(() => {
        botTimerRef.current = null;
        setBotAnswer(botPlanRef.current.pick);
        setBotTimeMs(Math.min(QUESTION_MS - 100, elapsed + wait));
      }, wait);
    } else if (botAnswer === null && botTimerRef.current !== null) {
      // bot timer still running — leave it
    }
  };

  // ── resolve the question ─────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "question") return;
    const resolved = timeLeft <= 0 || (userAnswer !== null && botAnswer !== null);
    if (!resolved) return;
    // live matches get a short grace window for a late opponent lock
    const delay = humanRef.current && botAnswer === null ? 1600 : 750;
    const t = setTimeout(() => {
      const q = questions[qi];
      if (!q) return;
      const ua = userAnswer ?? -1;
      const ba = botAnswer ?? -1;
      const uPts = ua === q.answer ? 100 + Math.round(60 * ((QUESTION_MS - userTimeMs) / QUESTION_MS)) : 0;
      const bPts = humanRef.current
        ? relayedPtsRef.current // points computed on the opponent's own clock
        : ba === q.answer
          ? 100 + Math.round(60 * ((QUESTION_MS - botTimeMs) / QUESTION_MS))
          : 0;
      setUserScore((s) => s + uPts);
      setBotScore((s) => s + bPts);
      setEarned({ u: uPts, b: bPts });
      setReview((prev) => [
        ...prev,
        {
          questionId: q.id,
          category: q.category,
          question: q.q,
          options: q.options,
          answer: q.answer,
          userAnswer: ua,
          botAnswer: ba,
          userCorrect: ua === q.answer,
          botCorrect: ba === q.answer,
          userTimeMs: ua >= 0 ? userTimeMs : QUESTION_MS,
          points: uPts,
        },
      ]);
      setPhase("reveal");
      playSound(ua === q.answer ? "correct" : "wrong");
    }, 750);
    return () => clearTimeout(t);
  }, [phase, timeLeft, userAnswer, botAnswer, qi, questions, userTimeMs, botTimeMs]);

  // ── advance from reveal ──────────────────────────────────────────────────
  const nextQuestion = useCallback(() => {
    if (qi + 1 < questions.length) {
      startQuestion(qi + 1);
      setPhase("question");
    } else {
      setPhase("finished");
    }
     
  }, [qi, questions.length]);

  useEffect(() => {
    if (phase !== "reveal") return;
    const t = setTimeout(() => nextQuestion(), 2800);
    return () => clearTimeout(t);
  }, [phase, qi, nextQuestion]);

  // ── submit the match result ──────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "finished" || submittingRef.current || !bot) return;
    submittingRef.current = true;

    const finalUser = userScore;
    const finalBot = botScore;
    const result: "WIN" | "LOSS" | "DRAW" = finalUser > finalBot ? "WIN" : finalUser < finalBot ? "LOSS" : "DRAW";
    playSound(result === "WIN" ? "victory" : result === "LOSS" ? "defeat" : "xp");
    const userCorrect = review.filter((r) => r.userCorrect).length;
    const botCorrectCount = review.filter((r) => r.botCorrect).length;
    const answeredMs = review.filter((r) => r.userAnswer >= 0).map((r) => r.userTimeMs);
    const avgResponseMs = answeredMs.length > 0 ? Math.round(answeredMs.reduce((a, b) => a + b, 0) / answeredMs.length) : QUESTION_MS;
    const durationSec = Math.max(1, Math.round((Date.now() - matchStartRef.current) / 1000));
    const h = humanRef.current;
    if (h) {
      emitMatchEnd(h.matchId);
      humanRef.current = null;
    }

    (async () => {
      try {
        const data = await api.post("/match", {
          type: "QUIZ",
          result,
          opponentName: h ? h.opponent.name : bot.name,
          opponentRating: h ? h.opponent.rating : bot.rating,
          score: finalUser,
          opponentScore: finalBot,
          durationSec,
          details: {
            totalQuestions: questions.length,
            review,
            userAccuracy: review.length > 0 ? userCorrect / review.length : 0,
            botAccuracy: review.length > 0 ? botCorrectCount / review.length : 0,
            avgResponseMs,
            ...(h ? { human: true, seed: seedRef.current } : {}),
          },
          ...(tournament?.entry?.status === "ACTIVE"
            ? { tournament: { slug: tournament.tournament.slug, round: tournament.entry.round } }
            : {}),
        }).then(r => r.data);
        if (data.user) setUser(data.user);
        setOutcome({
          result,
          ratingChange: data.ratingChange,
          xpEarned: data.xpEarned,
          coinsEarned: data.coinsEarned ?? 0,
          oldRating: data.user ? data.user.rating - data.ratingChange : user.rating,
          newRating: data.user ? data.user.rating : user.rating,
          user: data.user,
          matchId: data.match?.id ?? "",
          tournament: data.tournament,
          tournamentSlug: data.tournament ? tournament?.tournament.slug : undefined,
        });
      } catch {
        toast.error("Could not record the match — but the battle happened, we both know it.");
        setOutcome({
          result,
          ratingChange: 0,
          xpEarned: 0,
          coinsEarned: 0,
          oldRating: user.rating,
          newRating: user.rating,
          user,
          matchId: "",
        });
      } finally {
        submittingRef.current = false;
      }
    })();
     
  }, [phase]);

  const q = questions[qi];
  const timePct = (timeLeft / QUESTION_MS) * 100;
  const seconds = (timeLeft / 1000).toFixed(1);

  // ── render ───────────────────────────────────────────────────────────────
  if (phase === "lobby") {
    return (
      <div>
        <PageHeader
          icon={Zap}
          title="Quiz Battle"
          description="Rapid-fire 1v1 trivia on DSA and CS fundamentals. Correct answers score 100 points plus up to 60 for speed."
        />
        <div className="mx-auto max-w-xl">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8">
            <div className="mb-6 grid grid-cols-3 gap-2 text-center font-mono">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 py-3">
                <div className="text-lg font-bold text-emerald-400">{QUESTION_COUNT}</div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">questions</div>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 py-3">
                <div className="text-lg font-bold text-amber-400">15s</div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">per question</div>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 py-3">
                <div className="text-lg font-bold text-zinc-200">~2 min</div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">per match</div>
              </div>
            </div>
            <ul className="mb-6 space-y-2 text-sm text-zinc-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                Both players answer the same questions on their own clocks.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                Faster correct answers earn more — hesitation is expensive.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                ELO rating moves with every result. Opponents are matched near your level.
              </li>
            </ul>
            <button
              onClick={findMatch}
              className="cc-pulse-glow flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 font-mono text-base font-bold text-zinc-950 transition-all hover:bg-emerald-400"
            >
              <Swords className="h-5 w-5" /> find opponent
            </button>
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950/60 px-3 py-1 font-mono text-[11px] text-zinc-400">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                {queueStats ? (
                  <>
                    {queueStats.online} online · {queueStats.inQueue.QUIZ} queuing
                  </>
                ) : (
                  "connecting to live queue…"
                )}
              </span>
            </div>
            <p className="mt-3 text-center font-mono text-[11px] text-zinc-600">
              live queue — real players first, bot fallback after 9s · open a second tab to play a friend
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "searching") {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center text-center p-4">
        <div className="relative flex h-36 w-36 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full border-2 border-emerald-500/20" />
          <span className="absolute inset-3 animate-pulse rounded-full border border-emerald-500/30" />
          <span className="absolute inset-6 rounded-full border border-emerald-500/40 bg-emerald-950/20 backdrop-blur-sm" />
          <Zap className="relative h-12 w-12 animate-pulse text-emerald-400" />
        </div>

        {searchStage === "fallback" ? (
          <>
            <p className="mt-8 font-mono text-xl font-bold text-zinc-100">
              No live contenders in queue — drafting trivia bot…
            </p>
            <p className="mt-2 font-mono text-xs text-zinc-500">
              Selecting an AI opponent near your rating ({user.rating} ELO)
            </p>
          </>
        ) : (
          <>
            <p className="mt-8 font-mono text-xl font-bold text-zinc-100">
              Scanning Arena for Trivia Challengers…
            </p>
            <div className="mt-2 flex items-center justify-center gap-2 font-mono text-xs text-zinc-400">
              <span>Automatic bot fallback in:</span>
              <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 font-bold text-emerald-400">
                0:0{searchCountdown}
              </span>
            </div>
            {queueStats && (
              <p className="mt-2 inline-flex items-center gap-1.5 font-mono text-[11px] text-emerald-400/80">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                {queueStats.online} online in arena · {queueStats.inQueue.QUIZ} in quiz queue
              </p>
            )}

            {/* Quick Actions */}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={fallbackToBot}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 font-mono text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
              >
                <Zap className="h-4 w-4 fill-current" /> Fight AI Bot Now
              </button>
              <button
                onClick={cancelSearch}
                className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2.5 font-mono text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
              >
                Cancel Search
              </button>
            </div>
          </>
        )}

        <p className="mt-6 font-mono text-[11px] text-zinc-600">
          speed trivia clash · rating bracket: {user.rating} ELO
        </p>
      </div>
    );
  }

  if (phase === "found" && bot) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        {humanRef.current && (
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-red-500/50 bg-red-500/10 px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-widest text-red-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
            </span>
            live match — real opponent
          </div>
        )}
        <div className="flex items-center gap-6 sm:gap-12">
          <div className="cc-rise text-center">
            <PlayerAvatar name={user.username} size="xl" />
            <p className="mt-3 font-mono text-sm font-bold text-zinc-100">{user.username}</p>
            <div className="mt-1.5">
              <RankBadge rating={user.rating} showRating />
            </div>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-emerald-400">you</p>
          </div>
          <div className="flex flex-col items-center">
            <span className="cc-pulse-glow inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/40 bg-red-500/10 text-2xl font-black text-red-400">
              VS
            </span>
          </div>
          <div className="cc-rise text-center" style={{ animationDelay: "0.15s" }}>
            <PlayerAvatar name={bot.name} size="xl" isBot={!humanRef.current} color={bot.color} frame={humanRef.current ? bot.frame : undefined} />
            <p className="mt-3 font-mono text-sm font-bold text-zinc-100">{bot.name}</p>
            <div className="mt-1.5">
              <RankBadge rating={bot.rating} showRating />
            </div>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              {humanRef.current ? "live opponent" : `&ldquo;${bot.tagline}&rdquo;`}
            </p>
          </div>
        </div>
        <p className="mt-10 font-mono text-sm text-zinc-500">
          {humanRef.current ? "both players get the same seven questions…" : "clash begins…"}
        </p>
      </div>
    );
  }

  if ((phase === "question" || phase === "reveal") && q && bot) {
    const revealed = phase === "reveal";
    return (
      <div className="mx-auto max-w-3xl">
        {/* Scoreboard */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3">
            <PlayerAvatar name={user.username} size="md" />
            <div className="min-w-0">
              <p className="truncate font-mono text-xs text-zinc-400">{user.username}</p>
              <p className="font-mono text-xl font-bold tabular-nums text-zinc-100">
                {userScore}
                {revealed && earned.u > 0 && <span className="ml-1.5 text-sm text-emerald-400">+{earned.u}</span>}
              </p>
            </div>
          </div>
          <div className="shrink-0 text-center">
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              round {qi + 1}/{questions.length}
            </p>
            <p
              className={cn(
                "font-mono text-2xl font-bold tabular-nums transition-colors",
                phase === "question" && timeLeft <= 5000 ? "text-red-400" : "text-zinc-100"
              )}
            >
              {phase === "question" ? seconds : "—"}
            </p>
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3">
            <div className="min-w-0 text-right">
              <p className="truncate font-mono text-xs text-zinc-400">
                {bot.name}
                {liveMatch && <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wider text-red-400">● live</span>}
              </p>
              <p className="font-mono text-xl font-bold tabular-nums text-zinc-100">
                {botScore}
                {revealed && earned.b > 0 && <span className="ml-1.5 text-sm text-amber-400">+{earned.b}</span>}
              </p>
            </div>
            <PlayerAvatar name={bot.name} size="md" isBot={!liveMatch} color={bot.color} frame={liveMatch ? bot.frame : undefined} />
          </div>
        </div>

        {/* Timer bar */}
        {phase === "question" && (
          <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div
              className={cn("h-full rounded-full transition-[width] duration-100 ease-linear", timeLeft <= 5000 ? "bg-red-500" : "bg-emerald-500")}
              style={{ width: `${timePct}%` }}
            />
          </div>
        )}

        {/* Bot status */}
        <div className="mb-4 flex items-center justify-center">
          {phase === "question" && (
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3.5 py-1.5 font-mono text-xs text-zinc-500">
              {botAnswer === null ? (
                <>
                  <span className="flex gap-1">
                    <span className="h-1 w-1 animate-bounce rounded-full bg-zinc-400 [animation-delay:0ms]" />
                    <span className="h-1 w-1 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms]" />
                    <span className="h-1 w-1 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms]" />
                  </span>
                  {bot.name} is thinking…
                </>
              ) : (
                <>
                  <LockIcon /> {bot.name} locked in
                </>
              )}
            </span>
          )}
          {revealed && (
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3.5 py-1.5 font-mono text-xs text-zinc-400">
              <Eye className="h-3.5 w-3.5" /> reveal — next question in a moment
            </span>
          )}
        </div>

        {/* Question */}
        <div key={qi} className="cc-rise rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-7">
          <div className="mb-4 flex items-center justify-between">
            <CategoryChip category={q.category} difficulty={q.difficulty} />
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-zinc-600">
              <Clock className="h-3 w-3" /> max 160 pts
            </span>
          </div>
          <p className="text-lg font-medium leading-relaxed text-zinc-100 sm:text-xl">{q.q}</p>
          <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
            {q.options.map((option, i) => {
              const isUserPick = userAnswer === i;
              const isBotPick = revealed && botAnswer === i;
              const isCorrect = revealed && i === q.answer;
              return (
                <button
                  key={i}
                  onClick={() => answer(i)}
                  disabled={revealed || userAnswer !== null}
                  className={cn(
                    "relative rounded-xl border px-4 py-3.5 text-left font-mono text-sm transition-all",
                    isCorrect
                      ? "border-emerald-500/70 bg-emerald-500/15 text-emerald-300"
                      : isUserPick && revealed
                        ? "border-red-500/60 bg-red-500/10 text-red-300"
                        : isUserPick
                          ? "border-amber-500/60 bg-amber-500/10 text-amber-200"
                          : "border-zinc-800 bg-zinc-950/50 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-900",
                    (revealed || userAnswer !== null) && "cursor-default"
                  )}
                >
                  <span className="mr-2 text-zinc-600">{String.fromCharCode(65 + i)}.</span>
                  {option}
                  {isCorrect && <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />}
                  {isUserPick && revealed && !isCorrect && (
                    <XCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-400" />
                  )}
                  {isBotPick && (
                    <span className="absolute -top-2 right-2 rounded bg-zinc-800 px-1.5 py-px font-mono text-[9px] font-bold uppercase tracking-wider text-zinc-400 ring-1 ring-zinc-700">
                      {liveMatch ? "opp" : "bot"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {revealed && (
            <div className="cc-rise mt-5 rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
              <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-500">why</p>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">{q.explanation}</p>
            </div>
          )}
        </div>

        {revealed && (
          <div className="mt-4 text-center">
            <button
              onClick={nextQuestion}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900/60 px-4 py-2 font-mono text-xs text-zinc-300 transition-colors hover:border-emerald-600/50 hover:text-emerald-400"
            >
              {qi + 1 < questions.length ? "next question" : "see results"} <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  if (phase === "finished" && bot) {
    const userCorrect = review.filter((r) => r.userCorrect).length;
    const botCorrect = review.filter((r) => r.botCorrect).length;
    const answeredMs = review.filter((r) => r.userAnswer >= 0).map((r) => r.userTimeMs);
    const avgSec = answeredMs.length > 0 ? (answeredMs.reduce((a, b) => a + b, 0) / answeredMs.length / 1000).toFixed(1) : "—";
    const won = outcome?.result === "WIN";

    return (
      <div className="mx-auto max-w-3xl">
        {/* Result banner */}
        <div
          className={cn(
            "cc-rise rounded-2xl border p-6 text-center sm:p-8",
            won ? "border-emerald-500/40 bg-emerald-500/10" : outcome?.result === "LOSS" ? "border-red-500/40 bg-red-500/10" : "border-zinc-700 bg-zinc-800/40"
          )}
        >
          <div className="flex items-center justify-center gap-3">
            <PlayerAvatar name={user.username} size="lg" />
            <span className="font-mono text-4xl font-black">{userScore}</span>
            <span className="font-mono text-xl text-zinc-600">:</span>
            <span className="font-mono text-4xl font-black">{botScore}</span>
            <PlayerAvatar name={bot.name} size="lg" isBot={!liveMatch} color={bot.color} frame={liveMatch ? bot.frame : undefined} />
          </div>
          {liveMatch && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-3.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-red-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" /> live human match
            </p>
          )}
          <h2
            className={cn(
              "mt-4 flex items-center justify-center gap-2.5 text-3xl font-black tracking-tight",
              won ? "text-emerald-400" : outcome?.result === "LOSS" ? "text-red-400" : "text-zinc-200"
            )}
          >
            {won ? <Trophy className="h-7 w-7" /> : outcome?.result === "LOSS" ? <X className="h-7 w-7" /> : null}
            {outcome ? outcome.result : "RECORDING…"}
          </h2>
          {outcome && (
            <>
              <p className="mt-2 font-mono text-sm text-zinc-400">
                {outcome.result === "WIN" ? "you beat" : outcome.result === "LOSS" ? "beaten by" : "dead even with"}{" "}
                <span className="font-bold text-zinc-200">{bot.name}</span> ({bot.rating})
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-6">
                <div className="text-center">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">rating</p>
                  <p className="mt-1 font-mono text-2xl font-bold text-zinc-100">
                    <CountUp from={outcome.oldRating} to={outcome.newRating} />
                  </p>
                  <p
                    className={cn(
                      "font-mono text-sm font-bold",
                      outcome.ratingChange > 0 ? "text-emerald-400" : outcome.ratingChange < 0 ? "text-red-400" : "text-zinc-400"
                    )}
                  >
                    {outcome.ratingChange > 0 ? "+" : ""}
                    {outcome.ratingChange}
                  </p>
                </div>
                <div className="text-center">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">xp earned</p>
                  <p className="mt-1 font-mono text-2xl font-bold text-amber-400">+{outcome.xpEarned}</p>
                </div>
                <div className="text-center">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">coins earned</p>
                  <p className="mt-1 inline-flex items-center justify-center gap-1.5 font-mono text-2xl font-bold text-amber-300">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border-2 border-amber-400/80 bg-gradient-to-br from-amber-300 to-amber-600 font-mono text-[8px] font-black text-amber-950" aria-hidden>C</span>
                    +{outcome.coinsEarned}
                  </p>
                </div>
                <div className="text-center">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">new rank</p>
                  <div className="mt-2 flex justify-center">
                    <RankBadge rating={outcome.newRating} showRating />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            [`${userCorrect}/${review.length}`, "your accuracy", "text-emerald-400"],
            [`${botCorrect}/${review.length}`, liveMatch ? "their accuracy" : "bot accuracy", "text-zinc-300"],
            [`${avgSec}s`, "avg response", "text-zinc-300"],
            [userScore.toLocaleString(), "points scored", "text-amber-400"],
          ].map(([v, l, c]) => (
            <div key={l} className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-center">
              <div className={cn("font-mono text-xl font-bold", c)}>{v}</div>
              <div className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-500">{l}</div>
            </div>
          ))}
        </div>

        {outcome?.tournament && (
          <div
            className={cn(
              "cc-rise mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-5 py-4",
              outcome.tournament.status === "CHAMPION"
                ? "border-amber-500/50 bg-amber-500/10"
                : outcome.tournament.advanced
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : "border-red-500/40 bg-red-500/5"
            )}
          >
            <div className="flex items-center gap-3">
              <Crown className={cn("h-5 w-5", outcome.tournament.status === "CHAMPION" ? "text-amber-400" : "text-zinc-400")} />
              <div>
                <p
                  className={cn(
                    "font-mono text-sm font-bold",
                    outcome.tournament.status === "CHAMPION"
                      ? "text-amber-300"
                      : outcome.tournament.advanced
                        ? "text-emerald-300"
                        : "text-red-300"
                  )}
                >
                  {outcome.tournament.status === "CHAMPION"
                    ? "🏆 CUP CHAMPION — the trophy is yours"
                    : outcome.tournament.advanced
                      ? `advanced to round ${outcome.tournament.round}`
                      : `eliminated ${outcome.tournament.eliminatedIn ?? ""}`}
                </p>
                <p className="font-mono text-[11px] text-zinc-500">
                  {outcome.tournament.placement ? `final placement: #${outcome.tournament.placement} · ` : ""}
                  tournament bonus: <span className="font-bold text-amber-400">+{outcome.tournament.xpBonus} XP</span>
                </p>
              </div>
            </div>
            <Link to={`/app/tournaments/${outcome.tournamentSlug}`}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-600 bg-zinc-900/60 px-3.5 font-mono text-xs font-bold text-zinc-200 transition-colors hover:border-amber-500/50 hover:text-amber-300"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> back to bracket
            </Link>
          </div>
        )}

        {/* Review */}
        <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h3 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">answer review</h3>
          <div className="space-y-2">
            {review.map((r, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60">
                <button
                  onClick={() => setOpenReview(openReview === i ? null : i)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                  {r.userCorrect ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm text-zinc-300">{r.question}</span>
                  <span className="shrink-0 font-mono text-xs text-zinc-600">+{r.points}</span>
                  <ChevronRight
                    className={cn("h-4 w-4 shrink-0 text-zinc-600 transition-transform", openReview === i && "rotate-90")}
                  />
                </button>
                {openReview === i && (
                  <div className="border-t border-zinc-800/70 px-4 py-3 text-sm">
                    <p className="text-zinc-400">
                      correct: <span className="font-medium text-emerald-400">{r.options[r.answer]}</span>
                    </p>
                    {r.userAnswer >= 0 && r.userAnswer !== r.answer && (
                      <p className="mt-1 text-zinc-400">
                        you: <span className="font-medium text-red-400">{r.options[r.userAnswer]}</span>
                      </p>
                    )}
                    {r.userAnswer < 0 && (
                      <p className="mt-1 text-zinc-400">
                        you: <span className="font-medium text-red-400">timed out</span>
                      </p>
                    )}
                    {r.botAnswer >= 0 && r.botAnswer !== r.answer && (
                      <p className="mt-1 text-zinc-400">
                        {bot.name}: <span className="font-medium text-amber-400">{r.options[r.botAnswer]}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {outcome?.tournamentSlug ? (
            <Link to={`/app/tournaments/${outcome.tournamentSlug}`}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-500 px-5 font-mono text-sm font-bold text-zinc-950 transition-all hover:bg-emerald-400"
            >
              <Crown className="h-4 w-4" /> back to tournament
            </Link>
          ) : (
            <>
              <button
                onClick={() => {
                  setPhase("lobby");
                  setOutcome(null);
                  setReview([]);
                  setLiveMatch(false);
                }}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-500 px-5 font-mono text-sm font-bold text-zinc-950 transition-all hover:bg-emerald-400"
              >
                <RotateCcw className="h-4 w-4" /> queue again
              </button>
              {liveMatch ? (
                <button
                  onClick={() => {
                    setOutcome(null);
                    setReview([]);
                    setLiveMatch(false);
                    findMatch();
                  }}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-red-500/50 bg-red-500/10 px-5 font-mono text-sm font-bold text-red-400 transition-all hover:bg-red-500/20"
                >
                  <Zap className="h-4 w-4" /> queue another live match
                </button>
              ) : (
                <button
                  onClick={rematch}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-amber-500/50 bg-amber-500/10 px-5 font-mono text-sm font-bold text-amber-400 transition-all hover:bg-amber-500/20"
                >
                  <Zap className="h-4 w-4" /> rematch {bot.name}
                </button>
              )}
            </>
          )}
          <Link to="/app/history"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/60 px-5 font-mono text-sm text-zinc-300 transition-colors hover:border-zinc-500"
          >
            <Eye className="h-4 w-4" /> match history
          </Link>
          <Link to="/app/game/battle"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-5 font-mono text-sm text-red-400 transition-colors hover:bg-red-500/20"
          >
            <Swords className="h-4 w-4" /> coding battle
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
