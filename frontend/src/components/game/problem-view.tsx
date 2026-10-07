
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  Circle,
  Flame,
  KeyRound,
  Lightbulb,
  Loader2,
  Play,
  RotateCcw,
  Terminal,
  WandSparkles,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { CodeEditor } from "@/components/game/code-editor";
import { DifficultyBadge } from "@/components/game/difficulty-badge";
import { LangPicker } from "@/components/game/lang-picker";
import { CodeBlock } from "@/components/game/code-block";
import { useAuth } from "@/lib/auth-context";
import { getProblem, PROBLEMS } from "@/lib/data/problems";
import { getProblemLang } from "@/lib/data/problem-langs";
import { playSound } from "@/lib/sound";
import { dailyProblem } from "@/lib/daily";
import { getLang, type LangId } from "@/lib/languages";
import type { CodeRunResponse } from "@/lib/types";
import { formatValue } from "@/lib/format";
import { cn } from "@/lib/utils";

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
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
  });
}

export function ProblemView({ slug, alreadySolved }: { slug: string; alreadySolved: boolean }) {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const problem = getProblem(slug)!;
  const pl = getProblemLang(slug);
  const [language, setLanguage] = useState<LangId>("js");
  // Preferred language persists across practice and battles.
  useEffect(() => {
    const saved = window.localStorage.getItem("cc-lang");
    if (saved && saved !== "js" && ["js", "cpp", "py", "java"].includes(saved)) {
      setLanguage(saved as LangId);
      setCode(starterFor(saved as LangId));
    }
     
  }, []);
  // Per-language working drafts so switching never loses code.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const starterFor = (lang: LangId) =>
    lang === "js" ? problem.starterCode : pl ? pl.starter[lang] : problem.starterCode;
  const [code, setCode] = useState(problem.starterCode);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<CodeRunResponse | null>(null);
  const [solved, setSolved] = useState(alreadySolved);
  const [justSolved, setJustSolved] = useState(false);
  const [earned, setEarned] = useState<{ xp: number; daily: number } | null>(null);
  const [hintsShown, setHintsShown] = useState(0);
  const [confirmSolution, setConfirmSolution] = useState(false);
  const [solutionShown, setSolutionShown] = useState(false);

  const switchLanguage = (lang: LangId) => {
    if (lang === language) return;
    setDrafts((d) => ({ ...d, [language]: code }));
    setLanguage(lang);
    window.localStorage.setItem("cc-lang", lang);
    setCode(drafts[lang] ?? starterFor(lang));
    setResult(null);
  };

  const langDef = getLang(language);

  const nextProblem = useMemo(() => PROBLEMS.find((p) => p.slug !== slug), [slug]);
  const runCount = result ? 1 : 0;

  const run = async () => {
    if (running) return;
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, code, language }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Judge error");
        return;
      }
      const data: CodeRunResponse = await res.json();
      setResult(data);
      if (data.compileError) playSound("wrong");
      if (data.ok && !solved) {
        const prog = await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "PROBLEM", refId: slug }),
        });
        if (prog.ok) {
          const progData = await prog.json();
          if (progData.user) setUser(progData.user);
          setSolved(true);
          setJustSolved(true);
          setEarned({ xp: progData.xpEarned ?? 0, daily: progData.dailyBonus ?? 0 });
          playSound("victory");
          const daily = dailyProblem().slug === slug && progData.dailyBonus > 0;
          const coins = progData.coinsEarned ?? 0;
          toast.success(
            `Accepted — +${progData.xpEarned}${daily ? ` +${progData.dailyBonus} daily bonus` : ""} XP${coins > 0 ? ` · +${coins} coins` : ""}`,
            {
              description: daily
                ? `${problem.title} was today's challenge — double XP banked.`
                : `${problem.title} conquered.`,
            }
          );
          // router.refresh() no-op in React;
        }
      }
    } catch {
      toast.error("Network error — the judge is unreachable.");
    } finally {
      setRunning(false);
    }
  };

  const xpForProblem = problem.difficulty === "EASY" ? 100 : problem.difficulty === "MEDIUM" ? 200 : 300;

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/app/practice"
            className="mb-3 inline-flex items-center gap-1.5 font-mono text-xs text-zinc-500 transition-colors hover:text-emerald-400"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> practice
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{problem.title}</h1>
            <DifficultyBadge difficulty={problem.difficulty} />
            {dailyProblem().slug === slug && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-amber-300">
                <Flame className="cc-flame h-3 w-3" /> today&apos;s challenge · 2× XP
              </span>
            )}
            {solved && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> solved
              </span>
            )}
          </div>
          <p className="mt-1 font-mono text-xs text-zinc-600">{problem.topics.join(" · ")}</p>
        </div>
        <span className="rounded-lg border border-emerald-600/30 bg-emerald-950/40 px-3 py-1.5 font-mono text-xs font-bold text-emerald-400">
          +{xpForProblem} XP
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Left: statement */}
        <div className="space-y-5">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">problem</h2>
            <div className="space-y-3">
              {problem.statement.split("\n\n").map((para, i) => (
                <p key={i} className="text-[15px] leading-relaxed text-zinc-300">
                  {renderInline(para)}
                </p>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">examples</h2>
            <div className="space-y-3">
              {problem.examples.map((ex, i) => (
                <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5">
                  <p className="font-mono text-xs text-zinc-500">
                    <span className="text-emerald-400">input</span> <span className="text-zinc-300">{ex.input}</span>
                  </p>
                  <p className="mt-1.5 font-mono text-xs text-zinc-500">
                    <span className="text-amber-400">output</span> <span className="text-zinc-300">{ex.output}</span>
                  </p>
                  {ex.explanation && <p className="mt-2 text-xs leading-relaxed text-zinc-500">{ex.explanation}</p>}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">constraints</h2>
            <ul className="space-y-1.5">
              {problem.constraints.map((c, i) => (
                <li key={i} className="font-mono text-xs text-zinc-400">
                  · {c}
                </li>
              ))}
            </ul>
          </section>

          {/* Hints */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h2 className="mb-3 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">
              <Lightbulb className="h-3.5 w-3.5 text-amber-400" /> hints
            </h2>
            <div className="space-y-2">
              {problem.hints.slice(0, hintsShown).map((hint, i) => (
                <div key={i} className="cc-rise rounded-xl border border-amber-500/20 bg-amber-500/5 px-3.5 py-2.5 text-sm text-zinc-300">
                  <span className="mr-1.5 font-mono text-[11px] font-bold text-amber-400">HINT {i + 1}</span>
                  {hint}
                </div>
              ))}
              {hintsShown < problem.hints.length ? (
                <button
                  onClick={() => setHintsShown((h) => h + 1)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 font-mono text-xs text-zinc-400 transition-colors hover:border-amber-500/40 hover:text-amber-400"
                >
                  <KeyRound className="h-3.5 w-3.5" /> reveal hint {hintsShown + 1}/{problem.hints.length}
                </button>
              ) : (
                <p className="font-mono text-xs text-zinc-600">all hints revealed — you&apos;ve got this</p>
              )}
            </div>
          </section>
        </div>

        {/* Right: editor + judge */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-2 font-mono text-xs text-zinc-500">
                <Terminal className="h-3.5 w-3.5" />
                {langDef.file}
              </span>
              <LangPicker value={language} onChange={switchLanguage} compact />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCode(starterFor(language))}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 font-mono text-xs text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
              >
                <RotateCcw className="h-3.5 w-3.5" /> reset
              </button>
              <button
                onClick={run}
                disabled={running}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-500 px-4 font-mono text-xs font-bold text-zinc-950 transition-all hover:bg-emerald-400 disabled:opacity-50"
              >
                {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                {running ? (language === "java" ? "compiling…" : "judging…") : "run tests"}
              </button>
            </div>
          </div>

          <CodeEditor value={code} onChange={setCode} onSubmit={run} minHeight={300} language={language} />

          {/* Judge output */}
          {result && (
            <div className="cc-rise rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
              {result.compileError ? (
                <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-3.5">
                  <p className="mb-1.5 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-red-400">
                    <XCircle className="h-3.5 w-3.5" /> {result.language === "py" ? "syntax error" : "compile error"}
                  </p>
                  <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-red-300">
                    {result.compileError}
                  </pre>
                  {result.suggestion && (
                    <p className="mt-2.5 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 font-mono text-[11px] leading-relaxed text-amber-300">
                      <WandSparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>
                        <span className="font-bold">judge suggestion:</span> {result.suggestion}
                      </span>
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 font-mono text-sm font-bold",
                        result.ok ? "text-emerald-400" : "text-amber-400"
                      )}
                    >
                      {result.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      {result.passed}/{result.total} tests passed
                    </span>
                    <span className="font-mono text-[11px] text-zinc-600">{result.timeMs}ms</span>
                  </div>
                  <div className="cc-scroll-thin max-h-72 space-y-1.5 overflow-y-auto pr-1">
                    {result.results.map((r, i) => (
                      <details key={i} className="group rounded-lg border border-zinc-800 bg-zinc-950/60">
                        <summary className="flex cursor-pointer select-none items-center gap-2 px-3 py-2 font-mono text-xs">
                          {r.passed ? (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                          )}
                          <span className="text-zinc-400">
                            test {i + 1} — {formatValue(r.args)}
                          </span>
                          {!r.passed && <span className="ml-auto text-red-400">expand ↓</span>}
                        </summary>
                        <div className="space-y-1 border-t border-zinc-800/70 px-3 py-2 font-mono text-[11px]">
                          <p className="text-zinc-500">
                            expected: <span className="text-zinc-300">{formatValue(r.expected)}</span>
                          </p>
                          <p className="text-zinc-500">
                            got: <span className={r.passed ? "text-emerald-400" : "text-red-400"}>{formatValue(r.got)}</span>
                          </p>
                          {r.error && <p className="text-red-400">error: {r.error}</p>}
                          {r.logs.length > 0 && (
                            <pre className="mt-1 whitespace-pre-wrap rounded bg-zinc-900 p-2 text-zinc-500">
                              {r.logs.join("\n")}
                            </pre>
                          )}
                        </div>
                      </details>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Success banner */}
          {justSolved && (
            <div className="cc-rise rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5">
              <p className="flex items-center gap-2 font-mono text-sm font-bold text-emerald-300">
                <Award className="h-4 w-4" /> accepted — +{earned?.xp ?? xpForProblem} XP
                {earned && earned.daily > 0 && (
                  <span className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-300">
                    +{earned.daily} daily bonus
                  </span>
                )}
              </p>
              <p className="mt-1.5 text-sm text-zinc-300">
                All {result?.total ?? problem.tests.length} tests green. The judge has no further objections.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {nextProblem && (
                  <Link to={`/app/practice/${nextProblem.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 font-mono text-xs font-bold text-zinc-950 transition-colors hover:bg-emerald-400"
                  >
                    next problem <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
                <Link to="/app/game/battle"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-4 py-2 font-mono text-xs text-zinc-300 transition-colors hover:border-red-500/50 hover:text-red-400"
                >
                  take it to the arena
                </Link>
              </div>
            </div>
          )}

          {/* Solution reveal */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">reference solution</h2>
              {!solutionShown ? (
                <button
                  onClick={() => (runCount > 0 && solved ? setSolutionShown(true) : setConfirmSolution(true))}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 font-mono text-xs text-zinc-400 transition-colors hover:border-zinc-500"
                >
                  <KeyRound className="h-3.5 w-3.5" /> {solved ? "view solution" : "I'm stuck — reveal"}
                </button>
              ) : (
                <span className="font-mono text-[11px] text-emerald-400">revealed</span>
              )}
            </div>
            {confirmSolution && !solutionShown && (
              <div className="cc-rise mt-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5">
                <p className="text-sm text-zinc-300">
                  Spoilers are permanent. Sure you want to see how the reference solves it?
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      setSolutionShown(true);
                      setConfirmSolution(false);
                    }}
                    className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-1.5 font-mono text-xs text-amber-400 transition-colors hover:bg-amber-500/20"
                  >
                    yes, reveal it
                  </button>
                  <button
                    onClick={() => setConfirmSolution(false)}
                    className="rounded-lg border border-zinc-700 px-3 py-1.5 font-mono text-xs text-zinc-400 transition-colors hover:border-zinc-500"
                  >
                    no, keep trying
                  </button>
                </div>
              </div>
            )}
            {solutionShown && (
              <div className="mt-3">
                <CodeBlock
                  code={language === "js" || !pl ? problem.solution : pl.solution[language as "cpp" | "py" | "java"]}
                  title={`reference.${language === "cpp" ? "cpp" : language === "py" ? "py" : language === "java" ? "java" : "js"}`}
                  maxHeight={280}
                />
                <p className="mt-2 text-xs italic text-zinc-600">
                  You still earn full XP if you now pass all tests — the judge doesn&apos;t judge how you learned.
                </p>
              </div>
            )}
            {!solutionShown && !confirmSolution && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-600">
                <Circle className="h-3 w-3" /> locked — try the hints first
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
