
import { useEffect, useMemo, useState } from "react";
import { VizControls, VizShell } from "./viz-shell";

const ARR = [1, 3, 4, 6, 8, 9, 12, 15];
const TARGET = 13;

interface TPFrame {
  left: number;
  right: number;
  note: string;
  done: boolean;
}

function tpFrames(arr: number[], target: number): TPFrame[] {
  const frames: TPFrame[] = [];
  let left = 0;
  let right = arr.length - 1;
  frames.push({ left, right, note: `Target ${target}. Sum = ${arr[left]} + ${arr[right]} = ${arr[left] + arr[right]}.`, done: false });
  while (left < right) {
    const sum = arr[left] + arr[right];
    if (sum === target) {
      frames.push({ left, right, note: `${sum} = ${target} ✓ Found the pair ${arr[left]} + ${arr[right]} in O(n).`, done: true });
      return frames;
    }
    if (sum < target) {
      frames.push({ left, right, note: `${sum} < ${target} — too small. Move left pointer right.`, done: false });
      left++;
      frames.push({ left, right, note: `Sum = ${arr[left]} + ${arr[right]} = ${arr[left] + arr[right]}.`, done: false });
    } else {
      frames.push({ left, right, note: `${sum} > ${target} — too big. Move right pointer left.`, done: false });
      right--;
      frames.push({ left, right, note: `Sum = ${arr[left]} + ${arr[right]} = ${arr[left] + arr[right]}.`, done: false });
    }
  }
  frames.push({ left, right, note: "Pointers crossed — no pair sums to the target.", done: true });
  return frames;
}

export function TwoPointerViz() {
  const frames = useMemo(() => tpFrames(ARR, TARGET), []);
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
    <VizShell title={`Find a pair summing to ${TARGET} (sorted array)`} note={f.note}>
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
        <div className="flex min-w-max items-start justify-center gap-2">
          {ARR.map((v, i) => {
            const isL = i === f.left;
            const isR = i === f.right;
            const inPlay = i >= f.left && i <= f.right;
            return (
              <div key={i} className="flex w-12 flex-col items-center gap-1.5">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg border font-mono text-base font-bold transition-all duration-200 ${
                    f.done && (isL || isR)
                      ? "border-emerald-400 bg-emerald-500/25 text-emerald-300"
                      : inPlay
                        ? "border-zinc-600 bg-zinc-800 text-zinc-200"
                        : "border-zinc-800 bg-zinc-900/60 text-zinc-600"
                  }`}
                >
                  {v}
                </div>
                <div className="flex h-5 items-center gap-1 font-mono text-[11px] font-bold">
                  {isL && <span className="rounded bg-emerald-500/20 px-1.5 text-emerald-400">L</span>}
                  {isR && <span className="rounded bg-amber-500/20 px-1.5 text-amber-400">R</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </VizShell>
  );
}
