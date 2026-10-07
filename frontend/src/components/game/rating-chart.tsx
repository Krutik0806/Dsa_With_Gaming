
import { useMemo, useState } from "react";
import { Minus, TrendingDown, TrendingUp, Trophy, X } from "lucide-react";
import { RANKS } from "@/lib/game";
import type { RatingPoint } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TooltipState {
  index: number;
  x: number;
  y: number;
}

const W = 720;
const H = 240;
const PAD_L = 44;
const PAD_R = 16;
const PAD_T = 18;
const PAD_B = 26;

/**
 * Rating trajectory chart — SVG line chart with rank-tier bands,
 * win/loss dots and a hover tooltip. Pure presentational, no deps.
 */
export function RatingChart({ points }: { points: RatingPoint[] }) {
  const [hover, setHover] = useState<TooltipState | null>(null);

  const geo = useMemo(() => {
    if (points.length === 0) return null;
    const ratings = points.map((p) => p.rating);
    // Seed the floor with the starting rating so the chart shows where you came from.
    const start = points.length > 0 ? Math.max(100, points[0].rating - points[0].change) : ratings[0];
    const all = [start, ...ratings];
    let min = Math.min(...all);
    let max = Math.max(...all);
    // Comfortable padding, minimum visual span so flat runs still look sane.
    const rawSpan = Math.max(max - min, 60);
    min = min - rawSpan * 0.18;
    max = max + rawSpan * 0.18;
    // Snap outward to nearby rank boundaries when close, so tier bands read clean.
    for (const r of RANKS) {
      if (Math.abs(min - r.min) < rawSpan * 0.3 && r.min < min) min = r.min;
      if (Math.abs(max - r.max) < rawSpan * 0.3 && r.max < 9000 && r.max > max) max = r.max;
    }
    const span = max - min;
    const plotW = W - PAD_L - PAD_R;
    const plotH = H - PAD_T - PAD_B;
    const x = (i: number) => PAD_L + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
    const y = (v: number) => PAD_T + plotH - ((v - min) / (max - min)) * plotH;

    const linePts = points.map((p, i) => [x(i), y(p.rating)] as const);
    const line = linePts.map(([px, py], i) => `${i === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`).join(" ");
    const area = `${line} L${x(points.length - 1).toFixed(1)},${(H - PAD_B).toFixed(1)} L${x(0).toFixed(1)},${(H - PAD_B).toFixed(1)} Z`;

    // Visible rank bands within [min, max]
    const bands = RANKS.filter((r) => r.max > min && r.min < max).map((r) => ({
      key: r.key,
      name: r.name,
      color: r.color,
      yTop: y(Math.min(r.max, max)),
      yBot: y(Math.max(r.min, min)),
    }));

    const peak = Math.max(...ratings);
    const low = Math.min(...ratings);
    const first = ratings[0];
    const last = ratings[ratings.length - 1];

    // 4 nice y-axis ticks
    const ticks = Array.from({ length: 4 }, (_, i) => Math.round(min + ((max - min) * (i + 0.5)) / 4 / 25) * 25);

    return { x, y, line, area, bands, ticks, peak, low, first, last, start, linePts };
  }, [points]);

  if (!geo) return null;

  const active = hover ? points[hover.index] : null;

  return (
    <div className="relative">
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 font-mono text-[11px] text-zinc-500">
        <span className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
          current <b className="text-zinc-200">{geo.last}</b>
        </span>
        <span>
          peak <b className="text-amber-400">{geo.peak}</b>
        </span>
        <span>
          low <b className="text-zinc-400">{geo.low}</b>
        </span>
        <span className="flex items-center gap-1.5">
          trend
          <b className={cn(geo.last >= geo.first ? "text-emerald-400" : "text-red-400")}>
            {geo.last >= geo.first ? "+" : ""}
            {geo.last - geo.first}
          </b>
          over {points.length} rated {points.length === 1 ? "match" : "matches"}
        </span>
        <span className="ml-auto hidden items-center gap-3 sm:flex">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> win
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> loss
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" /> draw
          </span>
        </span>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full touch-none select-none"
          role="img"
          aria-label="Rating trajectory chart"
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="cc-rating-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Rank bands */}
          {geo.bands.map((b) => {
            const h = Math.max(0, b.yBot - b.yTop);
            if (h < 2) return null;
            const dim = h < 18;
            return (
              <g key={b.key}>
                <rect x={PAD_L} y={b.yTop} width={W - PAD_L - PAD_R} height={h} fill={b.color} opacity={dim ? 0.04 : 0.06} />
                {h >= 16 && (
                  <text x={W - PAD_R - 4} y={b.yTop + 11} textAnchor="end" fontSize="8.5" className="font-mono" fill={b.color} opacity="0.75">
                    {b.name.toUpperCase()}
                  </text>
                )}
              </g>
            );
          })}

          {/* Grid ticks */}
          {geo.ticks.map((t) => (
            <g key={t}>
              <line x1={PAD_L} x2={W - PAD_R} y1={geo.y(t)} y2={geo.y(t)} stroke="#27272a" strokeWidth="1" strokeDasharray="3 5" />
              <text x={PAD_L - 7} y={geo.y(t)} textAnchor="end" dominantBaseline="middle" fontSize="9" className="fill-zinc-600 font-mono">
                {t}
              </text>
            </g>
          ))}

          {/* Area + line */}
          <path d={geo.area} fill="url(#cc-rating-fill)" />
          <path d={geo.line} fill="none" stroke="#34d399" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

          {/* Hover crosshair */}
          {hover && (
            <line
              x1={geo.linePts[hover.index][0]}
              x2={geo.linePts[hover.index][0]}
              y1={PAD_T}
              y2={H - PAD_B}
              stroke="#52525b"
              strokeWidth="1"
              strokeDasharray="3 4"
            />
          )}

          {/* Dots + generous hit targets */}
          {points.map((p, i) => {
            const [px, py] = geo.linePts[i];
            const isActive = hover?.index === i;
            return (
              <g key={i}>
                <circle
                  cx={px}
                  cy={py}
                  r={isActive ? 5.5 : 3.5}
                  fill={p.result === "WIN" ? "#34d399" : p.result === "LOSS" ? "#f87171" : "#a1a1aa"}
                  stroke="#09090b"
                  strokeWidth="1.5"
                  className="transition-all"
                />
                <circle
                  cx={px}
                  cy={py}
                  r={14}
                  fill="transparent"
                  onMouseEnter={() => setHover({ index: i, x: px, y: py })}
                />
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {active && hover && (
          <div
            className="pointer-events-none absolute z-10 w-48 -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-950/95 p-2.5 shadow-xl backdrop-blur-sm"
            style={{
              left: `${(hover.x / W) * 100}%`,
              top: 0,
              transform: `translate(${hover.x > W * 0.72 ? "-103%" : hover.x < W * 0.2 ? "3%" : "-50%"}, 0)`,
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase",
                  active.result === "WIN" ? "text-emerald-400" : active.result === "LOSS" ? "text-red-400" : "text-zinc-300"
                )}
              >
                {active.result === "WIN" ? <Trophy className="h-3 w-3" /> : active.result === "LOSS" ? <X className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                {active.result}
              </span>
              <span className={cn("font-mono text-xs font-bold", active.change >= 0 ? "text-emerald-400" : "text-red-400")}>
                {active.change >= 0 ? "+" : ""}
                {active.change}
              </span>
            </div>
            <p className="mt-1 truncate font-mono text-[11px] text-zinc-300">
              vs {active.opponent}
            </p>
            <p className="truncate font-mono text-[10px] text-zinc-500">
              {active.type === "QUIZ" ? "quiz battle" : active.problemTitle ?? "coding battle"} ·{" "}
              {new Date(active.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </p>
            <p className="mt-1 font-mono text-[11px] font-bold text-zinc-100">
              {active.rating} <span className="font-normal text-zinc-500">rating</span>
            </p>
          </div>
        )}
      </div>

      {/* Timeline endpoints */}
      <div className="mt-1 flex items-center justify-between px-1 font-mono text-[10px] text-zinc-600">
        <span className="flex items-center gap-1">
          <TrendingDown className="h-3 w-3" /> start {geo.start}
        </span>
        <span>now {geo.last}</span>
      </div>
    </div>
  );
}
