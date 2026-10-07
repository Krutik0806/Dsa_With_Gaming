import { useEffect, useMemo, useState } from "react";
import { VizControls, VizShell } from "./viz-shell";

interface SortFrame {
  arr: number[];
  i: number;
  j: number;
  note: string;
  sortedIndices: number[];
}

type SortAlgo = "bubble" | "insertion" | "selection";

function bubbleFrames(input: number[]): SortFrame[] {
  const a = [...input];
  const frames: SortFrame[] = [{ arr: [...a], i: -1, j: -1, note: "Ready — watch adjacent pairs get compared and swapped.", sortedIndices: [] }];
  const sorted: number[] = [];
  for (let i = 0; i < a.length - 1; i++) {
    for (let j = 0; j < a.length - 1 - i; j++) {
      frames.push({ arr: [...a], i: j, j: j + 1, note: `Compare ${a[j]} and ${a[j + 1]}…`, sortedIndices: [...sorted] });
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        frames.push({ arr: [...a], i: j, j: j + 1, note: `${a[j + 1]} > ${a[j]} — swap! Larger value bubbles rightward.`, sortedIndices: [...sorted] });
      }
    }
    sorted.push(a.length - 1 - i);
  }
  sorted.push(0);
  frames.push({ arr: [...a], i: -1, j: -1, note: "Sorted ✓ — largest elements locked to the right.", sortedIndices: a.map((_, idx) => idx) });
  return frames;
}

function selectionFrames(input: number[]): SortFrame[] {
  const a = [...input];
  const frames: SortFrame[] = [{ arr: [...a], i: -1, j: -1, note: "Selection Sort: finds the minimum element and places it at the front.", sortedIndices: [] }];
  const sorted: number[] = [];

  for (let i = 0; i < a.length - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < a.length; j++) {
      frames.push({ arr: [...a], i: minIdx, j, note: `Searching minimum: comparing ${a[j]} with current min ${a[minIdx]}…`, sortedIndices: [...sorted] });
      if (a[j] < a[minIdx]) {
        minIdx = j;
        frames.push({ arr: [...a], i: minIdx, j, note: `New minimum found: ${a[minIdx]} at index ${minIdx}!`, sortedIndices: [...sorted] });
      }
    }
    if (minIdx !== i) {
      [a[i], a[minIdx]] = [a[minIdx], a[i]];
      frames.push({ arr: [...a], i, j: minIdx, note: `Swapped minimum ${a[i]} into position ${i}.`, sortedIndices: [...sorted] });
    }
    sorted.push(i);
  }
  sorted.push(a.length - 1);
  frames.push({ arr: [...a], i: -1, j: -1, note: "Sorted ✓ — all minimums selected and placed.", sortedIndices: a.map((_, idx) => idx) });
  return frames;
}

function insertionFrames(input: number[]): SortFrame[] {
  const a = [...input];
  const frames: SortFrame[] = [{ arr: [...a], i: -1, j: -1, note: "Insertion Sort: shifts larger elements right to insert key into sorted prefix.", sortedIndices: [0] }];

  for (let i = 1; i < a.length; i++) {
    const key = a[i];
    let j = i - 1;
    frames.push({ arr: [...a], i, j, note: `Taking key ${key} at index ${i} to insert into sorted prefix.`, sortedIndices: Array.from({ length: i }, (_, k) => k) });

    while (j >= 0 && a[j] > key) {
      frames.push({ arr: [...a], i: j + 1, j, note: `${a[j]} > ${key} — shift ${a[j]} rightward to make room.`, sortedIndices: Array.from({ length: i }, (_, k) => k) });
      a[j + 1] = a[j];
      j--;
    }
    a[j + 1] = key;
    frames.push({ arr: [...a], i: j + 1, j: -1, note: `Inserted key ${key} at index ${j + 1}.`, sortedIndices: Array.from({ length: i + 1 }, (_, k) => k) });
  }

  frames.push({ arr: [...a], i: -1, j: -1, note: "Sorted ✓ — all elements inserted into position.", sortedIndices: a.map((_, idx) => idx) });
  return frames;
}

function randomArray(): number[] {
  return Array.from({ length: 8 }, () => 10 + Math.floor(Math.random() * 85));
}

export function SortViz() {
  const [algo, setAlgo] = useState<SortAlgo>("bubble");
  const [base, setBase] = useState<number[]>([42, 17, 93, 5, 68, 28, 77, 11]);

  const frames = useMemo(() => {
    if (algo === "selection") return selectionFrames(base);
    if (algo === "insertion") return insertionFrames(base);
    return bubbleFrames(base);
  }, [algo, base]);

  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(420);

  useEffect(() => {
    setIdx(0);
    setPlaying(false);
  }, [algo]);

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

  const frame = frames[Math.min(idx, frames.length - 1)];

  return (
    <VizShell
      title="Sorting Algorithms — Interactive Comparison"
      note={frame.note}
    >
      {/* Algo switcher */}
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          {(["bubble", "selection", "insertion"] as SortAlgo[]).map((a) => (
            <button
              key={a}
              onClick={() => setAlgo(a)}
              className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                algo === a
                  ? "bg-emerald-500 text-zinc-950 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {a} Sort
            </button>
          ))}
        </div>
        <span className="text-xs text-zinc-400 font-mono">
          Step {idx + 1} / {frames.length}
        </span>
      </div>

      <div className="mb-4">
        <VizControls
          playing={playing}
          onTogglePlay={() => setPlaying((p) => !p)}
          onStep={() => setIdx((i) => Math.min(i + 1, frames.length - 1))}
          onReset={() => {
            setPlaying(false);
            setIdx(0);
          }}
          onShuffle={() => {
            setPlaying(false);
            setBase(randomArray());
            setIdx(0);
          }}
          speed={speed}
          onSpeedChange={setSpeed}
        />
      </div>

      <div className="flex h-44 items-end justify-center gap-2 sm:gap-3" role="img" aria-label="Sorting bar visualization">
        {frame.arr.map((v, i) => {
          const isComparing = i === frame.i || i === frame.j;
          const isSorted = frame.sortedIndices.includes(i);
          return (
            <div key={i} className="flex w-full max-w-14 flex-col items-center gap-1.5">
              <span className="font-mono text-xs text-zinc-400">{v}</span>
              <div
                className={`w-full rounded-t-md transition-all duration-200 ${
                  isComparing
                    ? "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.5)]"
                    : isSorted
                    ? "bg-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                    : "bg-zinc-700"
                }`}
                style={{ height: `${Math.max(8, (v / 100) * 120)}px` }}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-center font-mono text-[11px] text-zinc-500">
        <span className="text-amber-400 font-bold">■</span> active comparison / swap{" "}
        <span className="mx-2 text-emerald-400 font-bold">■</span> locked / sorted{" "}
        <span className="text-zinc-500 font-bold">■</span> unsorted
      </div>
    </VizShell>
  );
}
