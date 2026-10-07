
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Clock, GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/game/page-header";
import { LessonIcon } from "@/components/game/lesson-icon";
import { DifficultyBadge } from "@/components/game/difficulty-badge";
import { LESSONS } from "@/lib/data/lessons";
import type { ProgressResponse } from "@/lib/types";

export default function LearnPage() {
  const [progress, setProgress] = useState<ProgressResponse | null>(null);

  useEffect(() => {
    api.get("/progress").then(r=>r.data)
      .then(setProgress)
      .catch(() => setProgress({ lessons: [], problems: [], dailyDone: false }));
  }, []);

  const done = progress?.lessons ?? [];
  const completedCount = done.length;
  const nextLesson = LESSONS.find((l) => !done.includes(l.slug));

  return (
    <div>
      <PageHeader
        icon={GraduationCap}
        title="Learn"
        description="Interactive lessons with live algorithm visualizations. Complete the knowledge check to earn XP and unlock your skill map."
        actions={
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2 font-mono text-sm">
            <span className="font-bold text-emerald-400">{completedCount}</span>
            <span className="text-zinc-500"> / {LESSONS.length} topics mastered</span>
          </div>
        }
      />

      {/* Progress bar */}
      <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
        <div className="mb-2 flex items-center justify-between font-mono text-xs text-zinc-500">
          <span>curriculum progress</span>
          <span>
            {Math.round((completedCount / LESSONS.length) * 100)}% complete
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
            style={{ width: `${(completedCount / LESSONS.length) * 100}%` }}
          />
        </div>
        {nextLesson && (
          <p className="mt-3 font-mono text-xs text-zinc-500">
            up next → <span className="text-zinc-300">{nextLesson.title}</span>
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LESSONS.map((lesson, i) => {
          const isDone = done.includes(lesson.slug);
          const isNext = nextLesson?.slug === lesson.slug;
          return (
            <Link
              key={lesson.slug}
              to={`/app/learn/${lesson.slug}`}
              className={`group relative flex flex-col rounded-2xl border p-5 transition-all hover:-translate-y-0.5 ${
                isNext
                  ? "border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/60"
                  : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-600 hover:bg-zinc-900/70"
              }`}
            >
              {isNext && (
                <span className="absolute -top-2.5 left-4 rounded-full bg-emerald-500 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-950">
                  up next
                </span>
              )}
              <div className="flex items-start justify-between">
                <span
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${
                    isDone ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400" : "border-zinc-700 bg-zinc-800 text-zinc-400"
                  }`}
                >
                  <LessonIcon icon={lesson.icon} className="h-5 w-5" />
                </span>
                {isDone ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" /> DONE
                  </span>
                ) : (
                  <span className="font-mono text-[10px] font-bold text-zinc-600">0{i + 1}</span>
                )}
              </div>
              <h3 className="mt-3.5 font-bold text-zinc-100 group-hover:text-emerald-300">{lesson.title}</h3>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-zinc-500">{lesson.tagline}</p>
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                <DifficultyBadge difficulty={lesson.difficulty} />
                <span className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 font-mono text-[11px] text-zinc-400">
                  <Clock className="h-3 w-3" /> {lesson.minutes}m
                </span>
                <span className="rounded-md border border-emerald-600/30 bg-emerald-950/40 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-400">
                  +{lesson.xp} XP
                </span>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 font-mono text-xs text-zinc-600 transition-colors group-hover:text-emerald-400">
                open lesson <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
