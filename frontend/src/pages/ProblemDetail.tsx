import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getProblem } from "@/lib/data/problems";
import { ProblemView } from "@/components/game/problem-view";
import { api } from "@/lib/api";

export default function ProblemDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [solved, setSolved] = useState(false);

  const problem = slug ? getProblem(slug) : undefined;

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const { data } = await api.get<{ solvedSlugs: string[] }>("/progress/problems");
        if (data.solvedSlugs?.includes(slug)) {
          setSolved(true);
        }
      } catch {
        // Continue if progress fetch fails
      }
    })();
  }, [slug]);

  if (!problem || !slug) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold text-zinc-100">Problem not found</h2>
        <p className="mt-2 text-sm text-zinc-500">The problem "{slug}" does not exist.</p>
        <Link
          to="/app/practice"
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 font-mono text-sm text-zinc-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Practice
        </Link>
      </div>
    );
  }

  return <ProblemView slug={slug} alreadySolved={solved} />;
}
