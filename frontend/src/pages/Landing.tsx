import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  ChevronRight,
  Code2,
  Crosshair,
  Crown,
  Flame,
  Gauge,
  GraduationCap,
  Lightbulb,
  LineChart,
  Target,
  TrendingUp,
  Trophy,
  Zap,
  Swords,
} from "lucide-react";
import { Logo } from "@/components/game/logo";
import { TypingTerminal } from "@/components/game/typing-terminal";
import { RankBadge } from "@/components/game/rank-badge";
import { RANKS } from "@/lib/game";
import { LANGUAGES } from "@/lib/languages";
import { TOURNAMENTS } from "@/lib/data/tournaments";

const LOOP = [
  { icon: BookOpen, name: "Learn", desc: "Interactive lessons with live visualizations" },
  { icon: Target, name: "Practice", desc: "Judge-backed problems, no pressure" },
  { icon: Swords, name: "Compete", desc: "1v1 ladder battles & knockout cups" },
  { icon: LineChart, name: "Analyze", desc: "Full post-match breakdowns" },
  { icon: TrendingUp, name: "Improve", desc: "Target your weak categories" },
  { icon: Trophy, name: "Rank Up", desc: "Climb from Bronze to Grandmaster" },
];

const MODES = [
  {
    icon: BookOpen,
    name: "Interactive Learning",
    tag: "FOUNDATION",
    desc: "Eight topics from Big-O to dynamic programming, taught with visualizations you can drive yourself.",
    points: ["Animated algorithm visualizers", "Knowledge checks gate progression", "XP for every completed lesson"],
  },
  {
    icon: Target,
    name: "Practice Arena",
    tag: "TRAINING",
    desc: "A real judge runs your code against full test suites — in JavaScript, C++, Python or Java — with hints and full solutions when you're stuck.",
    points: ["12 curated problems, 3 difficulties", "Per-test-case verdicts & console output", "All 4 languages, autocomplete included"],
  },
  {
    icon: Zap,
    name: "Quiz Battles",
    tag: "QUICK PLAY",
    desc: "Rapid-fire 1v1 trivia on DSA and CS fundamentals. Both accuracy and speed score — a match takes two minutes.",
    points: ["30-question live bank", "Score = correctness + response time", "Rating on the line every match"],
  },
  {
    icon: Swords,
    name: "Coding Battles",
    tag: "OPEN LADDER",
    desc: "You and an opponent get the same problem and the same clock — each in whichever of four languages you choose. First accepted solution wins; otherwise the most tests passed.",
    points: ["Live opponent test-race", "Partial credit by tests passed", "JS · C++ · Python · Java — your call"],
  },
];

