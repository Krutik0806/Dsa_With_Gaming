
// ─── Coin activity feed (profile) ────────────────────────────────────────────
// Ledger-backed list of the latest coin mutations, each tagged with the faucet
// it came from: match purses, cup runs, dailies, check-ins and shop spends.

import { Link } from "react-router-dom";
import {
  CalendarCheck,
  Coins,
  Crown,
  Flame,
  Minus,
  ShoppingBag,
  Sparkles,
  Trophy,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { timeAgo } from "@/lib/format";
import type { LedgerEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface SourceMeta {
  icon: LucideIcon;
  chip: string;
}

// Source → icon + tint, arena palette (emerald earns, red spends, amber cups,
// orange dailies, pink seeds, teal seasons).
const SOURCE_META: Record<string, SourceMeta> = {
  MATCH_WIN: { icon: Trophy, chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  MATCH_DRAW: { icon: Minus, chip: "border-zinc-700 bg-zinc-800/60 text-zinc-300" },
  MATCH_LOSS: { icon: X, chip: "border-zinc-700 bg-zinc-800/60 text-zinc-400" },
  CUP_ROUND: { icon: Crown, chip: "border-amber-500/30 bg-amber-500/10 text-amber-400" },
  CUP_CHAMPION: { icon: Crown, chip: "border-amber-500/40 bg-amber-500/15 text-amber-300" },
  DAILY_CHECKIN: { icon: CalendarCheck, chip: "border-orange-500/30 bg-orange-500/10 text-orange-400" },
  DAILY_CHALLENGE: { icon: Flame, chip: "border-orange-500/30 bg-orange-500/10 text-orange-300" },
  SHOP_PURCHASE: { icon: ShoppingBag, chip: "border-red-500/30 bg-red-500/10 text-red-400" },
  SEED: { icon: Sparkles, chip: "border-pink-500/30 bg-pink-500/10 text-pink-400" },
  SEASON: { icon: Zap, chip: "border-teal-500/30 bg-teal-500/10 text-teal-300" },
};

const FALLBACK_META: SourceMeta = { icon: Coins, chip: "border-zinc-700 bg-zinc-800/60 text-zinc-300" };

function sourceMeta(source: string): SourceMeta {
  return SOURCE_META[source] ?? FALLBACK_META;
}

function sourceLabel(source: string): string {
  return source.replaceAll("_", " ").toLowerCase();
}

export function CoinActivity({ entries }: { entries: LedgerEntry[] | null }) {
  const loading = entries === null;
  const list = entries ?? [];
  const earned = list.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const spent = list.filter((t) => t.amount < 0).reduce((s, t) => s - t.amount, 0);

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40" aria-label="coin activity">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800/70 px-5 py-3">
        <h2 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">
          <Coins className="h-3.5 w-3.5 text-amber-400" /> coin activity
        </h2>
        {!loading && list.length > 0 && (
          <p className="font-mono text-[10px] text-zinc-500">
            <span className="text-emerald-400">+{earned.toLocaleString()}</span> ·{" "}
            <span className="text-red-400">-{spent.toLocaleString()}</span> · last {list.length} moves
          </p>
        )}
      </div>

      {loading ? (
        <div className="space-y-2 p-4">
          <Skeleton className="h-9 w-full bg-zinc-800/60" />
          <Skeleton className="h-9 w-full bg-zinc-800/60" />
          <Skeleton className="h-9 w-11/12 bg-zinc-800/60" />
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <Coins className="h-8 w-8 text-zinc-700" />
          <p className="mt-3 font-mono text-xs text-zinc-500">no coin movement yet — every earn and spend lands here</p>
          <Link to="/app/game/quiz"
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 font-mono text-xs font-bold text-amber-400 transition-colors hover:bg-amber-500/20"
          >
            <Trophy className="h-3.5 w-3.5" /> battle for coins
          </Link>
        </div>
      ) : (
        <ul className="cc-scroll-thin max-h-96 divide-y divide-zinc-800/50 overflow-y-auto">
          {list.map((t) => {
            const meta = sourceMeta(t.source);
            const Icon = meta.icon;
            return (
              <li key={t.id} className="flex items-center gap-3 px-5 py-2.5">
                <span
                  className={cn("inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border", meta.chip)}
                  aria-hidden
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-xs text-zinc-300">{t.description}</p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">{sourceLabel(t.source)}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 font-mono text-sm font-bold",
                    t.amount >= 0 ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  {t.amount > 0 ? "+" : ""}
                  {t.amount}
                </span>
                <span className="hidden w-14 shrink-0 text-right font-mono text-[10px] text-zinc-600 sm:inline">
                  {timeAgo(t.at)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
