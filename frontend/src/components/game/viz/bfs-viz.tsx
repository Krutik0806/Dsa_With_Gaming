
import { useEffect, useMemo, useState } from "react";
import { VizControls, VizShell } from "./viz-shell";

const COLS = 15;
const ROWS = 9;
const START: [number, number] = [0, 0];
const END: [number, number] = [14, 8];

const WALLS = new Set<string>([
  "2,1", "3,1", "4,1", "5,1", "2,2", "2,3", "6,3", "7,3", "8,3", "8,1", "8,2", "8,4", "4,4", "4,5", "4,6", "4,7",
  "6,5", "6,6", "10,2", "10,3", "10,4", "10,5", "11,5", "12,5", "12,6", "6,7", "6,8", "13,2", "13,3", "9,7", "9,8",
]);

interface BFSFrame {
  cells: [number, number][];
  dist: number;
  phase: "flood" | "path" | "done";
}

function computeFrames() {
  const dist = new Map<string, number>();
  const parent = new Map<string, string>();
  const key = (r: number, c: number) => `${r},${c}`;
  const frontier: [number, number][] = [START];
  dist.set(key(START[0], START[1]), 0);

  const frames: BFSFrame[] = [];
  const maxR = ROWS - 1;
  const maxC = COLS - 1;

  while (frontier.length > 0) {
    const next: [number, number][] = [];
    const currentDist = dist.get(key(frontier[0][0], frontier[0][1])) ?? 0;
    const layer: [number, number][] = [];
    for (const [r, c] of frontier) {
      layer.push([r, c]);
      for (const [dr, dc] of [
        [-1, 0],
        [0, 1],
        [1, 0],
        [0, -1],
      ] as const) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr > maxR || nc < 0 || nc > maxC) continue;
        if (WALLS.has(key(nr, nc))) continue;
        if (dist.has(key(nr, nc))) continue;
        dist.set(key(nr, nc), currentDist + 1);
        parent.set(key(nr, nc), key(r, c));
        next.push([nr, nc]);
      }
    }
    frames.push({ cells: layer, dist: currentDist, phase: "flood" });
    if (dist.has(key(END[0], END[1]))) break;
    frontier.length = 0;
    frontier.push(...next);
  }

  // reconstruct path
  const path: string[] = [];
  let cur = key(END[0], END[1]);
  while (cur) {
    path.push(cur);
    const p = parent.get(cur);
    if (!p) break;
    cur = p;
  }
  path.reverse();
  const pathCells = path.map((k) => k.split(",").map(Number) as [number, number]);
  for (let i = 1; i <= pathCells.length; i++) {
    frames.push({ cells: pathCells.slice(0, i), dist: -1, phase: "path" });
  }
  return { frames, path: new Set(path), maxDist: Math.max(...[...dist.values()]) };
}

export function BFSViz() {
  const { frames, path, maxDist } = useMemo(() => computeFrames(), []);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(140);

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

  const visited = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i <= Math.min(idx, frames.length - 1); i++) {
      const f = frames[i];
      if (f.phase === "flood") for (const [r, c] of f.cells) map.set(`${r},${c}`, f.dist);
    }
    return map;
  }, [idx, frames]);

  const pathShown = useMemo(() => {
    if (idx < frames.length - 1) return new Set<string>();
    const f = frames[frames.length - 1];
    return new Set(f.cells.map(([r, c]) => `${r},${c}`));
  }, [idx, frames]);

  const current = frames[Math.min(idx, frames.length - 1)];
  const isPathPhase = current.phase !== "flood";

  return (
    <VizShell
      title="BFS flood — shortest path on a grid"
      note={
        isPathPhase
          ? `Shortest path found: ${current.cells.length} cells from S to E. BFS reached E in layer ${frames.find((f) => f.phase === "flood" && f.cells.some(([r, c]) => r === END[0] && c === END[1]))?.dist ?? "?"} — the first arrival is always the shortest.`
          : `Flooding layer ${current.dist} — ${current.cells.length} cell${current.cells.length === 1 ? "" : "s"} at distance ${current.dist} from S.`
      }
    >
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
      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
        <div
          className="mx-auto grid w-max gap-[3px]"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
          role="img"
          aria-label="Grid BFS visualization"
        >
          {Array.from({ length: ROWS * COLS }, (_, i) => {
            const r = Math.floor(i / COLS);
            const c = i % COLS;
            const k = `${r},${c}`;
            const isWall = WALLS.has(k);
            const isStart = r === START[0] && c === START[1];
            const isEnd = r === END[0] && c === END[1];
            const d = visited.get(k);
            const onPath = pathShown.has(k);

            let cls = "border-zinc-800/70 bg-zinc-900/70";
            if (isWall) cls = "border-zinc-800 bg-zinc-800";
            else if (isStart) cls = "border-emerald-400 bg-emerald-500/70";
            else if (isEnd) cls = "border-red-400 bg-red-500/60";
            else if (onPath) cls = "border-amber-300 bg-amber-400/80";
            else if (d !== undefined) {
              const t = 0.18 + 0.55 * (1 - d / Math.max(1, maxDist));
              return (
                <div
                  key={i}
                  className="h-6 w-6 rounded-[4px] border transition-all duration-300 sm:h-7 sm:w-7"
                  style={{ backgroundColor: `rgba(52, 211, 153, ${t})`, borderColor: "rgba(52,211,153,0.4)" }}
                />
              );
            }

            return (
              <div
                key={i}
                className={`flex h-6 w-6 items-center justify-center rounded-[4px] border font-mono text-[9px] font-bold transition-all duration-300 sm:h-7 sm:w-7 ${cls} ${isStart ? "text-zinc-950" : ""} ${isEnd ? "text-zinc-950" : ""}`}
              >
                {isStart ? "S" : isEnd ? "E" : ""}
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-2 text-center font-mono text-[11px] text-zinc-500">
        <span className="text-emerald-400">■</span> visited (darker = farther) <span className="mx-2 text-amber-400">■</span> shortest
        path <span className="mx-2 text-zinc-600">■</span> wall
      </div>
    </VizShell>
  );
}