export default function LandingPage() {
  const { user } = useAuth();
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/70 bg-zinc-950/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="hidden items-center gap-1 font-mono text-sm text-zinc-400 md:flex">
            <a href="#loop" className="rounded-lg px-3 py-2 transition-colors hover:bg-zinc-900 hover:text-zinc-100">
              the_loop
            </a>
            <a href="#modes" className="rounded-lg px-3 py-2 transition-colors hover:bg-zinc-900 hover:text-zinc-100">
              modes
            </a>
            <a href="#cups" className="rounded-lg px-3 py-2 transition-colors hover:bg-zinc-900 hover:text-zinc-100">
              cups
            </a>
            <a href="#ranks" className="rounded-lg px-3 py-2 transition-colors hover:bg-zinc-900 hover:text-zinc-100">
              ranks
            </a>
          </div>
          <div className="flex items-center gap-2.5">
            {user ? (
              <Link to="/app"
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-500 px-4 font-mono text-sm font-bold text-zinc-950 transition-all hover:bg-emerald-400 hover:shadow-[0_0_20px_-4px_rgba(52,211,153,0.7)]"
              >
                Enter arena <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link to="/login"
                  className="hidden h-9 items-center rounded-lg border border-zinc-700 px-4 font-mono text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100 sm:inline-flex"
                >
                  log_in
                </Link>
                <Link to="/signup"
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-500 px-4 font-mono text-sm font-bold text-zinc-950 transition-all hover:bg-emerald-400 hover:shadow-[0_0_20px_-4px_rgba(52,211,153,0.7)]"
                >
                  start_playing
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section className="cc-grid-bg cc-radial-fade relative overflow-hidden">
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-24">
            <div className="cc-rise">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs text-emerald-400">
                <Flame className="h-3.5 w-3.5" />
                the competitive DSA arena
              </span>
              <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Learn DSA.
                <br />
                Practice.
                <br />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
                  Then battle
                </span>{" "}
                someone.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
                CodeClash turns data structures and algorithms into a competitive sport. Master the theory, drill it on a
                four-language judge — then fight for rating on the open ladder, and for titles in weekly knockout cups.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to={user ? "/app" : "/signup"}
                  className="cc-pulse-glow inline-flex h-12 items-center gap-2 rounded-xl bg-emerald-500 px-6 font-mono text-base font-bold text-zinc-950 transition-all hover:bg-emerald-400"
                >
                  Enter the arena <ArrowRight className="h-5 w-5" />
                </Link>
                <a
                  href="#loop"
                  className="inline-flex h-12 items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/60 px-6 font-mono text-base text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
                >
                  how it works
                </a>
              </div>
              <p className="mt-4 font-mono text-xs text-zinc-600">no email required — guest mode + seeded demo account included</p>
              <dl className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["8", "interactive topics"],
                  ["12", "judge problems"],
                  ["4", "languages"],
                  ["3", "live cups"],
                ].map(([v, l]) => (
                  <div key={l} className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2.5">
                    <dt className="sr-only">{l}</dt>
                    <dd className="font-mono text-xl font-bold text-emerald-400">{v}</dd>
                    <dd className="mt-0.5 text-[11px] uppercase tracking-wide text-zinc-500">{l}</dd>
                  </div>
                ))}
              </dl>
              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-[11px] text-zinc-600">
                <li className="flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-400" />
                  </span>
                  <span className="text-red-400/90">live 1v1 matchmaking — real players</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-emerald-400" /> match replay theater
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-amber-400" /> coin shop — streak freezes & cosmetics
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-teal-400" /> 24 achievement trophies
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-red-400" /> weekly seasons with champions
                </li>
              </ul>
            </div>
            <div className="cc-float cc-rise" style={{ animationDelay: "0.15s" }}>
              <TypingTerminal />
            </div>
          </div>
        </section>

        {/* ── Core loop ──────────────────────────────────────────────────── */}
        <section id="loop" className="border-t border-zinc-800/70 bg-zinc-950 py-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="mb-10 max-w-2xl">
              <span className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-emerald-400">the central loop</span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">One loop. Endless ladder.</h2>
              <p className="mt-3 text-zinc-400">
                Everything on CodeClash exists to power this cycle. Learning gives you knowledge, practice turns it into
                skill, competition tests it — and analysis shows you exactly what to fix before the next fight.
              </p>
            </div>
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              {LOOP.map((step, i) => (
                <li
                  key={step.name}
                  className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 transition-all hover:border-emerald-600/40 hover:bg-zinc-900/70"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-emerald-400 transition-colors group-hover:border-emerald-600/50">
                      <step.icon className="h-5 w-5" />
                    </span>
                    <span className="font-mono text-[10px] font-bold text-zinc-600">0{i + 1}</span>
                  </div>
                  <h3 className="mt-3 font-mono text-sm font-bold text-zinc-100">{step.name}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">{step.desc}</p>
                  {i < LOOP.length - 1 && (
                    <ChevronRight className="absolute -right-2.5 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-zinc-700 lg:block" />
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Modes ──────────────────────────────────────────────────────── */}
        <section id="modes" className="border-t border-zinc-800/70 bg-zinc-950 py-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl">
                <span className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-emerald-400">game modes</span>
                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Four ways to fight</h2>
                <p className="mt-3 text-zinc-400">
                  From zero to first victory without ever leaving the platform — each mode feeds the next, and the 1v1
                  ladder is always open. For titles and prize pools, take it to the cups.
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {MODES.map((mode) => (
                <article
                  key={mode.name}
                  className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition-all hover:border-emerald-600/40 hover:bg-zinc-900/70"
                >
                  <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-emerald-500/5 blur-2xl transition-all group-hover:bg-emerald-500/10" />
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                      <mode.icon className="h-6 w-6" />
                    </span>
                    <span className="rounded-md border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest text-zinc-400">
                      {mode.tag}
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-bold">{mode.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{mode.desc}</p>
                  <ul className="mt-4 space-y-1.5">
                    {mode.points.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm text-zinc-300">
                        <Crosshair className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Battle in any language ───────────────────────────────────── */}
        <section id="languages" className="border-t border-zinc-800/70 bg-zinc-950 py-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="mb-10 max-w-2xl">
              <span className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-emerald-400">languages</span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Battle in any language</h2>
              <p className="mt-3 text-zinc-400">
                Four fully-tooled languages run on the same judge — same problems, same tests, same clock. Pick your
                weapon before every battle or practice run; every coding cup speaks all four too.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {LANGUAGES.map((l) => (
                <div
                  key={l.id}
                  className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 transition-all hover:border-zinc-600 hover:bg-zinc-900/70"
                >
                  <div className="absolute inset-x-0 top-0 h-px opacity-60" style={{ backgroundColor: l.color }} />
                  <div className="flex items-center justify-between">
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border font-mono text-xs font-black"
                      style={{ borderColor: `${l.color}59`, backgroundColor: `${l.color}14`, color: l.color }}
                    >
                      {l.short}
                    </span>
                    <span
                      className="h-2 w-2 rounded-full transition-transform group-hover:scale-125"
                      style={{ backgroundColor: l.color }}
                    />
                  </div>
                  <h3 className="mt-3 font-bold text-zinc-100">{l.name}</h3>
                  <p className="mt-1 font-mono text-[11px] leading-relaxed text-zinc-500">{l.toolchain}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                    <Code2 className="h-4.5 w-4.5" />
                  </span>
                  <h3 className="font-bold">An editor that knows the grammar</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                  Syntax highlighting, bracket matching and autocomplete — keywords and snippets that swap with your
                  language — so C++ feels as natural as JavaScript.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
                    <Lightbulb className="h-4.5 w-4.5" />
                  </span>
                  <h3 className="font-bold">Compiler errors, translated</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                  When g++, CPython or javac push back, the judge triages the stderr and suggests a plain-language fix
                  right next to the verdict — no cryptic wall of diagnostics.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Organized tournaments ─────────────────────────────────────── */}
        <section id="cups" className="border-t border-zinc-800/70 bg-zinc-950 py-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.25em] text-amber-400">
                  <Crown className="h-3.5 w-3.5" /> organized tournaments
                </span>
                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">The cups are the main event</h2>
                <p className="mt-3 text-zinc-400">
                  The 1v1 ladder stays open 24/7 — but the real glory lives on the circuit. Weekly knockout cups: eight
                  players, three rounds, difficulty that ramps every stage, XP prize pools and champion titles that
                  stick to your profile forever.
                </p>
              </div>
              <Link to="/app/tournaments"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 font-mono text-sm font-bold text-amber-300 transition-colors hover:bg-amber-500/20"
              >
                <Crown className="h-4 w-4" /> view the circuit
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {TOURNAMENTS.filter((t) => t.status === "LIVE").map((t) => (
                <article
                  key={t.slug}
                  className="group relative flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition-all hover:border-amber-500/40 hover:bg-zinc-900/70"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-amber-300">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
                      </span>
                      live now
                    </span>
                    <span className="rounded-md border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest text-zinc-400">
                      {t.format} · {t.gameType}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold">{t.name}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{t.tagline}</p>
                  <p className="mt-4 font-mono text-xs text-zinc-500">
                    {t.maxPlayers}-player knockout · {t.roundsTotal} rounds · difficulty ramps
                  </p>
                  <div className="mt-auto pt-4">
                    <p className="font-mono text-[11px] text-zinc-500">{t.startsIn}</p>
                    <p className="mt-1 font-mono text-sm">
                      <span className="font-bold text-amber-300">+{t.prizeXp.toLocaleString()} XP</span>
                      <span className="text-zinc-500"> prize pool</span>
                      {t.prizeTitle && (
                        <>
                          <span className="text-zinc-600"> · </span>
                          <span className="text-zinc-300">“{t.prizeTitle}”</span>
                          <span className="text-zinc-500"> title</span>
                        </>
                      )}
                    </p>
                  </div>
                </article>
              ))}
            </div>
            <p className="mt-6 flex flex-wrap items-center gap-2 font-mono text-xs text-zinc-500">
              <span className="text-zinc-400">the circuit:</span> weekly cups · permanent champion titles · completed
              championships archived with full standings
              <Link to="/app/tournaments"
                className="inline-flex items-center gap-1 text-amber-400 transition-colors hover:text-amber-300"
              >
                browse cups <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </p>
          </div>
        </section>

        {/* ── Ranks & progression ───────────────────────────────────────── */}
        <section id="ranks" className="border-t border-zinc-800/70 bg-zinc-950 py-20">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="mb-10 max-w-2xl">
              <span className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-emerald-400">progression</span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Two currencies. Zero confusion.</h2>
              <p className="mt-3 text-zinc-400">
                XP measures how much of the game you have played. Rating measures how well you fight. Grinding lessons
                will never inflate your competitive rank.
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
                <h3 className="mb-4 flex items-center gap-2 font-mono text-sm font-bold text-zinc-200">
                  <Gauge className="h-4 w-4 text-amber-400" /> the rating ladder
                </h3>
                <div className="space-y-2">
                  {[...RANKS].reverse().map((rank) => (
                    <div
                      key={rank.key}
                      className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2.5 transition-colors hover:border-zinc-600"
                    >
                      <RankBadge rating={Math.max(rank.min, 100)} />
                      <span className="font-mono text-xs text-zinc-500">
                        {rank.min === 0 ? `${rank.max}−` : rank.max > 9999 ? `${rank.min}+` : `${rank.min}–${rank.max}`}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs leading-relaxed text-zinc-500">
                  ELO-style matchmaking pairs you with opponents near your rating. Win as the underdog for a bigger
                  payout; lose to one and barely feel it.
                </p>
              </div>
              <div className="grid gap-4">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
                      <Brain className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-bold">XP — the learning meter</h3>
                      <p className="text-xs text-zinc-500">earned from lessons, problems and every match</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 font-mono text-sm text-zinc-400">
                    <p>
                      <span className="text-emerald-400">+75 XP</span> complete a lesson
                    </p>
                    <p>
                      <span className="text-emerald-400">+100–300 XP</span> solve a practice problem (by difficulty)
                    </p>
                    <p>
                      <span className="text-emerald-400">+50–155 XP</span> every battle you enter
                    </p>
                  </div>
                  <p className="mt-4 text-xs leading-relaxed text-zinc-500">
                    XP drives your player level — a reflection of how much of CodeClash you have conquered, competitive
                    or not.
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-400">
                      <Trophy className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-bold">Rating — the fighting record</h3>
                      <p className="text-xs text-zinc-500">moves only when you enter the arena</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center font-mono">
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-3">
                      <div className="text-lg font-bold text-emerald-400">+21</div>
                      <div className="text-[10px] uppercase tracking-wider text-zinc-500">upset win</div>
                    </div>
                    <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 py-3">
                      <div className="text-lg font-bold text-zinc-300">+9</div>
                      <div className="text-[10px] uppercase tracking-wider text-zinc-500">even win</div>
                    </div>
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 py-3">
                      <div className="text-lg font-bold text-red-400">−14</div>
                      <div className="text-[10px] uppercase tracking-wider text-zinc-500">a loss</div>
                    </div>
                  </div>
                  <p className="mt-4 text-xs leading-relaxed text-zinc-500">
                    Everyone starts at 1000. Where you go from there is entirely between you and your opponents.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Post-match analysis preview ────────────────────────────────── */}
        <section className="border-t border-zinc-800/70 bg-zinc-950 py-20">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-emerald-400">post-match analysis</span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                A battle should teach you something
              </h2>
              <p className="mt-4 text-zinc-400">
                Every match ends with more than a W or an L. Time taken, tests passed, submissions, errors, both final
                solutions, rating movement — all of it lands in your history, and your profile turns it into a skill map
                that shows exactly which categories to drill next.
              </p>
              <ul className="mt-6 space-y-2.5">
                {[
                  "See your opponent's winning solution after the match",
                  "Track accuracy and speed across quiz categories",
                  "Skill radar reveals comfort zones vs blind spots",
                ].map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-zinc-300">
                    <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="overflow-hidden rounded-2xl border border-emerald-500/30 bg-zinc-900/60 shadow-[0_0_50px_-12px_rgba(52,211,153,0.25)]">
              <div className="flex items-center justify-between border-b border-zinc-800 bg-emerald-500/10 px-5 py-3">
                <span className="font-mono text-sm font-bold text-emerald-400">VICTORY</span>
                <span className="font-mono text-sm font-bold text-emerald-300">rating +21</span>
              </div>
              <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
                {[
                  ["05:42", "time to solve"],
                  ["9/9", "tests passed"],
                  ["2", "submissions"],
                  ["0", "runtime errors"],
                ].map(([v, l]) => (
                  <div key={l} className="rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-2.5 text-center">
                    <div className="font-mono text-lg font-bold text-zinc-100">{v}</div>
                    <div className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-500">{l}</div>
                  </div>
                ))}
              </div>
              <div className="border-t border-zinc-800 px-5 py-4">
                <div className="mb-2 flex items-center justify-between font-mono text-xs text-zinc-500">
                  <span>1240</span>
                  <span>you vs dp_dragon</span>
                  <span>1288</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 flex-1 rounded-full bg-zinc-800">
                    <div className="h-full w-[48%] rounded-full bg-emerald-500" />
                  </div>
                  <span className="font-mono text-xs font-bold text-emerald-400">1261</span>
                </div>
                <div className="mt-4 flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <GraduationCap className="h-4 w-4 text-zinc-500" />
                    <span className="text-xs text-zinc-400">weak spot detected: dynamic programming</span>
                  </div>
                  <span className="font-mono text-xs text-emerald-400">drill it →</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────────────── */}
        <section className="border-t border-zinc-800/70 bg-zinc-950 px-4 py-20 sm:px-6">
          <div className="cc-radial-fade relative mx-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-emerald-500/30 bg-zinc-900/60 px-6 py-14 text-center">
            <Swords className="mx-auto h-10 w-10 text-emerald-400" />
            <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
              Your opponent is already waiting
            </h2>
            <p className="mx-auto mt-3 max-w-md text-zinc-400">
              Create a free account — or jump in as a guest — and play your first quiz battle in under two minutes.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to={user ? "/app" : "/signup"}
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-emerald-500 px-7 font-mono text-base font-bold text-zinc-950 transition-all hover:bg-emerald-400 hover:shadow-[0_0_28px_-4px_rgba(52,211,153,0.8)]"
              >
                create account <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to={user ? "/app" : "/login"}
                className="inline-flex h-12 items-center rounded-xl border border-zinc-700 bg-zinc-900/60 px-7 font-mono text-base text-zinc-300 transition-colors hover:border-zinc-500"
              >
                play as guest
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-zinc-800/70 bg-zinc-950">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-500">
              Learn DSA. Practice DSA. Challenge someone. Improve. Challenge stronger opponents.
            </p>
          </div>
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400">play</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-500">
              <li>
                <Link to="/app/learn" className="transition-colors hover:text-emerald-400">
                  Learn
                </Link>
              </li>
              <li>
                <Link to="/app/practice" className="transition-colors hover:text-emerald-400">
                  Practice
                </Link>
              </li>
              <li>
                <Link to="/app/game/quiz" className="transition-colors hover:text-emerald-400">
                  Quiz battles
                </Link>
              </li>
              <li>
                <Link to="/app/game/battle" className="transition-colors hover:text-emerald-400">
                  Coding battles
                </Link>
              </li>
              <li>
                <Link to="/app/tournaments" className="transition-colors hover:text-emerald-400">
                  Tournaments
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-400">game</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-500">
              <li>
                <Link to="/app/leaderboard" className="transition-colors hover:text-emerald-400">
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link to="/app/history" className="transition-colors hover:text-emerald-400">
                  Match history
                </Link>
              </li>
              <li>
                <Link to="/app/profile" className="transition-colors hover:text-emerald-400">
                  Profile & skills
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-zinc-800/70">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-5 sm:px-6">
            <p className="font-mono text-xs text-zinc-600">© 2025 CodeClash — product demo</p>
            <p className="font-mono text-xs text-zinc-600">matchmaking pairs you with AI-driven opponents</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
