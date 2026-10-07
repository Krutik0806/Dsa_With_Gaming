
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock } from "lucide-react";
import { getSeasonInfo, type SeasonInfo } from "@/lib/season";
import { cn } from "@/lib/utils";

/**
 * Weekly season chip — cup circuit cadence indicator. Links to the archive.
 * Computes after mount (time-dependent render would risk hydration mismatch).
 */
export function SeasonChip({ className, compact = false }: { className?: string; compact?: boolean }) {
  const [season, setSeason] = useState<SeasonInfo | null>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setSeason(getSeasonInfo()));
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!season) {
    return compact ? (
      <span className={cn("inline-block h-5 w-24 animate-pulse rounded bg-zinc-800/80", className)} aria-hidden />
    ) : (
      <span className={cn("inline-block h-9 w-56 animate-pulse rounded-lg bg-zinc-800/80", className)} aria-hidden />
    );
  }

  if (compact) {
    return (
      <Link to="/app/seasons"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900/60 px-2 py-0.5 font-mono text-[10px] font-bold text-zinc-400 transition-colors hover:border-amber-500/50 hover:text-amber-300",
          className
        )}
        title={`Season ${season.season} ends ${season.endsAt.toUTCString()} — click for the season archive`}
      >
        <CalendarClock className="h-3 w-3 text-amber-400/80" />
        S{season.season} · {season.daysLeft}d {season.hoursLeft}h
      </Link>
    );
  }

  return (
    <div
      className={cn("rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3", className)}
      title={`Season ${season.season} ends ${season.endsAt.toUTCString()}`}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          <CalendarClock className="h-3.5 w-3.5 text-amber-400" />
          season {season.season}
        </span>
        <span className="font-mono text-[11px] tabular-nums text-zinc-500">
          ends in <span className="font-bold text-amber-400">{season.daysLeft}d {season.hoursLeft}h</span>
        </span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-700"
          style={{ width: `${Math.round(season.progress * 100)}%` }}
        />
      </div>
      <p className="mt-1.5 font-mono text-[9px] uppercase tracking-wider text-zinc-600">
        new cups drop weekly · ladder snapshots at season rollover
      </p>
    </div>
  );
}
