import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Ban,
  Brackets,
  CalendarDays,
  Check,
  Clock,
  Crown,
  Gift,
  History,
  Hourglass,
  Loader2,
  Lock,
  Shield,
  Skull,
  Swords,
  Timer,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PlayerAvatar } from "@/components/game/player-avatar";
import { RankBadge } from "@/components/game/rank-badge";
import { DifficultyBadge } from "@/components/game/difficulty-badge";
import { CountUp } from "@/components/game/count-up";
import { EmptyState } from "@/components/game/empty-state";
import { useUser, type ClientUser } from "@/components/game/user-provider";
import { ROUND_XP, difficultyForRound, isPlayable, placementLabel, roundName } from "@/lib/data/tournaments";
import type {
  BracketMatch,
  BracketRound,
  TournamentDetailResponse,
  TournamentEntryState,
  TournamentOpponent,
  TournamentSummary,
} from "@/lib/types";
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

function StatusChip({ status }: { status: TournamentSummary["status"] }) {
  if (status === "LIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-400">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </span>
        live
      </span>
    );
  }
  if (status === "UPCOMING") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 font-mono text-[11px] font-semibold text-zinc-400">
        <CalendarDays className="h-3 w-3" /> upcoming
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800/60 px-2 py-0.5 font-mono text-[11px] font-semibold text-zinc-400">
      <Trophy className="h-3 w-3" /> completed
    </span>
  );
}

function EntryStatusChip({ entry }: { entry: TournamentEntryState }) {
  if (entry.status === "CHAMPION") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-amber-400/50 bg-amber-400/10 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-300">
        <Crown className="h-3 w-3" /> champion
      </span>
    );
  }
  if (entry.status === "ELIMINATED") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-red-500/40 bg-red-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-red-400">
        <Ban className="h-3 w-3" /> eliminated
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-400">
      you&apos;re in · round {entry.round}/{entry.roundsTotal}
    </span>
  );
}

function shortRound(name: string): string {
  return name.replace("Quarterfinal", "QF").replace("Semifinal", "SF");
}

function MiniStat({
  label,
  value,
  sub,
  title,
  wrap,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  title?: string;
  wrap?: boolean;
  tone?: "default" | "amber" | "red" | "gold";
}) {
  const toneCls =
    tone === "amber" ? "text-amber-400" : tone === "red" ? "text-red-400" : tone === "gold" ? "text-amber-300" : "text-zinc-100";
  return (
    <div className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3.5 py-2.5" title={title}>
      <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className={cn("mt-0.5 font-mono text-sm font-bold", wrap ? "whitespace-normal leading-snug" : "truncate", toneCls)}>{value}</div>
      {sub && <div className="mt-1">{sub}</div>}
    </div>
  );
}

// ── hero ─────────────────────────────────────────────────────────────────────

