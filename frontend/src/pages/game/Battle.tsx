
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Crown,
  Eye,
  Flame,
  Loader2,
  Play,
  RotateCcw,
  Skull,
  Swords,
  Trophy,
  WandSparkles,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/game/page-header";
import { PlayerAvatar } from "@/components/game/player-avatar";
import { RankBadge } from "@/components/game/rank-badge";
import { DifficultyBadge } from "@/components/game/difficulty-badge";
import { CountUp } from "@/components/game/count-up";
import { CodeEditor } from "@/components/game/code-editor";
import { CodeBlock } from "@/components/game/code-block";
import { LangPicker } from "@/components/game/lang-picker";
import { useAuth } from "@/lib/auth-context"; import type { ClientUser } from "@/lib/auth-context";
import { problemsByDifficulty, type Problem } from "@/lib/data/problems";
import { getProblemLang } from "@/lib/data/problem-langs";
import { getLang, type LangId } from "@/lib/languages";
import { pickBot, BOTS } from "@/lib/bots";
import {
  getArenaSocket,
  joinQueue,
  leaveQueue,
  emitCodeSubmit,
  emitMatchEnd,
  onQueueStats,
  type ArenaMatchFound,
  type ArenaOpponent,
  type ArenaCodeSubmit,
  type ArenaQueueStats,
} from "@/lib/arena-client";
import { playSound } from "@/lib/sound";
import { difficultyForRound } from "@/lib/data/tournaments";
import type { Difficulty } from "@/lib/game";
import type { CodeRunResponse, BotEvent, TournamentDetailResponse, TournamentMatchUpdate } from "@/lib/types";
import { formatDuration, avatarColor } from "@/lib/format";
import { cn } from "@/lib/utils";

const DURATION_SEC = 480; // demo battles run 8:00 — ranked standard is 30:00

interface BotPlanEvent extends BotEvent {
  tests: number | null;
  solve: boolean;
}

interface BotPlan {
  events: BotPlanEvent[];
  solveTime: number | null;
  finalTests: number;
}

interface BotInfo {
  name: string;
  rating: number;
  skill: number;
  tagline: string;
  color: string;
  frame?: string | null;
}

type Phase = "lobby" | "searching" | "found" | "battle" | "finished";

interface Outcome {
  result: "WIN" | "LOSS" | "DRAW";
  reason: string;
  ratingChange: number;
  xpEarned: number;
  coinsEarned: number;
  oldRating: number;
  newRating: number;
  user: ClientUser;
  stats: {
    elapsed: number;
    userTests: number;
    totalTests: number;
    submissions: number;
    botTests: number;
    userSolvedAt: number | null;
    botSolvedAt: number | null;
    errors: string[];
    botEvents: BotEvent[];
  };
  finalCode: string;
  language: LangId;
  tournament?: TournamentMatchUpdate;
  tournamentSlug?: string;
}

const DIFFICULTY_CARDS: { key: Difficulty; title: string; desc: string; examples: string }[] = [
  { key: "EASY", title: "Easy", desc: "Warm-up problems — most players solve these well within the clock.", examples: "two sum · valid parentheses · binary search" },
  { key: "MEDIUM", title: "Medium", desc: "The real fights. Sliding windows, intervals, DP thinking.", examples: "max subarray · merge intervals · longest substring" },
  { key: "HARD", title: "Hard", desc: "Boss-tier. Partial credit by tests passed is often the decider.", examples: "trapping rain water · rotate image" },
];

function planBotBattle(bot: BotInfo, difficulty: Difficulty, durationSec: number, totalTests: number): BotPlan {
  const skill = bot.skill + (difficulty === "EASY" ? 0.05 : difficulty === "HARD" ? -0.07 : 0);
  const solveProb = Math.min(0.95, (difficulty === "EASY" ? 0.72 : difficulty === "MEDIUM" ? 0.55 : 0.38) * (skill + 0.35));
  const willSolve = Math.random() < solveProb;
  const solveTime = willSolve
    ? Math.max(45, Math.round(durationSec * (0.3 + Math.random() * 0.62 * (1.1 - skill))))
    : null;

  const events: BotPlanEvent[] = [];
  const maxTests = solveTime !== null ? totalTests : Math.max(1, Math.round(totalTests * (0.25 + Math.random() * 0.45)));
  const horizon = solveTime ?? durationSec;
  for (let k = 1; k <= maxTests; k++) {
    const frac = k / (maxTests + 1);
    const t = Math.max(6, Math.round(horizon * (0.28 + 0.6 * frac) - Math.random() * 6));
    events.push({ t, label: `tests passing: ${k}/${totalTests}`, tests: k, solve: false });
  }
  if (solveTime !== null) {
    events.push({ t: solveTime, label: `SUBMITTED — ${totalTests}/${totalTests} tests ✓ ACCEPTED`, tests: totalTests, solve: true });
  }
  return { events: events.sort((a, b) => a.t - b.t), solveTime, finalTests: solveTime !== null ? totalTests : maxTests };
}

