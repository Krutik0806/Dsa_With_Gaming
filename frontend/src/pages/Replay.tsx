// ─── Replay page ─────────────────────────────────────────────────────────────
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { api } from "../lib/api";
import { ReplayTheater } from "../components/game/replay-theater";

export default function ReplayPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.get(`/replay/${id}`)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => { setError("Replay not found or has expired."); setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 text-zinc-100">
        <p className="font-mono text-sm text-zinc-400">{error ?? "Replay unavailable"}</p>
        <Link to="/" className="font-mono text-xs text-emerald-400 hover:text-emerald-300">
          ← back to arena
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Link to="/app/history" className="inline-flex items-center gap-2 font-mono text-xs text-zinc-500 hover:text-zinc-300">
            <ArrowLeft className="h-3.5 w-3.5" /> back to history
          </Link>
        </div>
        <ReplayTheater match={data.match} />
      </div>
    </div>
  );
}
