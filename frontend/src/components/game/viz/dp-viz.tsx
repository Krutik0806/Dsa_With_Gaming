
import { useEffect, useMemo, useState } from "react";
import { VizControls, VizShell } from "./viz-shell";

const N = 10;

interface DPFrame {
  i: number;
  dp: number[];
  note: string;
  done: boolean;
}

function dpFrames(): DPFrame[] {
  const dp: number[] = new Array(N + 1).fill(0);
  const frames: DPFrame[] = [{ i: -1, dp: [...dp], note: "dp[i] = distinct ways to stand on stair i. Base cases first.", done: false }];
  dp[0] = 1;
  frames.push({ i: 0, dp: [...dp], note: "dp[0] = 1 — standing at the bottom: exactly one way (do nothing).", done: false });
  dp[1] = 1;
  frames.push({ i: 1, dp: [...dp], note: "dp[1] = 1 — a single 1-step hop. Only one way.", done: false });
  for (let i = 2; i <= N; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
    frames.push({
      i,
      dp: [...dp],
      note: `dp[${i}] = dp[${i - 1}] + dp[${i - 2}] = ${dp[i - 1]} + ${dp[i - 2]} = ${dp[i]} — arrive via one step or two.`,
      done: false,
    });
  }
  frames.push({ i: N, dp: [...dp], note: `Done — dp[${N}] = ${dp[N]} distinct ways to climb ${N} stairs. Hello, Fibonacci.`, done: true });
  return frames;
}

export function DPViz() {
  const frames = useMemo(() => dpFrames(), []);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(900);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setIdx((prev) => {
        if (prev >= frames.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, speed);
    return () => clearInterval(t);
  }, [playing, speed, frames.length]);

  const f = frames[Math.min(idx, frames.length - 1)];

  return (
    <VizShell title="Climbing stairs — tabulation" note={f.note}>
      <div className="mb-4">
        <VizControls
          playing={playing}
          onTogglePlay={() => setPlaying((p) => !p)}
          onStep={() => setIdx((i) => Math.min(i + 1, frames.length - 1))}
          onReset={() => {
            setPlaying(false);
            setIdx(0);
          }}
          speed={speed}
          onSpeedChange={setSpeed}
        />
      </div>
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max items-end justify-center gap-1.5">
          {f.dp.map((v, i) => {
            const isCurrent = i === f.i && !f.done;
            const isSource = (i === f.i - 1 || i === f.i - 2) && !f.done;
            const filled = v > 0;
            const h = Math.max(6, Math.min(110, v * 9));
            return (
              <div key={i} className="flex w-11 flex-col items-center gap-1.5">
                <span className={`font-mono text-xs font-bold ${isCurrent ? "text-amber-300" : filled ? "text-zinc-200" : "text-zinc-600"}`}>
                  {v > 0 ? v : "·"}
                </span>
                <div
                  className={`w-full rounded-t-md border transition-all duration-300 ${
                    isCurrent
                      ? "border-amber-400 bg-amber-400/30"
                      : isSource
                        ? "border-amber-500/60 bg-amber-500/15"
                        : filled
                          ? "border-emerald-600/50 bg-emerald-500/25"
                          : "border-zinc-800 bg-zinc-900"
                  }`}
                  style={{ height: `${h}px` }}
                />
                <span className={`font-mono text-[10px] ${isCurrent ? "font-bold text-amber-300" : "text-zinc-500"}`}>dp[{i}]</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-2 text-center font-mono text-[11px] text-zinc-500">
        <span className="text-amber-400">■</span> current <span className="mx-2 text-amber-500/60">■</span> recurrence sources{" "}
        <span className="text-emerald-400">■</span> filled
      </div>
    </VizShell>
  );
}
