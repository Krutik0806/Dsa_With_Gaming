
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Crown,
  History,
  Minus,
  PlayCircle,
  Swords,
  Target,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { PlayerAvatar } from "@/components/game/player-avatar";
import { RankBadge } from "@/components/game/rank-badge";
import { XPBar } from "@/components/game/xp-bar";
import { DifficultyBadge } from "@/components/game/difficulty-badge";
import { DailyHub } from "@/components/game/daily-hub";
import { SeasonChip } from "@/components/game/season-chip";
import { LiveArenaStrip } from "@/components/game/live-arena-strip";
import { EloBreakdownModal } from "@/components/game/elo-breakdown-modal";
import { getRank } from "@/lib/game";
import { timeAgo } from "@/lib/format";
import type { MatchSummary, ProgressResponse, TournamentListResponse } from "@/lib/types";

const LOOP = ["Learn", "Practice", "Compete", "Analyze", "Improve", "Rank Up"];

const QUICK_ACTIONS = [
  {
    href: "/app/learn",
    icon: BookOpen,
    title: "Learn",
    desc: "Interactive lessons from Big-O to dynamic programming",
    accent: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  },
  {
    href: "/app/practice",
    icon: Target,
    title: "Practice",
    desc: "Judge-backed problems with hints and solutions",
    accent: "text-teal-300 border-teal-400/30 bg-teal-500/10",
  },
  {
    href: "/app/game/quiz",
    icon: Zap,
    title: "Quiz Battle",
    desc: "Rapid-fire 1v1 trivia — two minutes per match",
    accent: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  },
  {
    href: "/app/game/battle",
    icon: Swords,
    title: "Coding Battle",
    desc: "Same problem, same clock, first accepted solution wins",
    accent: "text-red-400 border-red-500/30 bg-red-500/10",
  },
];