function Hero({ t, entry, userRating }: { t: TournamentSummary; entry: TournamentEntryState | null; userRating: number }) {
  const pct = Math.min(100, Math.round((t.playerCount / Math.max(1, t.maxPlayers)) * 100));
  const locked = t.ratingRequirement !== undefined && userRating < t.ratingRequirement;
  return (
    <section className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span className="w-1 shrink-0 self-stretch rounded-full" style={{ backgroundColor: t.themeColor }} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              {t.status === "LIVE" && <LiveDot />}
              <h1 className="text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">{t.name}</h1>
              {entry && <EntryStatusChip entry={entry} />}
            </div>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-400">{t.tagline}</p>
            <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
              <StatusChip status={t.status} />
              <FormatChip format={t.format} />
              <GameTypeChip gameType={t.gameType} />
              <DifficultyBadge difficulty={t.difficulty} />
              {t.ratingRequirement !== undefined && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold",
                    locked ? "border-red-500/40 bg-red-500/10 text-red-400" : "border-zinc-700 bg-zinc-800/60 text-zinc-400"
                  )}
                  title={locked ? `You need ${t.ratingRequirement}+ rating (you're at ${userRating})` : `Open to ${t.ratingRequirement}+ rating`}
                >
                  <Shield className="h-3 w-3" />
                  {t.ratingRequirement}+
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="grid w-full shrink-0 grid-cols-2 gap-2.5 sm:grid-cols-4 xl:w-[21rem] xl:grid-cols-2">
          <MiniStat
            label="prize pool"
            tone="amber"
            wrap
            value={<><Gift className="mr-1 inline h-3.5 w-3.5" />{t.prizeXp.toLocaleString()} XP</>}
            sub={t.prizeTitle ? <span className="block truncate font-mono text-[10px] text-zinc-500" title={t.prizeTitle}>title: {t.prizeTitle}</span> : undefined}
          />
          <MiniStat
            label="entrants"
            value={`${t.playerCount} / ${t.maxPlayers}`}
            sub={
              <div className="h-1 overflow-hidden rounded-full bg-zinc-800">
                <div className={cn("h-full rounded-full", t.status === "LIVE" ? "bg-emerald-500" : "bg-zinc-600")} style={{ width: `${pct}%` }} />
              </div>
            }
          />
          <MiniStat
            label={t.format === "KNOCKOUT" ? "rounds" : "format"}
            value={t.format === "KNOCKOUT" ? `${t.roundsTotal} × KO` : `${t.roundsTotal} session`}
            sub={
              <span className="block truncate font-mono text-[10px] text-zinc-500">
                {t.format === "KNOCKOUT"
                  ? Array.from({ length: t.roundsTotal }, (_, i) => shortRound(roundName(i + 1, t.roundsTotal))).join(" · ")
                  : t.format === "ARENA"
                    ? "open room · points table"
                    : "timed marathon"}
              </span>
            }
          />
          <MiniStat
            label="window"
            title={t.startsIn}
            wrap
            value={t.startsIn ?? (t.status === "COMPLETED" ? "cup finished" : "schedule tbd")}
            sub={
              <span className="block truncate font-mono text-[10px] text-zinc-500">
                {t.status === "LIVE"
                  ? entry
                    ? entry.status === "CHAMPION"
                      ? "you won this cup"
                      : entry.status === "ELIMINATED"
                        ? "your run is over"
                        : "you're in the field"
                    : "registration open"
                  : t.status === "UPCOMING"
                    ? "not started"
                    : "archived"}
              </span>
            }
          />
        </div>
      </div>
    </section>
  );
}

// ── bracket visualization ────────────────────────────────────────────────────

