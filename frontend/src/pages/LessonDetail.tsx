import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getLesson } from "@/lib/data/lessons";
import { LessonView } from "@/components/game/lesson-view";
import { api } from "@/lib/api";

export default function LessonDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [completed, setCompleted] = useState(false);

  const lesson = slug ? getLesson(slug) : undefined;

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const { data } = await api.get<{ completedSlugs: string[] }>("/progress/lessons");
        if (data.completedSlugs?.includes(slug)) {
          setCompleted(true);
        }
      } catch {
        // Continue if progress fetch fails
      }
    })();
  }, [slug]);

  if (!lesson) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold text-zinc-100">Lesson not found</h2>
        <p className="mt-2 text-sm text-zinc-500">The lesson "{slug}" does not exist.</p>
        <Link
          to="/app/learn"
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 font-mono text-sm text-zinc-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Lessons
        </Link>
      </div>
    );
  }

  return <LessonView lesson={lesson} alreadyCompleted={completed} />;
}
