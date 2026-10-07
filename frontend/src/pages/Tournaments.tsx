
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import {
  Brackets,
  CalendarDays,
  ChevronRight,
  Clock,
  Crown,
  Gift,
  Shield,
  Swords,
  Timer,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/game/page-header";
import { SeasonChip } from "@/components/game/season-chip";
import { DifficultyBadge } from "@/components/game/difficulty-badge";
import { EmptyState } from "@/components/game/empty-state";
import { useAuth } from "@/lib/auth-context";
import { isPlayable } from "@/lib/data/tournaments";
import type { EntryStatus, TournamentListResponse, TournamentSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// ── small shared pieces ──────────────────────────────────────────────────────

function LiveDot() {
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
    </span>
  );
}

const FORMAT_META: Record<TournamentSummary["format"], { label: string; icon: LucideIcon }> = {
  KNOCKOUT: { label: "knockout", icon: Brackets },
  ARENA: { label: "arena", icon: Users },
  SPRINT: { label: "sprint", icon: Timer },
};

const GAME_META: Record<TournamentSummary["gameType"], { label: string; icon: LucideIcon }> = {
  CODING: { label: "code", icon: Swords },
  QUIZ: { label: "quiz", icon: Zap },
};

function FormatChip({ format }: { format: TournamentSummary["format"] }) {
  const meta = FORMAT_META[format];
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 font-mono text-[11px] font-semibold text-zinc-300">
      <meta.icon className="h-3 w-3 text-zinc-500" />
      {meta.label}
    </span>
  );
}

function GameTypeChip({ gameType }: { gameType: TournamentSummary["gameType"] }) {
  const meta = GAME_META[gameType];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold",
        gameType === "CODING"
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          : "border-amber-500/30 bg-amber-500/10 text-amber-400"
      )}
    >
      <meta.icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

function EntryChip({ status }: { status: EntryStatus }) {
  if (status === "CHAMPION") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-amber-400/50 bg-amber-400/10 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-300">
        <Crown className="h-3 w-3" /> champion
      </span>
    );
  }
  if (status === "ELIMINATED") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-red-500/40 bg-red-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-red-400">
        eliminated
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-400">
      you&apos;re in
    </span>
  );
}

const MEDAL_STYLES = [
  "border-amber-400/60 bg-amber-400/10 text-amber-300",
  "border-zinc-400/50 bg-zinc-400/10 text-zinc-200",
  "border-amber-700/60 bg-amber-800/20 text-amber-500",
];

const FORMATS: { icon: LucideIcon; name: string; desc: string; accent: string }[] = [
  {
    icon: Brackets,
    name: "Knockout Cup",
    desc: "Eight entrants, three rounds, one survivor. Win or go home — a real bracket with your name on it.",
    accent: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  },
  {
    icon: Users,
    name: "Arena Blitz",
    desc: "Everyone in one room, unlimited duels, one clock. Points decide the podium.",
    accent: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  },
  {
    icon: Timer,
    name: "Sprint",
    desc: "A timed marathon across the whole field — volume and speed set the standings.",
    accent: "text-teal-300 border-teal-400/30 bg-teal-500/10",
  },
];

function SectionHeader({ icon: Icon, label, live }: { icon: LucideIcon; label: string; live?: boolean }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      {live ? <LiveDot /> : <Icon className="h-3.5 w-3.5 shrink-0 text-zinc-600" />}
      <h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">{label}</h2>
      <span className="h-px flex-1 bg-zinc-800/80" />
    </div>
  );
}

// ── tournament card ──────────────────────────────────────────────────────────

function StandingsPreview({ standings }: { standings: NonNullable<TournamentSummary["standings"]> }) {
  return (
    <div className="mt-4 space-y-1.5">
      {standings.slice(0, 3).map((s, i) => (
        <div key={s.name} className="flex items-center gap-2 font-mono text-xs">
          <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px] font-black", MEDAL_STYLES[i])}>
            {s.place}
          </span>
          <span className="truncate text-zinc-300">{s.name}</span>
          <span className="ml-auto shrink-0 text-zinc-500">{s.points.toLocaleString()} pts</span>
        </div>
      ))}
      <p className="pt-1 font-mono text-[11px] text-zinc-600">full standings on the cup page →</p>
    </div>
  );
}