export default function DashboardPage() {
  const { user: userRaw } = useAuth(); const user = userRaw!;
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [matches, setMatches] = useState<MatchSummary[] | null>(null);
  const [cups, setCups] = useState<TournamentListResponse | null>(null);
  const [eloModalOpen, setEloModalOpen] = useState(false);

  useEffect(() => {
    api.get("/progress").then(r=>r.data)
      .then(setProgress)
      .catch(() => setProgress({ lessons: [], problems: [], dailyDone: false }));
    api.get("/match").then(r=>r.data)
      .then((d) => setMatches(d.matches ?? []))
      .catch(() => setMatches([]));
    api.get("/tournaments").then(r=>r.data)
      .then((d) => setCups(d))
      .catch(() => setCups({ tournaments: [], entries: {} })); // strip hides silently on error
  }, []);

  const rank = getRank(user.rating);
  const totalMatches = user.wins + user.losses + user.draws;
  const winrate = totalMatches > 0 ? Math.round((user.wins / totalMatches) * 100) : 0;

  const lessonsDone = progress?.lessons.length ?? 0;
  const problemsDone = progress?.problems.length ?? 0;

  const stage = lessonsDone === 0 ? 0 : problemsDone === 0 ? 1 : totalMatches === 0 ? 2 : 3;

  const liveCups = (cups?.tournaments ?? []).filter((t) => t.status === "LIVE");
  const openCup = liveCups.find((t) => cups !== null && !(t.slug in cups.entries));

  const recommendation =
    lessonsDone === 0
      ? { text: "You're new — start with the Big-O lesson and earn your first XP.", href: "/app/learn", cta: "Start learning" }
      : lessonsDone < 8
        ? { text: `You've completed ${lessonsDone}/8 lessons. Finish the curriculum to unlock your full skill map.`, href: "/app/learn", cta: "Continue learning" }
        : problemsDone === 0
          ? { text: "Theory looks good. Time to solve your first practice problem.", href: "/app/practice", cta: "Open practice" }
          : totalMatches === 0
            ? { text: "You're trained and ready. Your first battle is one click away.", href: "/app/game/battle", cta: "Find a battle" }
            : matches && matches[0]?.result === "LOSS"
              ? { text: "Last match didn't go your way — check the analysis to see what broke.", href: "/app/history", cta: "Review analysis" }
              : openCup
                ? {
                    text: `You're on a roll — carry it into ${openCup.name}: ${openCup.maxPlayers}-player knockout, +${openCup.prizeXp.toLocaleString()} XP on the line.`,
                    href: "/app/tournaments",
                    cta: "Enter the cup",
                  }
                : { text: "You're on a roll — the arena is waiting for your next victim.", href: "/app/game/battle", cta: "Queue up again" };

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome back, <span className="font-mono text-emerald-400">{user.username}</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {totalMatches === 0 ? "The arena awaits your debut." : `${rank.name} division · ${user.rating} rating`}
          </p>
        </div>
        <Link to="/app/game/battle"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-500 px-5 font-mono text-sm font-bold text-zinc-950 transition-all hover:bg-emerald-400 hover:shadow-[0_0_20px_-4px_rgba(52,211,153,0.6)]"
        >
          <Swords className="h-4 w-4" /> find a battle
        </Link>
      </div>

      {/* Live arena presence */}
      <LiveArenaStrip />

      {/* Player card */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <PlayerAvatar name={user.username} size="xl" frame={user.equippedFrame} />
            <div>
              <p className="font-mono text-lg font-bold">{user.username}</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                joined {new Date(user.createdAt).toLocaleDateString()} {user.isGuest && "· guest"}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEloModalOpen(true)}
                  className="hover:opacity-85 transition-opacity text-left cursor-pointer"
                  title="Inspect ELO Standing"
                >
                  <RankBadge rating={user.rating} showRating />
                </button>
                <button
                  type="button"
                  onClick={() => setEloModalOpen(true)}
                  className="rounded-lg border border-zinc-800 bg-zinc-800/60 px-2 py-0.5 text-[10.5px] font-mono text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors cursor-pointer"
                >
                  Inspect ELO
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1 sm:px-6">
            <XPBar xp={user.xp} />
            <div className="mt-4 grid grid-cols-3 gap-2 text-center font-mono sm:grid-cols-4">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 py-2.5">
                <div className="text-lg font-bold text-emerald-400">{user.wins}</div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">wins</div>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 py-2.5">
                <div className="text-lg font-bold text-red-400">{user.losses}</div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">losses</div>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 py-2.5">
                <div className="text-lg font-bold text-zinc-300">{winrate}%</div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">win rate</div>
              </div>
              <Link to="/app/shop"
                title="spend coins in the arena shop"
                className="group rounded-xl border border-amber-500/25 bg-amber-500/5 py-2.5 transition-colors hover:border-amber-500/50 hover:bg-amber-500/10"
              >
                <div className="inline-flex items-center justify-center gap-1.5 text-lg font-bold text-amber-300">
                  <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-amber-400/80 bg-gradient-to-br from-amber-300 to-amber-600 font-mono text-[7px] font-black text-amber-950" aria-hidden>C</span>
                  {(user.coins ?? 0).toLocaleString()}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 group-hover:text-amber-400/80">coins → shop</div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Today in the arena: streak + daily challenge */}
      <DailyHub progress={progress} />

      {/* Core loop + recommendation */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">the loop</h2>
          <span className="font-mono text-xs text-emerald-400">you are here → {LOOP[stage].toLowerCase()}</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {LOOP.map((step, i) => (
            <div
              key={step}
              className={`rounded-xl border px-2 py-2.5 text-center font-mono text-xs transition-all ${
                i === stage
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                  : i < stage
                    ? "border-zinc-700 bg-zinc-800/50 text-zinc-400"
                    : "border-zinc-800 bg-zinc-950/40 text-zinc-600"
              }`}
            >
              {step}
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3">
          <p className="text-sm text-zinc-300">{recommendation.text}</p>
          <Link to={recommendation.href}
            className="inline-flex items-center gap-1.5 font-mono text-sm font-bold text-emerald-400 transition-colors hover:text-emerald-300"
          >
            {recommendation.cta} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Quick actions */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_ACTIONS.map((a) => (
          <Link
            key={a.title}
            to={a.href}
            className="group rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 transition-all hover:-translate-y-0.5 hover:border-zinc-600 hover:bg-zinc-900/70"
          >
            <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${a.accent}`}>
              <a.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-3 font-bold">{a.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">{a.desc}</p>
            <span className="mt-3 inline-flex items-center gap-1 font-mono text-xs text-zinc-600 transition-colors group-hover:text-emerald-400">
              enter <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </section>

      {/* Live cups strip */}
      {(cups === null || liveCups.length > 0) && (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
              <Crown className="h-3.5 w-3.5 text-amber-400" /> live cups
            </h2>
            <div className="flex items-center gap-3">
              <SeasonChip compact />
              <Link to="/app/tournaments" className="font-mono text-xs text-amber-400 transition-colors hover:text-amber-300">
                full circuit →
              </Link>
            </div>
          </div>
          {cups === null ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="cc-shimmer h-32 w-full rounded-xl" />
              <div className="cc-shimmer h-32 w-full rounded-xl" />
              <div className="cc-shimmer h-32 w-full rounded-xl" />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {liveCups.map((t) => {
                const entry = cups.entries[t.slug];
                return (
                  <Link
                    key={t.slug}
                    to={`/app/tournaments/${t.slug}`}
                    className="group rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 transition-all hover:-translate-y-0.5 hover:border-amber-500/40 hover:bg-zinc-900/70"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-amber-300">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
                        </span>
                        live
                      </span>
                      <span className="truncate font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        {t.format} · {t.gameType}
                      </span>
                    </div>
                    <h3 className="mt-2.5 font-bold text-zinc-100 transition-colors group-hover:text-amber-200">{t.name}</h3>
                    <p className="mt-0.5 font-mono text-[11px] text-zinc-600">
                      {t.maxPlayers}-player {t.format.toLowerCase()} · {t.roundsTotal} {t.roundsTotal === 1 ? "round" : "rounds"}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-amber-300">+{t.prizeXp.toLocaleString()} XP pool</span>
                      {entry === "ACTIVE" ? (
                        <span className="shrink-0 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-emerald-300">
                          in bracket
                        </span>
                      ) : entry === "CHAMPION" ? (
                        <span className="shrink-0 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-amber-300">
                          champion
                        </span>
                      ) : entry === "ELIMINATED" ? (
                        <span className="shrink-0 rounded-md border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-zinc-400">
                          eliminated
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-600 transition-colors group-hover:text-zinc-400">
                          open entry →
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Recent matches + progress snapshot */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">recent battles</h2>
            <Link to="/app/history" className="font-mono text-xs text-emerald-400 hover:text-emerald-300">
              view all →
            </Link>
          </div>
          {matches === null ? (
            <div className="space-y-2">
              <div className="cc-shimmer h-14 w-full rounded-xl" />
              <div className="cc-shimmer h-14 w-full rounded-xl" />
              <div className="cc-shimmer h-14 w-full rounded-xl" />
            </div>
          ) : matches.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <History className="h-8 w-8 text-zinc-700" />
              <p className="mt-3 text-sm text-zinc-500">No battles yet — your history starts with the first one.</p>
              <Link to="/app/game/quiz"
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 font-mono text-xs font-bold text-emerald-400 transition-colors hover:bg-emerald-500/20"
              >
                <Zap className="h-3.5 w-3.5" /> play a quiz battle
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {matches.slice(0, 5).map((m) => (
                <li key={m.id} className="group/row flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950/50 transition-all hover:border-zinc-600 hover:bg-zinc-900/70">
                  <Link to={`/app/history/${m.id}`} className="flex min-w-0 flex-1 items-center gap-3 px-3.5 py-3" aria-label={`Match vs ${m.opponentName} analysis`}>
                    <span
                      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        m.result === "WIN"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : m.result === "LOSS"
                            ? "bg-red-500/15 text-red-400"
                            : "bg-zinc-700/40 text-zinc-300"
                      }`}
                    >
                      {m.result === "WIN" ? <Trophy className="h-4 w-4" /> : m.result === "LOSS" ? <X className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                    </span>
                    <span className="shrink-0 text-zinc-500">
                      {m.type === "QUIZ" ? <Zap className="h-4 w-4" /> : <Swords className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-sm text-zinc-200">
                        vs <span className="font-bold">{m.opponentName}</span>
                      </p>
                      <p className="truncate text-xs text-zinc-600">
                        {m.type === "QUIZ" ? "quiz battle" : m.problemTitle} · {timeAgo(m.createdAt)}
                      </p>
                    </div>
                    <div className="text-right font-mono">
                      <p className="text-sm text-zinc-300">
                        {m.score} <span className="text-zinc-600">:</span> {m.opponentScore}
                      </p>
                      <p className={`text-xs font-bold ${m.ratingChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {m.ratingChange >= 0 ? "+" : ""}
                        {m.ratingChange}
                      </p>
                    </div>
                  </Link>
                  <Link to={`/app/history/${m.id}?replay=1`}
                    className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-500 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-400"
                    aria-label={`Watch replay vs ${m.opponentName}`}
                    title="watch replay"
                  >
                    <PlayCircle className="h-4 w-4" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
            <h2 className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">curriculum</h2>
            {progress === null ? (
              <div className="cc-shimmer h-24 w-full rounded-xl" />
            ) : (
              <div className="space-y-5">
                <div>
                  <div className="mb-1.5 flex items-center justify-between font-mono text-xs">
                    <span className="text-zinc-400">lessons completed</span>
                    <span className="font-bold text-emerald-400">
                      {lessonsDone}/8
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(lessonsDone / 8) * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between font-mono text-xs">
                    <span className="text-zinc-400">problems solved</span>
                    <span className="font-bold text-amber-400">
                      {problemsDone}/12
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                    <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${(problemsDone / 12) * 100}%` }} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["EASY", "MEDIUM", "HARD"].map((d) => (
                    <DifficultyBadge key={d} difficulty={d as "EASY" | "MEDIUM" | "HARD"} />
                  ))}
                  <span className="font-mono text-[11px] text-zinc-600">— three tiers of pain</span>
                </div>
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
            <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">season 1</h2>
            <p className="font-mono text-sm text-zinc-400">
              rating <span className="font-bold text-zinc-100">{user.rating}</span> / {rank.max > 9999 ? "∞" : rank.max}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, ((user.rating - rank.min) / Math.max(1, Math.min(rank.max, 9999) - rank.min)) * 100)}%`,
                  backgroundColor: rank.color,
                }}
              />
            </div>
            <p className="mt-2 font-mono text-[11px] text-zinc-600">
              {Math.max(0, Math.min(rank.max, 9999) - user.rating)} rating until promotion
            </p>
          </div>
        </div>
      </section>

      <EloBreakdownModal
        isOpen={eloModalOpen}
        onClose={() => setEloModalOpen(false)}
        userRating={user.rating}
        userName={user.username}
      />
    </div>
  );
}
