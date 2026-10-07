import { cn } from "@/lib/utils";

export function Stat({
  label,
  value,
  sub,
  tone = "default",
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: "default" | "positive" | "negative" | "accent";
  className?: string;
}) {
  const toneCls =
    tone === "positive"
      ? "text-emerald-400"
      : tone === "negative"
        ? "text-red-400"
        : tone === "accent"
          ? "text-amber-400"
          : "text-zinc-100";
  return (
    <div className={cn("rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3", className)}>
      <div className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className={cn("mt-1 font-mono text-xl font-bold tabular-nums", toneCls)}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-zinc-500">{sub}</div>}
    </div>
  );
}
