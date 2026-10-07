import { getRank } from "@/lib/game";
import { cn } from "@/lib/utils";

export function RankBadge({ rating, showRating = false, className }: { rating: number; showRating?: boolean; className?: string }) {
  const rank = getRank(rating);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-xs font-semibold tracking-wide",
        rank.chip,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: rank.color }} />
      {rank.name}
      {showRating && <span className="opacity-70">· {rating}</span>}
    </span>
  );
}
