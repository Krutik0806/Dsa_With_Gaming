
import { useState } from "react";
import { api } from "@/lib/api";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  Info,
  Lightbulb,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { CodeBlock } from "@/components/game/code-block";
import { LessonIcon } from "@/components/game/lesson-icon";
import { DifficultyBadge } from "@/components/game/difficulty-badge";
import { LessonViz } from "@/components/game/viz/viz-router";
import { useAuth } from "@/lib/auth-context";
import { playSound } from "@/lib/sound";
import type { Lesson, LessonBlock } from "@/lib/data/lessons";
import { getProblem, type Problem } from "@/lib/data/problems";
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

const CALLOUT_STYLE = {
  tip: { icon: Lightbulb, cls: "border-emerald-500/30 bg-emerald-500/5", iconCls: "text-emerald-400" },
  warn: { icon: AlertTriangle, cls: "border-amber-500/30 bg-amber-500/5", iconCls: "text-amber-400" },
  info: { icon: Info, cls: "border-zinc-700 bg-zinc-800/30", iconCls: "text-zinc-400" },
} as const;

function Block({ block }: { block: LessonBlock }) {
  switch (block.type) {
    case "text":
      return <p className="text-[15px] leading-relaxed text-zinc-300">{renderInline(block.text)}</p>;
    case "list":
      return (
        <div>
          {block.title && (
            <h3 className="mb-2.5 font-mono text-sm font-bold uppercase tracking-wider text-zinc-400">{block.title}</h3>
          )}
          <ul className="space-y-2">
            {block.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-zinc-300">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                {renderInline(item)}
              </li>
            ))}
          </ul>
        </div>
      );
    case "callout": {
      const style = CALLOUT_STYLE[block.tone];
      return (
        <div className={cn("flex items-start gap-3 rounded-xl border p-4", style.cls)}>
          <style.icon className={cn("mt-0.5 h-4.5 w-4.5 shrink-0", style.iconCls)} />
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-wider" style={{ color: "inherit" }}>
              <span className={style.iconCls}>{block.title}</span>
            </p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-300">{renderInline(block.text)}</p>
          </div>
        </div>
      );
    }
    case "code":
      return (
        <div>
          {block.title && <p className="mb-2 font-mono text-xs uppercase tracking-wider text-zinc-500">{block.title}</p>}
          <CodeBlock code={block.code} title={block.title ?? "example.js"} />
          {block.caption && <p className="mt-2 text-xs italic text-zinc-500">{block.caption}</p>}
        </div>
      );
    case "viz":
      return (
        <div>
          {block.title && <p className="mb-2 font-mono text-xs uppercase tracking-wider text-zinc-500">{block.title}</p>}
          <LessonViz kind={block.kind} />
        </div>
      );
    default:
      return null;
  }
}