function TournamentCard({
  t,
  entry,
  big,
  userRating,
}: {
  t: TournamentSummary;
  entry?: EntryStatus;
  big?: boolean;
  userRating: number;
}) {
  const pct = Math.min(100, Math.round((t.playerCount / Math.max(1, t.maxPlayers)) * 100));
  const locked = t.ratingRequirement !== undefined && userRating < t.ratingRequirement;
  const playable = isPlayable(t);
  const cta = entry ? "view bracket" : playable ? "enter cup" : t.status === "UPCOMING" ? "view details" : "view results";

  return (
    <Link to={`/app/tournaments/${t.slug}`}
      className={cn(
        "group relative block overflow-hidden rounded-2xl border bg-zinc-900/40 p-5 pl-6 transition-all",
        playable
          ? "border-emerald-500/25 hover:border-emerald-500/50 hover:bg-zinc-900/70 hover:shadow-[0_0_32px_-14px_rgba(52,211,153,0.45)]"
          : "border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/70"
      )}
    >
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ backgroundColor: t.themeColor }} />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {t.status === "LIVE" && <LiveDot />}
            <h3 className={cn("truncate font-bold tracking-tight text-zinc-100", big ? "text-lg" : "text-base")}>{t.name}</h3>
          </div>
          <p className={cn("mt-1 text-sm text-zinc-500", big ? "line-clamp-2" : "truncate")}>{t.tagline}</p>
        </div>
        {entry ? (
          <EntryChip status={entry} />
        ) : t.status === "UPCOMING" ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 font-mono text-[11px] font-semibold text-zinc-400">
            <CalendarDays className="h-3 w-3" /> soon
          </span>
        ) : t.status === "COMPLETED" ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 font-mono text-[11px] font-semibold text-zinc-400">
            <Trophy className="h-3 w-3" /> finished
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <FormatChip format={t.format} />
        <GameTypeChip gameType={t.gameType} />
        <DifficultyBadge difficulty={t.difficulty} />
        {t.ratingRequirement !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold",
              locked ? "border-red-500/40 bg-red-500/10 text-red-400" : "border-zinc-700 bg-zinc-800/60 text-zinc-400"
            )}
            title={
              locked
                ? `You need ${t.ratingRequirement}+ rating (you're at ${userRating})`
                : `Open to ${t.ratingRequirement}+ rating`
            }
          >
            <Shield className="h-3 w-3" />
            {t.ratingRequirement}+
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 font-mono text-sm">
        <Gift className="h-4 w-4 shrink-0 text-amber-400" />
        <span className="font-bold text-amber-300">{t.prizeXp.toLocaleString()} XP</span>
        {t.prizeTitle && <span className="truncate text-xs text-zinc-500">· {t.prizeTitle}</span>}
      </div>

      {t.status === "COMPLETED" && t.standings ? (
        <StandingsPreview standings={t.standings} />
      ) : (
        <div className="mt-4">
          <div className="flex items-center justify-between font-mono text-[11px] text-zinc-500">
            <span>{t.status === "UPCOMING" ? "pre-registered" : "entrants"}</span>
            <span className="text-zinc-300">
              {t.playerCount} / {t.maxPlayers}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div
              className={cn("h-full rounded-full transition-all", t.status === "LIVE" ? "bg-emerald-500" : "bg-zinc-600")}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-800/70 pt-3.5">
        <span className="flex min-w-0 items-center gap-1.5 font-mono text-[11px] text-zinc-500">
          {t.status === "UPCOMING" ? (
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
          ) : (
            <Clock className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
          )}
          <span className="truncate">{t.startsIn ?? (t.status === "COMPLETED" ? "cup finished" : "schedule tbd")}</span>
        </span>
        {big ? (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 font-mono text-xs font-bold transition-colors",
              entry ? "bg-zinc-800 text-zinc-100 group-hover:bg-zinc-700" : "bg-emerald-500 text-zinc-950 group-hover:bg-emerald-400"
            )}
          >
            {cta}
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600 transition-all group-hover:translate-x-0.5 group-hover:text-emerald-400" />
        )}
      </div>
    </Link>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function TournamentsPage() {
  const { user: userRaw } = useAuth(); const user = userRaw!;
  const [data, setData] = useState<TournamentListResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api.get("/tournaments").then(r=>r.data)
      .then((r) => {
        if (!r.ok) throw new Error("failed");
        return r.json();
      })
      .then((d: TournamentListResponse) => setData({ tournaments: d.tournaments ?? [], entries: d.entries ?? {} }))
      .catch(() => setFailed(true));
  }, []);

  const enteredCount = data ? Object.keys(data.entries).length : 0;
  const championCount = data ? Object.values(data.entries).filter((s) => s === "CHAMPION").length : 0;

  const live = data
    ? data.tournaments.filter((t) => t.status === "LIVE").sort((a, b) => Number(isPlayable(b)) - Number(isPlayable(a)))
    : [];
  const upcoming = data ? data.tournaments.filter((t) => t.status === "UPCOMING") : [];
  const completed = data ? data.tournaments.filter((t) => t.status === "COMPLETED") : [];

  return (
    <div className="cc-rise">
      <PageHeader
        icon={Crown}
        title="Tournaments"
        description="Organized competition — the platform's flagship. Knockout cups with real brackets, prize pools and titles, run esports-style beside the open ladder."
        actions={
          enteredCount > 0 ? (
            <div className="flex flex-col items-end gap-2">
              <SeasonChip compact />
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2 font-mono text-sm">
                cups entered: <span className="font-bold text-emerald-400">{enteredCount}</span>
                {championCount > 0 && <span className="text-amber-400"> · {championCount} won</span>}
              </div>
            </div>
          ) : (
            <SeasonChip compact />
          )
        }
      />

      {/* Format explainer */}
      <section className="grid gap-3 sm:grid-cols-3">
        {FORMATS.map((f) => (
          <div key={f.name} className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
            <div className="flex items-center gap-2.5">
              <span className={cn("inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border", f.accent)}>
                <f.icon className="h-4 w-4" />
              </span>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-300">{f.name}</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">{f.desc}</p>
          </div>
        ))}
      </section>

      <div className="mt-8 space-y-10">
        {data === null && !failed && (
          <>
            <div>
              <SectionHeader icon={Trophy} label="live now" live />
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-72 w-full bg-zinc-800/60" />
                <Skeleton className="h-72 w-full bg-zinc-800/60" />
              </div>
            </div>
            <div>
              <SectionHeader icon={CalendarDays} label="coming up" />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Skeleton className="h-64 w-full bg-zinc-800/60" />
                <Skeleton className="h-64 w-full bg-zinc-800/60" />
              </div>
            </div>
          </>
        )}

        {failed && (
          <EmptyState
            icon={Trophy}
            title="The bracket office is unreachable"
            description="Couldn't load the tournament circuit. Check your connection and try again."
            action={
              <button
                onClick={() => window.location.reload()}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-500 px-5 font-mono text-sm font-bold text-zinc-950 transition-colors hover:bg-emerald-400"
              >
                Retry
              </button>
            }
          />
        )}

        {data && (
          <>
            <section>
              <SectionHeader icon={Trophy} label="live now" live />
              {live.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {live.map((t) => (
                    <TournamentCard key={t.slug} t={t} entry={data.entries[t.slug]} big={isPlayable(t)} userRating={user.rating} />
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-8 text-center font-mono text-sm text-zinc-500">
                  no cups live right now — the next wave is below
                </p>
              )}
            </section>

            {upcoming.length > 0 && (
              <section>
                <SectionHeader icon={CalendarDays} label="coming up" />
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {upcoming.map((t) => (
                    <TournamentCard key={t.slug} t={t} entry={data.entries[t.slug]} userRating={user.rating} />
                  ))}
                </div>
              </section>
            )}

            {completed.length > 0 && (
              <section>
                <SectionHeader icon={Trophy} label="recent results" />
                <div className="grid gap-4 sm:grid-cols-2">
                  {completed.map((t) => (
                    <TournamentCard key={t.slug} t={t} entry={data.entries[t.slug]} userRating={user.rating} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <p className="mt-10 text-center font-mono text-xs text-zinc-600">
        every cup match counts for rating, XP and history — brackets lock when registration closes
      </p>
    </div>
  );
}
