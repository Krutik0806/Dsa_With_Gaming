import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Crown } from "lucide-react";
import { api } from "@/lib/api";
import { MatchAnalysis } from "@/components/game/match-analysis";
import type { CodingMatchDetails, MatchSummary, QuizMatchDetails } from "@/lib/types";

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    match: MatchSummary;
    quizDetails?: QuizMatchDetails;
    codingDetails?: CodingMatchDetails;
    tournamentName?: string;
  } | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await api.get(`/match/${id}`);
        setData(res.data);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-sm text-zinc-500 animate-pulse">
        Loading match analysis…
      </div>
    );
  }

  if (!data || !data.match) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold text-zinc-100">Match not found</h2>
        <p className="mt-2 text-sm text-zinc-500">Could not find analysis for this match.</p>
        <Link
          to="/app/history"
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 font-mono text-sm text-zinc-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Match History
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <Link
          to="/app/history"
          className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-zinc-500 transition-colors hover:text-emerald-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> match history
        </Link>
      </div>

      {data.tournamentName && (
        <div className="mx-auto mb-4 flex max-w-4xl flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/40 bg-amber-500/5 px-4 py-2.5">
          <p className="flex items-center gap-2 font-mono text-xs font-bold text-amber-300">
            <Crown className="h-3.5 w-3.5" /> tournament match — {data.tournamentName}
          </p>
          <span className="font-mono text-[10px] text-zinc-500">part of a knockout bracket</span>
        </div>
      )}

      <MatchAnalysis
        match={data.match}
        quizDetails={data.quizDetails}
        codingDetails={data.codingDetails}
      />
    </>
  );
}
