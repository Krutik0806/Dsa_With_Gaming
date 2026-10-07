import { Progress } from "@/components/ui/progress";
import { getLevelInfo } from "@/lib/game";
import { cn } from "@/lib/utils";

export function XPBar({ xp, compact = false, className }: { xp: number; compact?: boolean; className?: string }) {
  const info = getLevelInfo(xp);
  const pct = Math.min(100, Math.max(0, info.progress * 100));
  return (
    <div className={cn("w-full", className)}>
      <div className={cn("mb-1.5 flex items-center justify-between font-mono", compact ? "text-[11px]" : "text-xs")}>
        <span className="font-bold text-emerald-400">LVL {info.level}</span>
        <span className="text-zinc-500">
          {info.intoLevel.toLocaleString()} / {info.levelSpan.toLocaleString()} XP
        </span>
      </div>
      <Progress value={pct} className="h-2 bg-zinc-800" />
    </div>
  );
}