export function LessonView({ lesson, alreadyCompleted }: { lesson: Lesson; alreadyCompleted: boolean }) {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [selected, setSelected] = useState<number | null>(null);
  const [wrong, setWrong] = useState(false);
  const [completed, setCompleted] = useState(alreadyCompleted);
  const [saving, setSaving] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const nextLesson = lesson.nextSlug;
  const practiceProblems = lesson.practiceSlugs
    .map((slug) => getProblem(slug))
    .filter((p): p is Problem => p !== undefined);

  const answer = (idx: number) => {
    if (selected !== null) return;
    if (idx === lesson.check.answer) {
      setSelected(idx);
      setWrong(false);
      playSound("correct");
    } else {
      setSelected(idx);
      setWrong(true);
      playSound("wrong");
      setTimeout(() => {
        setSelected(null);
        setWrong(false);
      }, 900);
    }
  };

  const markComplete = async () => {
    if (completed || saving) return;
    setSaving(true);
    try {
      const res = await api.post<{ user?: any; xpEarned?: number }>("/progress", {
        kind: "LESSON",
        refId: lesson.slug,
      });
      const data = res.data;
      if (data.user) setUser(data.user);
      setCompleted(true);
      setJustCompleted(true);
      playSound("xp");
      toast.success(`Lesson complete — +${data.xpEarned ?? 0} XP`, {
        description: "Your skill map just got sharper.",
      });
    } catch {
      toast.error("Could not save progress — try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <Link to="/app/learn"
        className="mb-5 inline-flex items-center gap-1.5 font-mono text-xs text-zinc-500 transition-colors hover:text-emerald-400"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> all topics
      </Link>
      <div className="mb-8 flex items-start gap-4">
        <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
          <LessonIcon icon={lesson.icon} className="h-7 w-7" />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{lesson.title}</h1>
            {completed && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> completed
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-zinc-500">{lesson.tagline}</p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <DifficultyBadge difficulty={lesson.difficulty} />
            <span className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 font-mono text-[11px] text-zinc-400">
              <Clock className="h-3 w-3" /> {lesson.minutes} min
            </span>
            <span className="rounded-md border border-emerald-600/30 bg-emerald-950/40 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-400">
              +{lesson.xp} XP
            </span>
            <span className="rounded-md border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 font-mono text-[11px] text-zinc-400">
              {lesson.category}
            </span>
          </div>
        </div>
      </div>

      {/* Content blocks */}
      <div className="space-y-6">
        {lesson.blocks.map((block, i) => (
          <Block key={i} block={block} />
        ))}
      </div>

      {/* Worked example */}
      <section className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-wider text-zinc-300">
          <Award className="h-4 w-4 text-amber-400" /> worked example
        </h2>
        <CodeBlock code={lesson.example.code} title={lesson.example.title} />
        <ul className="mt-4 space-y-2">
          {lesson.example.points.map((point, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-zinc-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              {renderInline(point)}
            </li>
          ))}
        </ul>
      </section>

      {/* Knowledge check */}
      <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
        <h2 className="mb-1 flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-wider text-zinc-300">
          <Lightbulb className="h-4 w-4 text-emerald-400" /> knowledge check
        </h2>
        <p className="mb-4 text-xs text-zinc-500">Answer correctly to complete the lesson and claim your XP.</p>
        <p className="text-[15px] font-medium leading-relaxed text-zinc-200">{lesson.check.question}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {lesson.check.options.map((option, i) => {
            const isPicked = selected === i;
            const isCorrect = i === lesson.check.answer;
            const revealed = selected !== null && isCorrect;
            return (
              <button
                key={i}
                onClick={() => answer(i)}
                disabled={selected !== null && !wrong}
                className={cn(
                  "rounded-xl border px-4 py-3 text-left font-mono text-sm transition-all",
                  revealed
                    ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300"
                    : isPicked && wrong
                      ? "cc-shake border-red-500/60 bg-red-500/10 text-red-300"
                      : "border-zinc-800 bg-zinc-950/50 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-900"
                )}
              >
                <span className="mr-2 text-zinc-600">{String.fromCharCode(65 + i)}.</span>
                {option}
                {revealed && <CheckCircle2 className="ml-2 inline h-4 w-4" />}
                {isPicked && wrong && <XCircle className="ml-2 inline h-4 w-4" />}
              </button>
            );
          })}
        </div>
        {selected !== null && !wrong && (
          <div className="cc-rise mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="text-sm leading-relaxed text-emerald-200/90">{lesson.check.explanation}</p>
            {!completed ? (
              <button
                onClick={markComplete}
                disabled={saving}
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-500 px-5 font-mono text-sm font-bold text-zinc-950 transition-all hover:bg-emerald-400"
              >
                <Award className="h-4 w-4" />
                {saving ? "claiming…" : `claim +${lesson.xp} XP`}
              </button>
            ) : (
              justCompleted && (
                <p className="mt-3 font-mono text-xs font-bold text-emerald-400">+{lesson.xp} XP claimed ✓</p>
              )
            )}
          </div>
        )}
      </section>

      {/* Next steps */}
      <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
        <h2 className="mb-4 font-mono text-sm font-bold uppercase tracking-wider text-zinc-300">put it to work</h2>
        {practiceProblems.length > 0 ? (
          <div className="space-y-2">
            {practiceProblems.map((p) => (
              <Link
                key={p.slug}
                to={`/app/practice/${p.slug}`}
                className="group flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 transition-colors hover:border-emerald-600/40"
              >
                <div>
                  <p className="font-medium text-zinc-200 group-hover:text-emerald-300">{p.title}</p>
                  <p className="mt-0.5 text-xs text-zinc-600">{p.topics.join(" · ")}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <DifficultyBadge difficulty={p.difficulty} />
                  <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-emerald-400" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            No linked problems for this topic yet — head to the practice arena and pick your own challenge.
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 pt-4">
          {nextLesson ? (
            <Link to={`/app/learn/${nextLesson}`}
              className="inline-flex items-center gap-1.5 font-mono text-sm text-emerald-400 transition-colors hover:text-emerald-300"
            >
              next lesson <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link to="/app/learn"
              className="inline-flex items-center gap-1.5 font-mono text-sm text-emerald-400 transition-colors hover:text-emerald-300"
            >
              back to curriculum <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          <Link to="/app/game/battle"
            className="inline-flex items-center gap-1.5 font-mono text-sm text-zinc-500 transition-colors hover:text-red-400"
          >
            or test it in battle <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
