import { DIFFICULTY_META, type Difficulty } from "@/lib/game";
import { cn } from "@/lib/utils";

export function DifficultyBadge({ difficulty, className }: { difficulty: Difficulty | "Beginner" | "Intermediate" | "Advanced"; className?: string }) {
  const meta =
    difficulty in DIFFICULTY_META
      ? DIFFICULTY_META[difficulty as Difficulty]
      : difficulty === "Beginner"
        ? { label: difficulty, chip: "border-emerald-500/40 bg-emerald-950/50 text-emerald-400" }
        : difficulty === "Intermediate"
          ? { label: difficulty, chip: "border-amber-500/40 bg-amber-950/50 text-amber-400" }
          : { label: difficulty, chip: "border-red-500/40 bg-red-950/50 text-red-400" };

  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-xs font-semibold", meta.chip, className)}>
      {meta.label}
    </span>
  );
}
