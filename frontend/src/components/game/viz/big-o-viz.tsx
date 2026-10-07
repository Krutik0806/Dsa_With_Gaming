import { useState, useMemo } from "react";
import { Gauge, Play, RotateCcw, Zap, Sparkles, CheckCircle2 } from "lucide-react";

interface CurveMeta {
  key: string;
  name: string;
  formula: string;
  color: string;
  bgBadge: string;
  calc: (n: number) => number;
  example: string;
}

const COMPLEXITIES: CurveMeta[] = [
  {
    key: "o1",
    name: "O(1)",
    formula: "Constant",
    color: "#10b981", // emerald
    bgBadge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    calc: () => 1,
    example: "Array access, Hash table lookup",
  },
  {
    key: "ologn",
    name: "O(log n)",
    formula: "Logarithmic",
    color: "#06b6d4", // cyan
    bgBadge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    calc: (n) => Math.max(1, Math.round(Math.log2(n))),
    example: "Binary search, balanced tree lookup",
  },
  {
    key: "on",
    name: "O(n)",
    formula: "Linear",
    color: "#6366f1", // indigo
    bgBadge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    calc: (n) => n,
    example: "Linear scan, array traversal",
  },
  {
    key: "onlogn",
    name: "O(n log n)",
    formula: "Linearithmic",
    color: "#a855f7", // purple
    bgBadge: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    calc: (n) => Math.round(n * Math.log2(n || 1)),
    example: "Merge sort, quick sort (average)",
  },
  {
    key: "on2",
    name: "O(n²)",
    formula: "Quadratic",
    color: "#f59e0b", // amber
    bgBadge: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    calc: (n) => n * n,
    example: "Bubble sort, nested pair loops",
  },
  {
    key: "o2n",
    name: "O(2ⁿ)",
    formula: "Exponential",
    color: "#ef4444", // rose/red
    bgBadge: "bg-red-500/10 text-red-400 border-red-500/30",
    calc: (n) => (n > 30 ? Infinity : Math.pow(2, n)),
    example: "Subsets, recursive Fibonacci without memo",
  },
];

export function BigOViz() {
  const [n, setN] = useState<number>(32);
  const [selectedCurve, setSelectedCurve] = useState<string>("on");
  const [racing, setRacing] = useState<boolean>(false);
  const [progress, setProgress] = useState<Record<string, number>>({});

  const formatOps = (val: number) => {
    if (!Number.isFinite(val) || val > 1e12) return "> 1 Trillion";
    if (val >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
    if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
    return val.toString();
  };

  const startRace = () => {
    setRacing(true);
    setProgress({ o1: 0, ologn: 0, on: 0, onlogn: 0, on2: 0, o2n: 0 });

    const speeds: Record<string, number> = {
      o1: 18,
      ologn: 14,
      on: 8,
      onlogn: 4.5,
      on2: 1.5,
      o2n: 0.3,
    };

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next: Record<string, number> = { ...prev };
        let allDone = true;
        for (const c of COMPLEXITIES) {
          const cur = prev[c.key] || 0;
          if (cur < 100) {
            allDone = false;
            next[c.key] = Math.min(100, cur + (speeds[c.key] || 5));
          }
        }
        if (allDone) {
          clearInterval(interval);
          setRacing(false);
        }
        return next;
      });
    }, 60);
  };

  const resetRace = () => {
    setRacing(false);
    setProgress({});
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl text-zinc-100">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Gauge className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold tracking-tight">Interactive Big-O Growth Comparator</h3>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Slide <code className="text-emerald-400 font-mono font-bold">n</code> to see how operation counts diverge as inputs grow.
          </p>
        </div>

        {/* Input slider */}
        <div className="flex items-center gap-3 bg-zinc-900/80 px-4 py-2 rounded-xl border border-zinc-800">
          <span className="text-xs text-zinc-400 font-medium">Input Size:</span>
          <span className="font-mono font-bold text-sm text-emerald-400 min-w-[3rem] text-right">
            n = {n}
          </span>
          <input
            type="range"
            min="2"
            max="128"
            step="2"
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
            className="w-28 sm:w-40 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>
      </div>

      {/* Real-time Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-6">
        {COMPLEXITIES.map((c) => {
          const ops = c.calc(n);
          const isSelected = selectedCurve === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setSelectedCurve(c.key)}
              className={`rounded-xl p-3 text-left transition-all border ${
                isSelected
                  ? "border-emerald-500 bg-zinc-900 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500"
                  : "border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono font-black text-sm" style={{ color: c.color }}>
                  {c.name}
                </span>
                <span className="text-[10px] text-zinc-400 font-sans">{c.formula}</span>
              </div>
              <div className="text-base font-bold font-mono text-zinc-100 mb-1">
                {formatOps(ops)}
              </div>
              <span className="text-[10.5px] text-zinc-500 block truncate" title={c.example}>
                {c.example}
              </span>
            </button>
          );
        })}
      </div>

      {/* Algorithm Execution Race */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Execution Speed Simulation (for n = {n})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={startRace}
              disabled={racing}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500 text-zinc-950 font-bold text-xs hover:bg-emerald-400 disabled:opacity-50 transition-colors shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {racing ? "Simulating..." : "Run Race"}
            </button>
            <button
              onClick={resetRace}
              className="p-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress bars */}
        <div className="space-y-2.5">
          {COMPLEXITIES.map((c) => {
            const p = progress[c.key] || 0;
            const ops = c.calc(n);
            return (
              <div key={c.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="font-bold min-w-[4.5rem]" style={{ color: c.color }}>
                      {c.name}
                    </span>
                    <span className="text-zinc-400 text-[11px] hidden sm:inline">{c.formula}</span>
                  </div>
                  <span className="text-zinc-400 text-[11px]">
                    {p === 100 ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Finished ({formatOps(ops)} ops)
                      </span>
                    ) : (
                      `${Math.round(p)}%`
                    )}
                  </span>
                </div>
                <div className="w-full bg-zinc-800/80 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-75"
                    style={{
                      width: `${p}%`,
                      backgroundColor: c.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