function BracketPlayerRow({
  name,
  score,
  match,
  players,
  playerName,
  preview,
}: {
  name: string;
  score: number | null;
  match: BracketMatch;
  players: Record<string, TournamentOpponent>;
  playerName: string;
  preview: boolean;
}) {
  const you = name === playerName;
  const info = name ? players[name] : undefined;
  const won = match.winner !== null && name !== "" && match.winner === name;
  const lost = match.winner !== null && name !== "" && match.winner !== name;

  if (preview) {
    const awaiting = name.startsWith("winner");
    return (
      <div className="flex items-center justify-between gap-2 px-2.5 py-[7px]">
        <span className={cn("truncate font-mono text-[11px]", awaiting ? "italic text-zinc-700" : "text-zinc-500")}>{name || "—"}</span>
        <span className="font-mono text-[11px] text-zinc-700">—</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1.5 px-2.5 py-[7px]", lost && "opacity-40")}>
      {name ? (
        <PlayerAvatar name={name} size="sm" isBot={false} color={info?.color} />
      ) : (
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-dashed border-zinc-800 font-mono text-[10px] text-zinc-700">
          ?
        </span>
      )}
      <span className={cn("min-w-0 truncate font-mono text-xs", you ? "font-bold text-emerald-400" : name ? "text-zinc-300" : "text-zinc-600")}>
        {name || "—"}
      </span>
      {you && (
        <span className="shrink-0 rounded bg-emerald-500 px-1 py-px font-mono text-[8px] font-bold uppercase tracking-wide text-zinc-950">you</span>
      )}
      <span className="ml-auto shrink-0 font-mono text-[10px] tabular-nums text-zinc-600">{info ? info.rating : ""}</span>
      <span className={cn("w-7 shrink-0 text-right font-mono text-xs font-bold tabular-nums", won ? "text-emerald-400" : "text-zinc-500")}>
        {score ?? "—"}
      </span>
      {won && <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />}
    </div>
  );
}

function BracketMatchCard({
  match,
  players,
  playerName,
  nowPlaying,
  preview,
}: {
  match: BracketMatch;
  players: Record<string, TournamentOpponent>;
  playerName: string;
  nowPlaying: boolean;
  preview: boolean;
}) {
  const resolved = match.winner !== null;
  const involvesYou = match.a === playerName || match.b === playerName;
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-zinc-950/70",
        resolved ? "border-emerald-500/40" : "border-zinc-800",
        involvesYou && !resolved && "border-emerald-500/40 bg-emerald-500/[0.05]",
        nowPlaying && "border-amber-500/60 ring-2 ring-amber-500/25",
        preview && "border-dashed border-zinc-800/70 bg-zinc-950/40"
      )}
    >
      <BracketPlayerRow name={match.a} score={match.scoreA} match={match} players={players} playerName={playerName} preview={preview} />
      <div className="h-px bg-zinc-800/60" />
      <BracketPlayerRow name={match.b} score={match.scoreB} match={match} players={players} playerName={playerName} preview={preview} />
    </div>
  );
}

