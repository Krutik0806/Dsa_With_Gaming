
import { useEffect, useMemo, useState } from "react";
import { VizControls, VizShell } from "./viz-shell";

const ARR = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
const TARGET = 23;

interface BSFrame {
  lo: number;
  hi: number;
  mid: number;
  note: string;
  found: boolean;
}

function bsFrames(arr: number[], target: number): BSFrame[] {
  const frames: BSFrame[] = [];
  let lo = 0;
  let hi = arr.length - 1;
  frames.push({ lo, hi, mid: -1, note: `Search ${target} in [${arr[lo]}…${arr[hi]}]. Window has ${hi - lo + 1} candidates.`, found: false });
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    frames.push({ lo, hi, mid, note: `mid = lo + (hi−lo)/2 → index ${mid}, value ${arr[mid]}.`, found: false });
    if (arr[mid] === target) {
      frames.push({ lo, hi, mid, note: `${arr[mid]} = ${target} ✓ Found at index ${mid} after ${frames.filter((f) => f.mid >= 0).length} probes.`, found: true });
      return frames;
    }
    if (arr[mid] < target) {
      frames.push({ lo, hi, mid, note: `${arr[mid]} < ${target} — the answer can only be right of mid. Discard [${arr[lo]}…${arr[mid]}].`, found: false });
      lo = mid + 1;
    } else {
      frames.push({ lo, hi, mid, note: `${arr[mid]} > ${target} — the answer can only be left of mid. Discard [${arr[mid]}…${arr[hi]}].`, found: false });
      hi = mid - 1;
    }
    frames.push({ lo, hi, mid: -1, note: lo <= hi ? `New window [${arr[lo]}…${arr[hi]}] — ${hi - lo + 1} candidates left.` : "Window is empty — target not present.", found: false });
  }
  return frames;
}

export function BinSearchViz() {
  const frames = useMemo(() => bsFrames(ARR, TARGET), []);
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
    <VizShell title={`Binary search for ${TARGET}`} note={f.note}>
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
        <div className="flex min-w-max items-center justify-center gap-2">
          {ARR.map((v, i) => {
            const inWindow = i >= f.lo && i <= f.hi;
            const isMid = i === f.mid;
            return (
              <div
                key={i}
                className={`flex h-12 w-12 items-center justify-center rounded-lg border font-mono text-base font-bold transition-all duration-200 ${
                  isMid
                    ? f.found
                      ? "scale-110 border-emerald-400 bg-emerald-500/25 text-emerald-300"
                      : "scale-110 border-amber-400 bg-amber-500/25 text-amber-300"
                    : inWindow
                      ? "border-zinc-600 bg-zinc-800 text-zinc-200"
                      : "border-zinc-800/60 bg-zinc-900/40 text-zinc-700 line-through decoration-zinc-700"
                }`}
              >
                {v}
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-2 text-center font-mono text-[11px] text-zinc-500">
        <span className="text-amber-400">■</span> mid probe <span className="mx-2 text-zinc-300">■</span> live window{" "}
        <span className="text-zinc-600">■</span> discarded
      </div>
    </VizShell>
  );
}
