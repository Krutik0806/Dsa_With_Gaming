
import { useState } from "react";
import {
  Award,
  BookOpen,
  Code2,
  Crown,
  Flame,
  Gem,
  GitBranch,
  Globe,
  GraduationCap,
  Hammer,
  Languages,
  Medal,
  RotateCcw,
  Shield,
  Sun,
  Swords,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import type { Achievement, AchievementCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const ICONS: Record<string, typeof Medal> = {
  swords: Swords,
  "book-open": BookOpen,
  "graduation-cap": GraduationCap,
  target: Target,
  flame: Flame,
  zap: Zap,
  code: Code2,
  "trending-up": TrendingUp,
  gem: Gem,
  medal: Medal,
  crown: Crown,
  trophy: Trophy,
  shield: Shield,
  "rotate-ccw": RotateCcw,
  hammer: Hammer,
  timer: Timer,
  languages: Languages,
  globe: Globe,
  "git-branch": GitBranch,
  sun: Sun,
};

const CATEGORIES: { key: AchievementCategory | "all"; label: string }[] = [
  { key: "all", label: "all" },
  { key: "combat", label: "combat" },
  { key: "mastery", label: "mastery" },
  { key: "cups", label: "cups" },
  { key: "grind", label: "grind" },
];

const RARITY_STYLES: Record<string, { label: string; chip: string; icon: string; ring: string; bar: string }> = {
  common: { label: "common", chip: "border-zinc-600/50 bg-zinc-700/20 text-zinc-400", icon: "bg-zinc-700/40 text-zinc-300", ring: "border-zinc-600/40", bar: "bg-zinc-400" },
  rare: { label: "rare", chip: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400", icon: "bg-emerald-500/15 text-emerald-400", ring: "border-emerald-500/30", bar: "bg-emerald-400" },
  epic: { label: "epic", chip: "border-pink-500/40 bg-pink-500/10 text-pink-400", icon: "bg-pink-500/15 text-pink-400", ring: "border-pink-500/30", bar: "bg-pink-400" },
  legendary: { label: "legendary", chip: "border-amber-500/40 bg-amber-500/10 text-amber-400", icon: "bg-amber-500/15 text-amber-400", ring: "border-amber-500/40", bar: "bg-amber-400" },
};

export function AchievementsGallery({ achievements, loading }: { achievements: Achievement[] | null; loading: boolean }) {
  const [filter, setFilter] = useState<AchievementCategory | "all">("all");

  if (loading || !achievements) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
        <h2 className="mb-4 font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">achievements</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 bg-zinc-800/60" />
          ))}
        </div>
      </section>
    );
  }

  const earned = achievements.filter((a) => a.unlocked).length;
  const filtered = filter === "all" ? achievements : achievements.filter((a) => a.category === filter);
  const catEarned = (c: AchievementCategory | "all") =>
    achievements.filter((a) => a.unlocked && (c === "all" || a.category === c)).length;
  const catTotal = (c: AchievementCategory | "all") => achievements.filter((a) => c === "all" || a.category === c).length;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">
          <Award className="h-3.5 w-3.5 text-amber-400" /> achievements
        </h2>
        <span className="font-mono text-xs text-zinc-400">
          <span className="font-bold text-amber-400">{earned}</span>
          <span className="text-zinc-600"> / {achievements.length} earned</span>
        </span>
      </div>

      {/* category filter */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {CATEGORIES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-lg border px-2.5 py-1 font-mono text-[11px] font-bold transition-colors",
              filter === key
                ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                : "border-zinc-800 bg-zinc-950/40 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
            )}
          >
            {label} <span className="text-zinc-600">{catEarned(key)}/{catTotal(key)}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {filtered.map((a) => {
          const Icon = ICONS[a.icon] ?? Medal;
          const rarity = RARITY_STYLES[a.rarity] ?? RARITY_STYLES.common;
          const pct = a.progress ? Math.min(100, Math.round((a.progress.current / a.progress.target) * 100)) : a.unlocked ? 100 : 0;
          return (
            <div
              key={a.key}
              title={a.description}
              className={cn(
                "group relative flex flex-col rounded-xl border px-3 py-3.5 transition-all",
                a.unlocked
                  ? cn(rarity.ring, "bg-zinc-950/60 hover:bg-zinc-900/80")
                  : "border-zinc-800 bg-zinc-950/40 opacity-70 hover:opacity-100"
              )}
            >
              {a.unlocked && a.rarity === "legendary" && (
                <span className="cc-gold-sweep absolute inset-x-0 top-0 h-px rounded-t-xl" aria-hidden />
              )}
              <div className="flex items-start justify-between gap-1">
                <span
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-lg transition-transform group-hover:scale-110",
                    a.unlocked ? rarity.icon : "bg-zinc-800 text-zinc-600"
                  )}
                >
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider",
                    a.unlocked ? rarity.chip : "bg-zinc-800/60 text-zinc-600"
                  )}
                >
                  {rarity.label}
                </span>
              </div>
              <p className={cn("mt-2 font-mono text-[11px] font-bold leading-tight", a.unlocked ? "text-zinc-200" : "text-zinc-500")}>
                {a.name}
              </p>
              <p className="mt-1 line-clamp-2 text-[10px] leading-tight text-zinc-600">{a.description}</p>

              {/* progress bar for locked progressive achievements */}
              {!a.unlocked && a.progress && (
                <div className="mt-2.5">
                  <div className="h-1 overflow-hidden rounded-full bg-zinc-800">
                    <div className={cn("h-full rounded-full transition-all", rarity.bar)} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 font-mono text-[9px] tabular-nums text-zinc-600">
                    {a.progress.current.toLocaleString()} / {a.progress.target.toLocaleString()}
                  </p>
                </div>
              )}
              {a.unlocked && (
                <p className="mt-2 font-mono text-[9px] font-bold uppercase tracking-wider text-emerald-500/80">✓ earned</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