function BracketView({
  rounds,
  players,
  playerName,
  currentRound,
  preview = false,
}: {
  rounds: BracketRound[];
  players: Record<string, TournamentOpponent>;
  playerName: string;
  currentRound: number | null;
  preview?: boolean;
}) {
  return (
    <div
      className="grid gap-8 md:grid-cols-[repeat(var(--bracket-cols),minmax(0,1fr))] md:gap-10"
      style={{ "--bracket-cols": String(rounds.length) } as CSSProperties}
    >
      {rounds.map((round, ri) => {
        const isCurrent = currentRound === ri + 1;
        return (
          <div key={round.name} className="flex flex-col">
            <div className="mb-5 flex h-4 items-center gap-2">
              {isCurrent && <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-amber-400" />}
              <span
                className={cn(
                  "truncate font-mono text-[11px] font-bold uppercase tracking-[0.18em]",
                  isCurrent ? "text-amber-400" : "text-zinc-500"
                )}
              >
                {round.name}
              </span>
              {isCurrent && (
                <span className="shrink-0 font-mono text-[10px] font-semibold uppercase tracking-wider text-amber-500/90">now playing</span>
              )}
            </div>
            <div className="relative flex flex-col gap-3 md:flex-1 md:justify-around md:gap-0">
              {/* vertical connector: joins the two feeder matches below into this round's slot */}
              {ri > 0 &&
                round.matches.map((_, i) => {
                  const n = round.matches.length;
                  const top = ((4 * i + 1) / (4 * n)) * 100;
                  const height = (2 / (4 * n)) * 100;
                  return (
                    <span
                      key={`conn-${i}`}
                      className="absolute left-0 hidden w-px bg-zinc-800 md:block"
                      style={{ top: `${top}%`, height: `${height}%` }}
                    />
                  );
                })}
              {round.matches.map((match, mi) => (
                <div key={mi} className="relative py-1 md:py-1.5">
                  {ri < rounds.length - 1 && (
                    <span className="absolute -right-10 top-1/2 hidden h-px w-10 bg-zinc-800 md:block" />
                  )}
                  <BracketMatchCard match={match} players={players} playerName={playerName} nowPlaying={isCurrent} preview={preview} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BracketLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 font-mono text-[10px] uppercase tracking-wider text-zinc-600">
      <span className="flex items-center gap-1">
        <Check className="h-3 w-3 text-emerald-500" /> winner
      </span>
      <span className="flex items-center gap-1">
        <span className="h-2 w-2 rounded-[3px] border border-amber-500/70" /> live round
      </span>
      <span className="flex items-center gap-1">
        <span className="rounded bg-emerald-500 px-1 py-px text-[8px] font-bold text-zinc-950">you</span> your match
      </span>
    </div>
  );
}

function BracketCard({ tournament, entry }: { tournament: TournamentSummary; entry: TournamentEntryState }) {
  const currentRound = entry.status === "ACTIVE" ? entry.round : null;
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">the bracket</h2>
        <BracketLegend />
      </div>
      {entry.bracket.rounds.length === 0 ? (
        <p className="py-10 text-center font-mono text-sm text-zinc-500">bracket data unavailable for this run</p>
      ) : (
        <BracketView
          rounds={entry.bracket.rounds}
          players={entry.bracket.players}
          playerName={entry.bracket.playerName}
          currentRound={currentRound}
        />
      )}
      {tournament.status === "LIVE" && entry.status === "ACTIVE" && (
        <p className="mt-6 text-center font-mono text-[11px] text-zinc-600">
          other matches resolve the moment yours is scored — win and your next opponent appears instantly
        </p>
      )}
    </section>
  );
}

/** Seeded placeholder bracket shown before registering. */
function previewBracketRounds(): BracketRound[] {
  const pairings = [
    [0, 7],
    [3, 4],
    [1, 6],
    [2, 5],
  ];
  return [
    {
      name: "Quarterfinal",
      matches: pairings.map(([a, b]) => ({ a: `seed ${a + 1}`, b: `seed ${b + 1}`, scoreA: null, scoreB: null, winner: null })),
    },
    {
      name: "Semifinal",
      matches: [0, 1].map((i) => ({ a: `winner QF${i * 2 + 1}`, b: `winner QF${i * 2 + 2}`, scoreA: null, scoreB: null, winner: null })),
    },
    { name: "Final", matches: [{ a: "winner SF1", b: "winner SF2", scoreA: null, scoreB: null, winner: null }] },
  ];
}

function PreviewBracketCard({ t }: { t: TournamentSummary }) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">the bracket · preview</h2>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400">
          <LiveDot /> registration open
        </span>
      </div>
      <p className="mb-6 max-w-xl text-xs leading-relaxed text-zinc-500">
        Eight seeds, standard pairings (1v8, 4v5, 2v7, 3v6). Brackets are drawn per entrant — enter the cup to pull your
        slot and watch your name climb it.
      </p>
      <BracketView rounds={previewBracketRounds()} players={{}} playerName="" currentRound={null} preview />
    </section>
  );
}

// ── your run / register panels ───────────────────────────────────────────────

function YourRunCard({ tournament, entry }: { tournament: TournamentSummary; entry: TournamentEntryState }) {
  const { status, round, roundsTotal, placement, nextOpponent, xpAwarded } = entry;
  const playHref =
    tournament.gameType === "CODING" ? `/app/game/battle?t=${tournament.slug}` : `/app/game/quiz?t=${tournament.slug}`;
  const winReward =
    round >= roundsTotal ? ROUND_XP[Math.min(ROUND_XP.length - 1, round - 1)] + tournament.prizeXp : ROUND_XP[Math.min(ROUND_XP.length - 1, round - 1)];

  return (
    <section
      className={cn(
        "rounded-2xl border p-5",
        status === "CHAMPION"
          ? "border-amber-400/40 bg-gradient-to-b from-amber-400/10 to-zinc-900/40"
          : status === "ELIMINATED"
            ? "border-red-500/30 bg-zinc-900/40"
            : "border-emerald-500/30 bg-zinc-900/40"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">your run</h2>
        {status !== "ACTIVE" && <EntryStatusChip entry={entry} />}
        {status === "ACTIVE" && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            active · round {round}/{roundsTotal}
          </span>
        )}
      </div>

      {/* Round progress */}
      <div className="mt-4 flex items-start gap-1.5">
        {Array.from({ length: roundsTotal }, (_, i) => {
          const r = i + 1;
          const done = status === "CHAMPION" || r < round;
          const current = status === "ACTIVE" && r === round;
          return (
            <div key={r} className="min-w-0 flex-1">
              <div className={cn("h-1.5 rounded-full", done ? "bg-emerald-500" : current ? "animate-pulse bg-amber-400" : "bg-zinc-800")} />
              <p
                className={cn(
                  "mt-1.5 truncate text-center font-mono text-[10px] uppercase tracking-wider",
                  current ? "text-amber-400" : done ? "text-emerald-500" : "text-zinc-600"
                )}
              >
                {shortRound(roundName(r, roundsTotal))}
              </p>
            </div>
          );
        })}
      </div>

      {status === "ACTIVE" && nextOpponent && (
        <>
          <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              next opponent · {roundName(round, roundsTotal)}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <PlayerAvatar name={nextOpponent.name} size="md" isBot={false} color={nextOpponent.color} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-sm font-bold text-zinc-100">{nextOpponent.name}</p>
                <p className="font-mono text-[11px] text-zinc-500">{nextOpponent.rating} rating</p>
              </div>
              <RankBadge rating={nextOpponent.rating} />
            </div>
            <p className="mt-2.5 text-xs italic text-zinc-500">&ldquo;{nextOpponent.tagline}&rdquo;</p>
          </div>
          <Link to={playHref}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-emerald-500 px-6 font-mono text-sm font-bold text-zinc-950 transition-all hover:bg-emerald-400 hover:shadow-[0_0_24px_-6px_rgba(52,211,153,0.7)]"
          >
            {tournament.gameType === "CODING" ? <Swords className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
            play {roundName(round, roundsTotal).toLowerCase()}
            <span aria-hidden>→</span>
          </Link>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-500">
              round difficulty <DifficultyBadge difficulty={difficultyForRound(tournament.difficulty, round)} />
            </span>
            <span className="font-mono text-[11px] text-zinc-500">
              a win banks <span className="font-bold text-amber-400">+{winReward.toLocaleString()} XP</span>
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
            <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">xp banked so far</span>
            <span className="font-mono text-sm font-bold text-amber-400">+{xpAwarded.toLocaleString()} XP</span>
          </div>
        </>
      )}

      {status === "CHAMPION" && (
        <div className="mt-5 text-center">
          <Crown className="mx-auto h-10 w-10 text-amber-400" />
          <p className="mt-2 font-mono text-xl font-black tracking-wide text-amber-300">CHAMPION</p>
          {tournament.prizeTitle && (
            <p className="mt-1 font-mono text-xs text-amber-500/90">title earned — {tournament.prizeTitle}</p>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <MiniStat label="placement" tone="gold" value="#1" />
            <MiniStat label="xp banked" tone="amber" value={<CountUp to={xpAwarded} suffix=" XP" />} />
          </div>
          <p className="mt-3.5 font-mono text-[11px] text-zinc-500">
            perfect run — {roundsTotal}/{roundsTotal} matches won · the cup is yours until the next edition
          </p>
        </div>
      )}

      {status === "ELIMINATED" && (
        <div className="mt-5">
          <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <Ban className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            <div>
              <p className="text-sm font-semibold text-red-300">knocked out in the {roundName(round, roundsTotal)}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
                Win or go home — that&apos;s cup law. The bracket below tells the full story of your run.
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <MiniStat label="placement" tone="red" value={placementLabel(placement)} />
            <MiniStat label="xp banked" tone="amber" value={`+${xpAwarded.toLocaleString()} XP`} />
          </div>
        </div>
      )}
    </section>
  );
}

function RegisterCard({
  t,
  userRating,
  registering,
  onRegister,
}: {
  t: TournamentSummary;
  userRating: number;
  registering: boolean;
  onRegister: () => void;
}) {
  const pct = Math.min(100, Math.round((t.playerCount / Math.max(1, t.maxPlayers)) * 100));
  const locked = t.ratingRequirement !== undefined && userRating < t.ratingRequirement;
  return (
    <section className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">registration</h2>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-400">
          <LiveDot /> open
        </span>
      </div>

      <ul className="mt-4 space-y-2.5 text-sm">
        <li className="flex items-center gap-2.5 text-zinc-300">
          <Brackets className="h-4 w-4 shrink-0 text-zinc-500" />
          8-player bracket, drawn the moment you enter
        </li>
        <li className="flex items-center gap-2.5 text-zinc-300">
          <Gift className="h-4 w-4 shrink-0 text-zinc-500" />
          +50 XP entry bonus · more for every round you win
        </li>
        <li className="flex items-center gap-2.5 text-zinc-300">
          <Skull className="h-4 w-4 shrink-0 text-zinc-500" />
          knockout law — one loss and the run is over
        </li>
      </ul>

      <div className="mt-5">
        <div className="flex items-center justify-between font-mono text-[11px] text-zinc-500">
          <span>entrants</span>
          <span className="text-zinc-300">
            {t.playerCount} / {t.maxPlayers}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <button
        onClick={onRegister}
        disabled={registering}
        className="mt-5 flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-emerald-500 px-6 font-mono text-sm font-bold text-zinc-950 transition-all hover:bg-emerald-400 hover:shadow-[0_0_24px_-6px_rgba(52,211,153,0.7)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {registering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />}
        {registering ? "drawing your bracket…" : "enter the cup"}
      </button>

      {locked && (
        <p className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-center font-mono text-[11px] text-amber-400">
          <Lock className="h-3 w-3 shrink-0" />
          requires {t.ratingRequirement}+ rating — you&apos;re at {userRating}
        </p>
      )}
    </section>
  );
}

// ── standings / schedule / rules ─────────────────────────────────────────────

const MEDAL_CARD_STYLES = [
  "border-amber-400/40 bg-amber-400/5 sm:-translate-y-2",
  "border-zinc-400/30 bg-zinc-800/30",
  "border-amber-700/40 bg-amber-950/10",
];

const MEDAL_CHIP_STYLES = [
  "border-amber-400 bg-amber-400 text-zinc-950",
  "border-zinc-400 bg-zinc-700 text-zinc-100",
  "border-amber-700 bg-amber-800 text-amber-100",
];

function StandingsCard({ t }: { t: TournamentSummary }) {
  const standings = t.standings ?? [];
  const podium = standings.slice(0, 3);
  const rest = standings.slice(3);
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">final standings</h2>
        <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">
          cup finished · {t.playerCount} players · {t.prizeXp.toLocaleString()} XP awarded
        </span>
      </div>
      {standings.length === 0 ? (
        <p className="py-10 text-center font-mono text-sm text-zinc-500">no standings recorded for this cup</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {podium.map((s, i) => (
              <div key={s.name} className={cn("relative rounded-2xl border p-4 pt-5 text-center", MEDAL_CARD_STYLES[i])}>
                <span
                  className={cn(
                    "absolute -top-3 left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full border font-mono text-xs font-black",
                    MEDAL_CHIP_STYLES[i]
                  )}
                >
                  {s.place}
                </span>
                {i === 0 && <Crown className="mx-auto mb-1 h-5 w-5 text-amber-400" />}
                <div className="mt-1 flex justify-center">
                  <PlayerAvatar name={s.name} size="md" isBot={false} />
                </div>
                <p className="mt-2.5 truncate font-mono text-sm font-bold text-zinc-100">{s.name}</p>
                <p className="mt-0.5 font-mono text-lg font-black text-amber-300">
                  {s.points.toLocaleString()} <span className="text-xs font-bold text-zinc-500">pts</span>
                </p>
              </div>
            ))}
          </div>
          {rest.length > 0 && (
            <ul className="cc-scroll-thin mt-4 max-h-72 divide-y divide-zinc-800/70 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/40">
              {rest.map((s) => (
                <li key={s.name} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="w-6 shrink-0 text-right font-mono text-xs text-zinc-600">{s.place}</span>
                  <PlayerAvatar name={s.name} size="sm" isBot={false} />
                  <span className="min-w-0 flex-1 truncate font-mono text-sm text-zinc-300">{s.name}</span>
                  <span className="shrink-0 font-mono text-xs font-bold text-zinc-400 tabular-nums">
                    {s.points.toLocaleString()} pts
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

function UpcomingPanel({ t }: { t: TournamentSummary }) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">the bracket</h2>
        <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">drawn when registration closes</span>
      </div>
      <div className="flex flex-col items-center py-10 text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10">
          <CalendarDays className="h-7 w-7 text-amber-400" />
        </span>
        <p className="mt-4 font-mono text-base font-bold text-zinc-200">{t.startsIn ?? "schedule tbd"}</p>
        <span className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 font-mono text-[11px] font-bold text-amber-400">
          <Hourglass className="h-3 w-3" /> registration opens soon
        </span>
        <p className="mt-4 max-w-sm text-xs leading-relaxed text-zinc-500">
          {t.playerCount} of {t.maxPlayers} seats pre-registered. When the window closes the bracket locks, seeds drop,
          and {t.format === "KNOCKOUT" ? "the knockout begins" : "the session goes live"}.
        </p>
      </div>
    </section>
  );
}

function HowCupsWork({ t }: { t: TournamentSummary }) {
  const knockout = t.format === "KNOCKOUT";
  const ramp = Array.from({ length: t.roundsTotal }, (_, i) => difficultyForRound(t.difficulty, i + 1));
  const items: { icon: LucideIcon; title: string; desc?: string; node?: ReactNode }[] = knockout
    ? [
        { icon: Brackets, title: `${t.roundsTotal} knockout rounds`, desc: "Quarterfinal → semifinal → final. Straight wins take the cup." },
        {
          icon: TrendingUp,
          title: "Difficulty ramps each round",
          node: (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {ramp.map((d, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] uppercase text-zinc-600">{shortRound(roundName(i + 1, t.roundsTotal))}</span>
                  <DifficultyBadge difficulty={d} />
                </span>
              ))}
            </div>
          ),
        },
        { icon: Skull, title: "Win or go home", desc: "A loss eliminates you on the spot — cup draws go to the opponent." },
        {
          icon: Gift,
          title: "Prizes",
          desc: `+50 XP for entering, more per round won, and the full ${t.prizeXp.toLocaleString()} XP pool${t.prizeTitle ? ` + "${t.prizeTitle}" title` : ""} for the champion.`,
        },
      ]
    : [
        { icon: Users, title: "One-shot session", desc: "Everyone plays at once — no bracket, standings decide the podium." },
        {
          icon: Gift,
          title: "Prizes",
          desc: `The full ${t.prizeXp.toLocaleString()} XP pool${t.prizeTitle ? ` + "${t.prizeTitle}" title` : ""} goes to the podium.`,
        },
      ];
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
      <h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">how cups work</h2>
      <ul className="mt-4 space-y-4">
        {items.map((it) => (
          <li key={it.title} className="flex gap-3">
            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/60 text-zinc-400">
              <it.icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-200">{it.title}</p>
              {it.node ?? <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{it.desc}</p>}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex items-start gap-1.5 border-t border-zinc-800/70 pt-3.5 font-mono text-[10px] leading-relaxed text-zinc-600">
        <History className="mt-px h-3 w-3 shrink-0" />
        every cup match is scored by the arena judge and lands in your history with full analysis
      </p>
    </section>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function TournamentDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const { user, setUser } = useUser();
  const [data, setData] = useState<TournamentDetailResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    setData(null);
    setFailed(false);
    if (!slug) {
      setFailed(true);
      return;
    }
    fetch(`/api/tournaments/${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((d: TournamentDetailResponse) => setData(d))
      .catch(() => setFailed(true));
  }, [slug]);

  async function register() {
    if (!data || registering) return;
    setRegistering(true);
    try {
      const res = await fetch(`/api/tournaments/${encodeURIComponent(slug)}`, { method: "POST" });
      const json: { error?: string; entry?: TournamentEntryState; user?: ClientUser } = await res.json();
      if (!res.ok || !json.entry) {
        toast.error(json.error ?? "Registration failed");
        return;
      }
      setData({ tournament: data.tournament, entry: json.entry });
      if (json.user) setUser(json.user);
      toast.success(`You're in — ${data.tournament.name}. Bracket drawn, +50 XP entry bonus.`);
    } catch {
      toast.error("Network error — try again");
    } finally {
      setRegistering(false);
    }
  }

  if (failed) {
    return (
      <div className="cc-rise">
        <Link to="/app/tournaments"
          className="mb-5 inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-zinc-500 transition-colors hover:text-emerald-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> all tournaments
        </Link>
        <EmptyState
          icon={Trophy}
          title="Cup not found"
          description="This tournament doesn't exist — it may have been retired, or the link is off."
          action={
            <Link to="/app/tournaments"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-500 px-5 font-mono text-sm font-bold text-zinc-950 transition-colors hover:bg-emerald-400"
            >
              <ArrowLeft className="h-4 w-4" /> back to the circuit
            </Link>
          }
        />
      </div>
    );
  }

  const t = data?.tournament;
  const entry = data?.entry ?? null;

  return (
    <div className="cc-rise">
      <Link to="/app/tournaments"
        className="mb-5 inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-zinc-500 transition-colors hover:text-emerald-400"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> all tournaments
      </Link>

      {data === null || t === undefined ? (
        <div className="space-y-6">
          <Skeleton className="h-44 w-full bg-zinc-800/60" />
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <Skeleton className="h-72 w-full bg-zinc-800/60" />
            <Skeleton className="h-72 w-full bg-zinc-800/60" />
          </div>
          <Skeleton className="h-80 w-full bg-zinc-800/60" />
        </div>
      ) : (
        <>
          <Hero t={t} entry={entry} userRating={user.rating} />

          {entry ? (
            <>
              <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
                <YourRunCard tournament={t} entry={entry} />
                <HowCupsWork t={t} />
              </div>
              <div className="mt-6">
                <BracketCard tournament={t} entry={entry} />
              </div>
            </>
          ) : isPlayable(t) ? (
            <>
              <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
                <RegisterCard t={t} userRating={user.rating} registering={registering} onRegister={register} />
                <HowCupsWork t={t} />
              </div>
              <div className="mt-6">
                <PreviewBracketCard t={t} />
              </div>
            </>
          ) : (
            <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              {t.status === "COMPLETED" ? <StandingsCard t={t} /> : <UpcomingPanel t={t} />}
              <HowCupsWork t={t} />
            </div>
          )}

          <p className="mt-8 flex flex-wrap items-center justify-center gap-1.5 text-center font-mono text-xs text-zinc-600">
            <Clock className="h-3 w-3" />
            cup matches count for rating &amp; XP and land in
            <Link to="/app/history" className="text-emerald-400 transition-colors hover:text-emerald-300">
              history
            </Link>
            with full analysis
          </p>
        </>
      )}
    </div>
  );
}