function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-zinc-100">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={i} className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[0.85em] text-emerald-300">
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export default function BattlePage() {
  const { user: userRaw, setUser } = useAuth(); const user = userRaw!;

  const [phase, setPhase] = useState<Phase>("lobby");
  const [difficulty, setDifficulty] = useState<Difficulty>("EASY");
  const [language, setLanguage] = useState<LangId>("js");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [bot, setBot] = useState<BotInfo | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [plan, setPlan] = useState<BotPlan | null>(null);
  const [tournament, setTournament] = useState<TournamentDetailResponse | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [botTests, setBotTests] = useState(0);
  const [botLog, setBotLog] = useState<BotPlanEvent[]>([]);
  const [code, setCode] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<CodeRunResponse | null>(null);
  const [submissions, setSubmissions] = useState(0);
  const [userBestTests, setUserBestTests] = useState(0);
  const [userSolvedAt, setUserSolvedAt] = useState<number | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const endedRef = useRef(false);
  const processedRef = useRef(new Set<BotPlanEvent>());
  const stateRef = useRef({ elapsed, botTests, userBestTests, submissions, code, errors, userSolvedAt });

  // ── live human matchmaking (arena relay, port 3003) ────────────────────────
  const [liveMatch, setLiveMatch] = useState(false);
  const [searchStage, setSearchStage] = useState<"humans" | "fallback" | null>(null);
  const [searchCountdown, setSearchCountdown] = useState<number>(7);
  const searchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [queueStats, setQueueStats] = useState<ArenaQueueStats | null>(null);
  const humanRef = useRef<{
    matchId: string;
    opponent: ArenaOpponent;
    oppBestTests: number;
    oppSolvedAt: number | null;
    oppSubmissions: number;
  } | null>(null);
  const seedRef = useRef<number>(0);
  const phaseRef = useRef<Phase>("lobby");

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => onQueueStats(setQueueStats), []);

  const voidBattle = useCallback(() => {
    const h = humanRef.current;
    if (h) emitMatchEnd(h.matchId);
    humanRef.current = null;
    setLiveMatch(false);
    setPhase("lobby");
    setOutcome(null);
    setResult(null);
    setBot(null);
    setProblem(null);
    setPlan(null);
  }, []);

  // relay events from the live opponent
  useEffect(() => {
    const sock = getArenaSocket();
    const onOppSubmit = (data: ArenaCodeSubmit) => {
      const h = humanRef.current;
      if (!h) return;
      h.oppSubmissions += 1;
      if (data.passed > h.oppBestTests) h.oppBestTests = data.passed;
      if (data.accepted) h.oppSolvedAt = data.timeSec;
      const ev: BotPlanEvent = { t: data.timeSec, label: data.label, tests: data.passed, solve: data.accepted };
      setPlan((prev) =>
        prev ? { ...prev, events: [...prev.events, ev], finalTests: h.oppBestTests, solveTime: h.oppSolvedAt } : prev,
      );
    };
    const onOppLeft = () => {
      if (!humanRef.current) return;
      if (phaseRef.current === "found" || phaseRef.current === "battle") {
        toast.error(`${humanRef.current.opponent.name} disconnected — the match is void.`);
        voidBattle();
      }
    };
    sock.on("code:opp:submit", onOppSubmit);
    sock.on("opp:left", onOppLeft);
    return () => {
      sock.off("code:opp:submit", onOppSubmit);
      sock.off("opp:left", onOppLeft);
    };
  }, [voidBattle]);

  // leave the queue / close the relay match when the page goes away
  useEffect(
    () => () => {
      leaveQueue();
      const h = humanRef.current;
      if (h) emitMatchEnd(h.matchId);
    },
    [],
  );
  stateRef.current = { elapsed, botTests, userBestTests, submissions, code, errors, userSolvedAt };

  const langDef = getLang(language);

  // Preferred language persists across battles, practice and tournament rounds.
  useEffect(() => {
    const saved = window.localStorage.getItem("cc-lang");
    if (saved && saved !== language && ["js", "cpp", "py", "java"].includes(saved)) {
      setLanguage(saved as LangId);
    }
     
  }, []);

  const pickLanguage = useCallback((lang: LangId) => {
    setLanguage(lang);
    window.localStorage.setItem("cc-lang", lang);
  }, []);

  const starterFor = useCallback(
    (lang: LangId, p: Problem | null) => {
      if (!p) return "";
      if (lang === "js") return p.starterCode;
      return getProblemLang(p.slug)?.starter[lang] ?? p.starterCode;
    },
    []
  );

  const switchLanguage = (lang: LangId) => {
    if (lang === language) return;
    setDrafts((d) => ({ ...d, [language]: code }));
    setLanguage(lang);
    window.localStorage.setItem("cc-lang", lang);
    setCode(drafts[lang] ?? starterFor(lang, problem));
  };

  // ── tournament context (?t=slug): jump straight into the current round ────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("t");
    if (!t) {
      // ── rematch context (?opponent=&rating=&difficulty=): same opponent, fresh problem
      const oppName = params.get("opponent");
      if (oppName) {
        const oppRating = parseInt(params.get("rating") ?? "", 10);
        const diffParam = (params.get("difficulty") ?? "").toUpperCase();
        const diff: Difficulty = diffParam === "MEDIUM" || diffParam === "HARD" ? diffParam : "EASY";
        const fromRoster = BOTS.find((b) => b.name === oppName);
        const oppInfo: BotInfo = {
          name: oppName,
          rating: Number.isFinite(oppRating) && oppRating > 0 ? oppRating : fromRoster?.rating ?? 1000,
          skill: fromRoster?.skill ?? 0.6,
          tagline: fromRoster?.tagline ?? "wants a rematch",
          color: fromRoster?.color ?? "#f97316",
        };
        setDifficulty(diff);
        setPhase("searching");
        const pool = problemsByDifficulty(diff);
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        setTimeout(() => {
          setProblem(chosen);
          setBot(oppInfo);
          setPlan(planBotBattle(oppInfo, diff, DURATION_SEC, chosen.tests.length));
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
        if (!entry || entry.status !== "ACTIVE" || !entry.nextOpponent) return; // lobby shows notice
        // Cups ramp one difficulty tier per round: quarters → semis → final.
        const roundDiff = difficultyForRound(data.tournament.difficulty, entry.round);
        setDifficulty(roundDiff);
        setPhase("searching");
        const pool = problemsByDifficulty(roundDiff);
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        const opp = entry.nextOpponent;
        const oppInfo: BotInfo = { name: opp.name, rating: opp.rating, skill: opp.skill, tagline: opp.tagline, color: opp.color };
        setTimeout(() => {
          setProblem(chosen);
          setBot(oppInfo);
          setPlan(planBotBattle(oppInfo, roundDiff, DURATION_SEC, chosen.tests.length));
          setPhase("found");
        }, 1600);
      } catch {
        /* stay in lobby */
      }
    })();
  }, []);

  // ── matchmaking: live humans first (same difficulty pool), bot fallback ───
  const fallbackToBot = useCallback(() => {
    if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
    leaveQueue();
    setSearchStage("fallback");
    setTimeout(() => {
      const pool = problemsByDifficulty(difficulty);
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      const picked = pickBot(user.rating);
      setProblem(chosen);
      setBot(picked.bot);
      setPlan(planBotBattle(picked.bot, difficulty, DURATION_SEC, chosen.tests.length));
      setLiveMatch(false);
      setPhase("found");
    }, 1000);
  }, [difficulty, user.rating]);

  const cancelSearch = useCallback(() => {
    if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
    leaveQueue();
    setPhase("lobby");
    setSearchStage(null);
  }, []);

  const findMatch = () => {
    setPhase("searching");
    setSearchStage("humans");
    setSearchCountdown(7);
    if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);

    const sock = getArenaSocket();
    let settled = false;

    const stopSearch = () => {
      sock.off("match:found", onFound);
      if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
    };

    const onFound = (data: ArenaMatchFound) => {
      if (settled || data.mode !== "CODE") return;
      settled = true;
      stopSearch();
      const pool = problemsByDifficulty(difficulty);
      const chosen = pool[data.seed % pool.length];
      humanRef.current = { matchId: data.matchId, opponent: data.opponent, oppBestTests: 0, oppSolvedAt: null, oppSubmissions: 0 };
      seedRef.current = data.seed;
      setProblem(chosen);
      setBot({
        name: data.opponent.name,
        rating: data.opponent.rating,
        skill: 0.5,
        tagline: "live opponent",
        color: data.opponent.color,
        frame: data.opponent.frame,
      });
      // live opponents have no scripted plan — relay events build it in real time
      setPlan({ events: [], solveTime: null, finalTests: 0 });
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
      mode: "CODE",
      color: avatarColor(user.username),
      frame: user.equippedFrame ?? null,
      difficulty,
    });
  };

  // ── rematch: same opponent, fresh problem from the same difficulty ────────
  const rematch = () => {
    if (!bot) return;
    setPhase("searching");
    const pool = problemsByDifficulty(difficulty);
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    setTimeout(() => {
      setProblem(chosen);
      setBot(bot);
      setPlan(planBotBattle(bot, difficulty, DURATION_SEC, chosen.tests.length));
      setPhase("found");
    }, 1600);
  };

  useEffect(() => {
    if (phase !== "found" || !problem || !plan || !bot) return;
    const t = setTimeout(() => {
      setCode(starterFor(language, problem));
      setElapsed(0);
      setBotTests(0);
      setBotLog([]);
      setSubmissions(0);
      setUserBestTests(0);
      setUserSolvedAt(null);
      setErrors([]);
      setResult(null);
      setOutcome(null);
      endedRef.current = false;
      processedRef.current = new Set();
      setPhase("battle");
      playSound("match-start");
    }, 2400);
    return () => clearTimeout(t);
     
  }, [phase]);

  // ── end the battle and record it ──────────────────────────────────────────
  const endBattle = (trigger: "USER_SOLVED" | "BOT_SOLVED" | "TIME") => {
    if (endedRef.current || !problem || !bot || !plan) return;
    endedRef.current = true;

    const h = humanRef.current;
    if (h) {
      emitMatchEnd(h.matchId);
      humanRef.current = null;
    }

    const s = stateRef.current;
    const userSolved = trigger === "USER_SOLVED" ? (s.userSolvedAt ?? s.elapsed) : s.userSolvedAt;
    // When the user submits first, the bot never got to finish; when the bot's
    // solve event fires, the game ends immediately. At TIME, nobody solved.
    const botSolved = trigger === "BOT_SOLVED" ? plan.solveTime : null;

    // Determine outcome cleanly
    let result: "WIN" | "LOSS" | "DRAW";
    let reason: string;
    if (trigger === "USER_SOLVED") {
      result = "WIN";
      reason = `Accepted submission at ${formatDuration(userSolved ?? 0)} — first to green.`;
    } else if (trigger === "BOT_SOLVED") {
      result = "LOSS";
      reason = `${bot.name} submitted an accepted solution at ${formatDuration(plan.solveTime ?? 0)}.`;
    } else {
      // time expired
      if (userSolved !== null && botSolved !== null) {
        if (userSolved < botSolved) {
          result = "WIN";
          reason = `You both solved it — yours landed ${botSolved - userSolved}s earlier.`;
        } else if (userSolved > botSolved) {
          result = "LOSS";
          reason = `Both green — ${bot.name} was ${userSolved - botSolved}s faster.`;
        } else {
          result = "DRAW";
          reason = "Both solved at the same second. Astronomically unlucky.";
        }
      } else if (userSolved !== null) {
        result = "WIN";
        reason = "Accepted submission — the opponent ran out of clock.";
      } else if (botSolved !== null) {
        result = "LOSS";
        reason = `${bot.name} solved it before the buzzer.`;
      } else if (s.userBestTests > plan.finalTests) {
        result = "WIN";
        reason = `Clock expired — you passed ${s.userBestTests}/${problem.tests.length} tests vs ${plan.finalTests}.`;
      } else if (plan.finalTests > s.userBestTests) {
        result = "LOSS";
        reason = `Clock expired — ${bot.name} passed ${plan.finalTests}/${problem.tests.length} tests vs your ${s.userBestTests}.`;
      } else if (s.submissions === 0) {
        result = "DRAW";
        reason = `Both stuck at ${s.userBestTests}/${problem.tests.length} tests. Nobody blinked.`;
      } else {
        result = "DRAW";
        reason = `Even on tests (${s.userBestTests}/${problem.tests.length}). The tiebreak gods shrug.`;
      }
    }

    const finalElapsed = Math.min(DURATION_SEC, trigger === "TIME" ? DURATION_SEC : s.elapsed);
    playSound(result === "WIN" ? "victory" : result === "LOSS" ? "defeat" : "xp");
    const details = {
      problemSlug: problem.slug,
      problemTitle: problem.title,
      difficulty,
      language,
      durationSec: finalElapsed,
      totalTests: problem.tests.length,
      userTestsPassed: trigger === "USER_SOLVED" ? problem.tests.length : s.userBestTests,
      userSubmissions: s.submissions,
      userSolvedAtSec: userSolved,
      botSolvedAtSec: plan.solveTime,
      botEvents: plan.events.map(({ t, label }) => ({ t, label })),
      finalCode: s.code,
      // live opponents never share their code — only the scripted bots do
      botCode: h ? "" : problem.solution,
      errors: s.errors.slice(0, 6),
      ...(h ? { human: true, seed: seedRef.current } : {}),
    };

    (async () => {
      try {
        const data = await api.post("/match", {
          type: "CODING",
          result,
          opponentName: bot.name,
          opponentRating: bot.rating,
          score: details.userTestsPassed,
          opponentScore: plan.finalTests,
          problemTitle: problem.title,
          durationSec: finalElapsed,
          details,
          ...(tournament?.entry?.status === "ACTIVE"
            ? { tournament: { slug: tournament.tournament.slug, round: tournament.entry.round } }
            : {}),
        }).then(r => r.data);
        if (data.user) setUser(data.user);
        setOutcome({
          result,
          reason,
          ratingChange: data.ratingChange,
          xpEarned: data.xpEarned,
          coinsEarned: data.coinsEarned ?? 0,
          oldRating: data.user ? data.user.rating - data.ratingChange : user.rating,
          newRating: data.user ? data.user.rating : user.rating,
          user: data.user ?? user,
          stats: {
            elapsed: finalElapsed,
            userTests: details.userTestsPassed,
            totalTests: problem.tests.length,
            submissions: s.submissions,
            botTests: plan.finalTests,
            userSolvedAt: userSolved,
            botSolvedAt: plan.solveTime,
            errors: s.errors.slice(0, 6),
            botEvents: plan.events.map(({ t, label }) => ({ t, label })),
          },
          finalCode: s.code,
          language,
          tournament: data.tournament,
          tournamentSlug: data.tournament ? tournament?.tournament.slug : undefined,
        });
      } catch {
        toast.error("Could not record the match — the arena ledger is unreachable.");
        setOutcome({
          result,
          reason,
          ratingChange: 0,
          xpEarned: 0,
          coinsEarned: 0,
          oldRating: user.rating,
          newRating: user.rating,
          user,
          stats: {
            elapsed: finalElapsed,
            userTests: details.userTestsPassed,
            totalTests: problem.tests.length,
            submissions: s.submissions,
            botTests: plan.finalTests,
            userSolvedAt: userSolved,
            botSolvedAt: plan.solveTime,
            errors: s.errors.slice(0, 6),
            botEvents: plan.events.map(({ t, label }) => ({ t, label })),
          },
          finalCode: s.code,
          language,
          tournamentSlug: undefined,
        });
      }
    })();

    setPhase("finished");
  };

  // ── battle clock ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "battle") return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "battle" || !plan) return;
    for (const ev of plan.events) {
      if (ev.t <= elapsed && !processedRef.current.has(ev)) {
        processedRef.current.add(ev);
        setBotLog((prev) => [...prev, ev]);
        if (ev.tests !== null) setBotTests(ev.tests);
        if (ev.solve) {
          endBattle("BOT_SOLVED");
          return;
        }
      }
    }
    if (elapsed >= DURATION_SEC) endBattle("TIME");
     
  }, [elapsed, phase, plan]);

  const submit = async (countsAsSubmission: boolean) => {
    if (running || !problem || phase !== "battle") return;
    setRunning(true);
    setResult(null);
    try {
      const data: CodeRunResponse = await api.post("/run", { slug: problem.slug, code, language }).then(r => r.data);
      setResult(data);
      if (countsAsSubmission) {
        setSubmissions((s) => s + 1);
        // broadcast the submission to the live opponent
        const h = humanRef.current;
        if (h) {
          emitCodeSubmit({
            matchId: h.matchId,
            passed: data.passed,
            total: data.total,
            timeSec: elapsed,
            label: data.compileError
              ? "hit a compile error"
              : data.ok
                ? "solved it — ACCEPTED"
                : `submitted — ${data.passed}/${data.total} tests`,
            accepted: data.ok,
          });
        }
      }
      if (data.compileError) {
        setErrors((prev) => [...prev.slice(-4), data.compileError!]);
        playSound("wrong");
      } else {
        const runtimeErrors = data.results.filter((r) => r.error).map((r) => r.error!);
        if (runtimeErrors.length > 0) {
          setErrors((prev) => [...prev.slice(-4), runtimeErrors[0]]);
          playSound("wrong");
        } else if (!data.ok && countsAsSubmission) {
          playSound("tick");
        }
      }
      if (data.passed > stateRef.current.userBestTests) setUserBestTests(data.passed);
      if (data.ok && !endedRef.current) {
        setUserSolvedAt(elapsed);
        stateRef.current.userSolvedAt = elapsed;
        endBattle("USER_SOLVED");
      }
    } catch {
      toast.error("Network error — the judge is unreachable.");
    } finally {
      setRunning(false);
    }
  };

  const remaining = Math.max(0, DURATION_SEC - elapsed);
  const timeCritical = remaining <= 60 && phase === "battle";

  const problemPoolCount = useMemo(() => problemsByDifficulty(difficulty).length, [difficulty]);

  // ── render ───────────────────────────────────────────────────────────────
  if (phase === "lobby") {
    return (
      <div>
        <PageHeader
          icon={Swords}
          title="Coding Battle"
          description="You and an opponent get the same problem and the same clock. First accepted solution wins — otherwise the most tests passed."
        />
        <div className="mx-auto max-w-2xl">
          {tournament && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/5 px-5 py-4">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-amber-400" />
                <div>
                  <p className="font-mono text-sm font-bold text-amber-300">{tournament.tournament.name}</p>
                  <p className="font-mono text-[11px] text-zinc-500">
                    {!tournament.entry
                      ? "you are not registered for this cup"
                      : tournament.entry.status === "CHAMPION"
                        ? "you already lifted this trophy 🏆"
                        : tournament.entry.status === "ELIMINATED"
                          ? "your run in this cup is over"
                          : "your round is ready below"}
                  </p>
                </div>
              </div>
              <Link to={`/app/tournaments/${tournament.tournament.slug}`}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3.5 font-mono text-xs font-bold text-amber-300 transition-colors hover:bg-amber-500/20"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> back to cup
              </Link>
            </div>
          )}
          <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">choose your language</h2>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-5 py-4">
            <LangPicker value={language} onChange={pickLanguage} />
            <span className="font-mono text-[11px] text-zinc-500">
              {langDef.name} · <span className="text-zinc-400">{langDef.toolchain}</span>
            </span>
          </div>
          <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">choose your battlefield</h2>
          <div className="space-y-3">
            {DIFFICULTY_CARDS.map((card) => (
              <button
                key={card.key}
                onClick={() => setDifficulty(card.key)}
                className={cn(
                  "w-full rounded-2xl border p-5 text-left transition-all",
                  difficulty === card.key
                    ? "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_24px_-8px_rgba(52,211,153,0.4)]"
                    : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-600"
                )}
                aria-pressed={difficulty === card.key}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DifficultyBadge difficulty={card.key} />
                    <span className="font-bold text-zinc-100">{card.title}</span>
                  </div>
                  <span className="font-mono text-[11px] text-zinc-600">{problemsByDifficulty(card.key).length} problems</span>
                </div>
                <p className="mt-2 text-sm text-zinc-400">{card.desc}</p>
                <p className="mt-1 font-mono text-[11px] text-zinc-600">{card.examples}</p>
              </button>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/40 px-5 py-4">
            <div className="flex items-center gap-2.5 font-mono text-xs text-zinc-400">
              <Clock className="h-4 w-4 text-zinc-500" />
              demo clock: <span className="font-bold text-zinc-200">08:00</span>
              <span className="text-zinc-600">(ranked standard: 30:00)</span>
            </div>
            <span className="font-mono text-xs text-zinc-500">{problemPoolCount} in pool</span>
          </div>
          <button
            onClick={findMatch}
            className="cc-pulse-glow mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-500 font-mono text-base font-bold text-zinc-50 transition-all hover:bg-red-400"
          >
            <Swords className="h-5 w-5" /> find opponent
          </button>
          <div className="mt-4 flex items-center justify-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950/60 px-3 py-1 font-mono text-[11px] text-zinc-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-400" />
              </span>
              {queueStats ? (
                <>
                  {queueStats.online} online · {queueStats.inQueue.CODE} queuing
                </>
              ) : (
                "connecting to live queue…"
              )}
            </span>
          </div>
          <p className="mt-3 text-center font-mono text-[11px] text-zinc-600">
            live queue — real players first (same difficulty), bot fallback after 9s · open a second tab to play a friend
          </p>
          <p className="mt-1.5 text-center font-mono text-[11px] text-zinc-600">
            win conditions: accepted first · else most tests passed · else fewer submissions
          </p>
          <p className="mt-1 text-center font-mono text-[11px] text-zinc-600">
            judge: JS · C++17 · Python 3 · Java 21 — autocomplete + error suggestions in-editor
          </p>
        </div>
      </div>
    );
  }

  if (phase === "searching") {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center text-center p-4">
        {/* Animated Radar Pulse */}
        <div className="relative flex h-36 w-36 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full border-2 border-red-500/20" />
          <span className="absolute inset-3 animate-pulse rounded-full border border-red-500/30" />
          <span className="absolute inset-6 rounded-full border border-red-500/40 bg-red-950/20 backdrop-blur-sm" />
          <Swords className="relative h-12 w-12 animate-pulse text-red-400" />
        </div>

        {searchStage === "fallback" ? (
          <>
            <p className="mt-8 font-mono text-xl font-bold text-zinc-100">
              No live opponents in queue — drafting AI rival…
            </p>
            <p className="mt-2 font-mono text-xs text-zinc-500">
              Picking a bot calibrated to your rating ({user.rating} ELO)
            </p>
          </>
        ) : (
          <>
            <p className="mt-8 font-mono text-xl font-bold text-zinc-100">
              Scanning Arena for Live Opponents…
            </p>
            <div className="mt-2 flex items-center justify-center gap-2 font-mono text-xs text-zinc-400">
              <span>Automatic bot fallback in:</span>
              <span className="rounded-md bg-red-500/20 px-2 py-0.5 font-bold text-red-400">
                0:0{searchCountdown}
              </span>
            </div>
            {queueStats && (
              <p className="mt-2 inline-flex items-center gap-1.5 font-mono text-[11px] text-red-400/80">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
                {queueStats.online} online in arena · {queueStats.inQueue.CODE} in match queue
              </p>
            )}

            {/* Quick Actions */}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={fallbackToBot}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 px-5 py-2.5 font-mono text-xs font-bold text-white shadow-lg shadow-red-500/20 transition-all hover:scale-105 active:scale-95"
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
          {difficulty.toLowerCase()} bracket · standard ELO ladder · rated match
        </p>
      </div>
    );
  }

  if (phase === "found" && bot && problem) {
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
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-6 py-3">
          <DifficultyBadge difficulty={difficulty} />
          <span className="font-mono text-sm font-bold text-zinc-200">{problem.title}</span>
          <span className="font-mono text-xs text-zinc-500">{problem.tests.length} hidden tests</span>
        </div>
        <div className="flex items-center gap-6 sm:gap-12">
          <div className="cc-rise text-center">
            <PlayerAvatar name={user.username} size="xl" />
            <p className="mt-3 font-mono text-sm font-bold text-zinc-100">{user.username}</p>
            <div className="mt-1.5">
              <RankBadge rating={user.rating} showRating />
            </div>
          </div>
          <span className="cc-pulse-glow inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/40 bg-red-500/10 text-2xl font-black text-red-400">
            VS
          </span>
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
          {humanRef.current ? "same problem, same clock — first accepted solution wins…" : "locking the arena…"}
        </p>
      </div>
    );
  }

  if (phase === "battle" && bot && problem && plan) {
    return (
      <div>
        {/* Battle header */}
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3">
          <div className="flex min-w-0 items-center gap-3">
            <PlayerAvatar name={user.username} size="md" />
            <div className="min-w-0">
              <p className="truncate font-mono text-xs text-zinc-400">{user.username}</p>
              <p className="font-mono text-sm font-bold text-emerald-400">
                {userBestTests}/{problem.tests.length} tests
                <span className="ml-2 font-normal text-zinc-500">{submissions} subs</span>
              </p>
            </div>
          </div>
          <div className="shrink-0 text-center">
            <p
              className={cn(
                "font-mono text-3xl font-bold tabular-nums leading-none transition-colors",
                timeCritical ? "animate-pulse text-red-400" : "text-zinc-100"
              )}
              aria-label={`${Math.floor(remaining / 60)} minutes ${remaining % 60} seconds remaining`}
            >
              {formatDuration(remaining)}
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-zinc-600">
              <DifficultyBadge difficulty={difficulty} className="mr-1.5" />
              {problem.title}
            </p>
          </div>
          <div className="flex min-w-0 items-center justify-end gap-3">
            <div className="min-w-0 text-right">
              <p className="truncate font-mono text-xs text-zinc-400">
                {bot.name}
                {liveMatch && <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wider text-red-400">● live</span>}
              </p>
              <p className="font-mono text-sm font-bold text-amber-400">
                {botTests}/{problem.tests.length} tests
                <span className="ml-2 font-normal text-zinc-500">{liveMatch ? "relay" : "live"}</span>
              </p>
            </div>
            <PlayerAvatar name={bot.name} size="md" isBot={!liveMatch} color={bot.color} frame={liveMatch ? bot.frame : undefined} />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          {/* Left: problem + opponent feed */}
          <div className="space-y-4">
            <section className="cc-scroll-thin max-h-[42vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 lg:max-h-[46vh]">
              <div className="mb-3 flex items-center gap-2">
                <DifficultyBadge difficulty={problem.difficulty} />
                <span className="font-mono text-[11px] text-zinc-600">{problem.topics.join(" · ")}</span>
              </div>
              <h2 className="mb-3 text-lg font-bold">{problem.title}</h2>
              <div className="space-y-3">
                {problem.statement.split("\n\n").map((para, i) => (
                  <p key={i} className="text-sm leading-relaxed text-zinc-300">
                    <RichText text={para} />
                  </p>
                ))}
              </div>
              <div className="mt-4 space-y-2.5">
                {problem.examples.map((ex, i) => (
                  <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                    <p className="font-mono text-[11px] text-zinc-500">
                      <span className="text-emerald-400">in</span> {ex.input}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-zinc-500">
                      <span className="text-amber-400">out</span> {ex.output}
                    </p>
                    {ex.explanation && <p className="mt-1.5 text-[11px] text-zinc-600">{ex.explanation}</p>}
                  </div>
                ))}
              </div>
              <ul className="mt-3 space-y-1">
                {problem.constraints.map((c, i) => (
                  <li key={i} className="font-mono text-[11px] text-zinc-500">
                    · {c}
                  </li>
                ))}
              </ul>
            </section>

            {/* Opponent live feed */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="mb-2.5 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">
                  <Eye className="h-3.5 w-3.5" /> {bot.name}&apos;s feed
                </h3>
                <span className="flex items-center gap-1.5 font-mono text-[10px] text-red-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" /> LIVE
                </span>
              </div>
              <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-700"
                  style={{ width: `${(botTests / problem.tests.length) * 100}%` }}
                />
              </div>
              <div className="cc-scroll-thin max-h-36 space-y-1.5 overflow-y-auto pr-1">
                {botLog.length === 0 && (
                  <p className="py-3 text-center font-mono text-xs text-zinc-600">{bot.name} is reading the problem…</p>
                )}
                {[...botLog].reverse().map((ev, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-3 py-1.5 font-mono text-[11px]",
                      ev.solve
                        ? "border-red-500/40 bg-red-500/10 text-red-300"
                        : "border-zinc-800 bg-zinc-950/60 text-zinc-400"
                    )}
                  >
                    <span>{ev.label}</span>
                    <span className="text-zinc-600">{formatDuration(ev.t)}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right: editor + judge */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-xs text-zinc-500">
                  {langDef.file} <span className="text-zinc-700">· Ctrl+Enter submits</span>
                </span>
                <LangPicker value={language} onChange={switchLanguage} compact />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => submit(false)}
                  disabled={running}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3.5 font-mono text-xs text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100 disabled:opacity-50"
                >
                  <Play className="h-3.5 w-3.5" /> run
                </button>
                <button
                  onClick={() => submit(true)}
                  disabled={running}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-500 px-4 font-mono text-xs font-bold text-zinc-950 transition-all hover:bg-emerald-400 disabled:opacity-50"
                >
                  {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Swords className="h-3.5 w-3.5" />}
                  {running ? "judging…" : "submit"}
                </button>
              </div>
            </div>

            <CodeEditor value={code} onChange={setCode} onSubmit={() => submit(true)} minHeight={260} language={language} />

            {result && (
              <div className="cc-rise rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                {result.compileError ? (
                  <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-3">
                    <p className="font-mono text-xs font-bold uppercase tracking-wider text-red-400">
                      {result.language === "py" ? "syntax error" : "compile error"}
                    </p>
                    <pre className="cc-scroll-thin mt-1.5 max-h-32 overflow-auto whitespace-pre-wrap font-mono text-xs text-red-300">
                      {result.compileError}
                    </pre>
                    {result.suggestion && (
                      <p className="mt-2 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 font-mono text-[11px] leading-relaxed text-amber-300">
                        <WandSparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>
                          <span className="font-bold">judge suggestion:</span> {result.suggestion}
                        </span>
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="mb-2.5 flex items-center justify-between">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 font-mono text-sm font-bold",
                          result.ok ? "text-emerald-400" : "text-amber-400"
                        )}
                      >
                        {result.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                        {result.passed}/{result.total} tests
                      </span>
                      <span className="font-mono text-[11px] text-zinc-600">{result.timeMs}ms</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {result.results.map((r, i) => (
                        <span
                          key={i}
                          title={r.passed ? "passed" : r.error ?? "wrong answer"}
                          className={cn(
                            "h-6 w-6 rounded font-mono text-[10px] font-bold leading-6 text-center",
                            r.passed ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                          )}
                        >
                          {i + 1}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {errors.length > 0 && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-3.5 py-2.5">
                <p className="font-mono text-[11px] text-amber-300/80">
                  runtime noise this match: {errors[errors.length - 1]}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "finished" && bot && problem) {
    const won = outcome?.result === "WIN";
    return (
      <div className="mx-auto max-w-4xl">
        <div
          className={cn(
            "cc-rise rounded-2xl border p-6 text-center sm:p-8",
            won ? "border-emerald-500/40 bg-emerald-500/10" : outcome?.result === "LOSS" ? "border-red-500/40 bg-red-500/10" : "border-zinc-700 bg-zinc-800/40"
          )}
        >
          <h2
            className={cn(
              "flex items-center justify-center gap-2.5 text-3xl font-black tracking-tight sm:text-4xl",
              won ? "text-emerald-400" : outcome?.result === "LOSS" ? "text-red-400" : "text-zinc-200"
            )}
          >
            {won ? <Trophy className="h-8 w-8" /> : outcome?.result === "LOSS" ? <Skull className="h-8 w-8" /> : null}
            {outcome ? (won ? "VICTORY" : outcome.result === "LOSS" ? "DEFEAT" : "DRAW") : "RECORDING…"}
          </h2>
          {liveMatch && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-3.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-red-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" /> live human match
            </p>
          )}
          {outcome && (
            <>
              <p className="mt-2 text-sm text-zinc-300">{outcome.reason}</p>
              <p className="mt-1 font-mono text-xs text-zinc-500">
                vs <span className="text-zinc-300">{bot.name}</span> ({bot.rating}) · {problem.title} ·{" "}
                {formatDuration(outcome.stats.elapsed)}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-8">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">rating</p>
                  <p className="mt-1 font-mono text-3xl font-bold text-zinc-100">
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
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">xp earned</p>
                  <p className="mt-1 font-mono text-3xl font-bold text-amber-400">+{outcome.xpEarned}</p>
                </div>
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">coins earned</p>
                  <p className="mt-1 inline-flex items-center gap-2 font-mono text-3xl font-bold text-amber-300">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-amber-400/80 bg-gradient-to-br from-amber-300 to-amber-600 font-mono text-[9px] font-black text-amber-950" aria-hidden>C</span>
                    +{outcome.coinsEarned}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">new rank</p>
                  <div className="mt-2 flex justify-center">
                    <RankBadge rating={outcome.newRating} showRating />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {outcome && (
          <>
          {outcome.tournament && (
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
                {outcome.tournament.status === "CHAMPION" ? (
                  <Crown className="h-6 w-6 text-amber-400" />
                ) : (
                  <Trophy className="h-5 w-5 text-zinc-400" />
                )}
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
                    {outcome.tournament.placement
                      ? `final placement: #${outcome.tournament.placement} · `
                      : ""}
                    tournament bonus: <span className="font-bold text-amber-400">+{outcome.tournament.xpBonus} XP</span>
                  </p>
                </div>
              </div>
              <Link to={`/app/tournaments/${outcome.tournamentSlug}`}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-600 bg-zinc-900/60 px-3.5 font-mono text-xs font-bold text-zinc-200 transition-colors hover:border-amber-500/50 hover:text-amber-300"
              >
                <Crown className="h-3.5 w-3.5" /> back to bracket
              </Link>
            </div>
          )}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                [`${outcome.stats.userTests}/${outcome.stats.totalTests}`, "your tests", "text-emerald-400"],
                [`${outcome.stats.botTests}/${outcome.stats.totalTests}`, `${bot.name}'s tests`, "text-amber-400"],
                [`${outcome.stats.submissions}`, "your submissions", "text-zinc-300"],
                [outcome.stats.userSolvedAt !== null ? formatDuration(outcome.stats.userSolvedAt) : "—", "solve time", "text-zinc-300"],
              ].map(([v, l, c]) => (
                <div key={l} className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-center">
                  <div className={cn("font-mono text-xl font-bold", c)}>{v}</div>
                  <div className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-500">{l}</div>
                </div>
              ))}
            </div>

            {/* Solutions side by side */}
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div>
                <h3 className="mb-2 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">
                  <PlayerAvatar name={user.username} size="sm" /> your final solution
                </h3>
                <CodeBlock
                  code={outcome.finalCode || "// no code submitted"}
                  title={`you.${outcome.language === "cpp" ? "cpp" : outcome.language === "py" ? "py" : outcome.language === "java" ? "java" : "js"}`}
                  maxHeight={320}
                />
              </div>
              {liveMatch ? (
                <div className="flex items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 p-6 text-center">
                  <div>
                    <Eye className="mx-auto h-5 w-5 text-zinc-600" />
                    <p className="mt-2 font-mono text-xs text-zinc-500">
                      {bot.name}&apos;s solution stays hidden in live matches —
                      their submission feed above tells the story.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="mb-2 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">
                    <PlayerAvatar name={bot.name} size="sm" isBot color={bot.color} /> {bot.name}&apos;s solution
                  </h3>
                  <CodeBlock
                    code={
                      outcome.language === "js" || !getProblemLang(problem.slug)
                        ? problem.solution
                        : getProblemLang(problem.slug)!.solution[outcome.language as "cpp" | "py" | "java"]
                    }
                    title={`${bot.name}.${outcome.language === "cpp" ? "cpp" : outcome.language === "py" ? "py" : outcome.language === "java" ? "java" : "js"}`}
                    maxHeight={320}
                  />
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
              <h3 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">match timeline</h3>
              <ol className="cc-scroll-thin max-h-56 space-y-1.5 overflow-y-auto pr-1">
                {outcome.stats.botEvents.map((ev, i) => (
                  <li key={i} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-1.5 font-mono text-[11px] text-zinc-400">
                    <span>
                      <span className="text-amber-400">{bot.name}</span> — {ev.label}
                    </span>
                    <span className="text-zinc-600">{formatDuration(ev.t)}</span>
                  </li>
                ))}
                {outcome.stats.userSolvedAt !== null && (
                  <li className="flex items-center justify-between rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 font-mono text-[11px] text-emerald-300">
                    <span>
                      <span className="font-bold">{user.username}</span> — ACCEPTED
                    </span>
                    <span>{formatDuration(outcome.stats.userSolvedAt)}</span>
                  </li>
                )}
              </ol>
            </div>
          </>
        )}

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
                  setResult(null);
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
                    setResult(null);
                    setLiveMatch(false);
                    findMatch();
                  }}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-red-500/50 bg-red-500/10 px-5 font-mono text-sm font-bold text-red-400 transition-all hover:bg-red-500/20"
                >
                  <Swords className="h-4 w-4" /> queue another live match
                </button>
              ) : (
                <button
                  onClick={rematch}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-red-500/50 bg-red-500/10 px-5 font-mono text-sm font-bold text-red-400 transition-all hover:bg-red-500/20"
                >
                  <Swords className="h-4 w-4" /> rematch {bot.name}
                </button>
              )}
            </>
          )}
          <Link to="/app/history"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/60 px-5 font-mono text-sm text-zinc-300 transition-colors hover:border-zinc-500"
          >
            <Eye className="h-4 w-4" /> match history
          </Link>
          <Link to="/app/practice"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/60 px-5 font-mono text-sm text-zinc-300 transition-colors hover:border-zinc-500"
          >
            <Flame className="h-4 w-4" /> practice this topic
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
