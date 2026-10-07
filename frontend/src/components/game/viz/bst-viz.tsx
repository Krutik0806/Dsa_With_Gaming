
import { useEffect, useRef, useState } from "react";
import { Plus, Search, RotateCcw } from "lucide-react";
import { VizShell } from "./viz-shell";

interface TNode {
  val: number;
  left: TNode | null;
  right: TNode | null;
}

function insertNode(node: TNode | null, val: number): TNode {
  if (!node) return { val, left: null, right: null };
  if (val < node.val) node.left = insertNode(node.left, val);
  else if (val > node.val) node.right = insertNode(node.right, val);
  return node;
}

function findPath(root: TNode | null, val: number): number[] {
  const path: number[] = [];
  let node = root;
  while (node) {
    path.push(node.val);
    if (val === node.val) return path;
    node = val < node.val ? node.left : node.right;
  }
  return path;
}

function sampleTree(): TNode {
  let root: TNode | null = null;
  for (const v of [50, 30, 70, 20, 40, 60, 80]) root = insertNode(root, v);
  return root!;
}

function layout(root: TNode) {
  const pos = new Map<number, { x: number; y: number }>();
  let x = 0;
  let maxDepth = 0;
  const walk = (node: TNode | null, depth: number) => {
    if (!node) return;
    maxDepth = Math.max(maxDepth, depth);
    walk(node.left, depth + 1);
    pos.set(node.val, { x: x++, y: depth });
    walk(node.right, depth + 1);
  };
  walk(root, 0);
  return { pos, cols: x, rows: maxDepth + 1 };
}

const CELL_W = 52;
const CELL_H = 58;

export function BSTViz() {
  const [tree, setTree] = useState<TNode>(sampleTree);
  const [value, setValue] = useState("35");
  const [path, setPath] = useState<number[]>([]);
  const [status, setStatus] = useState("Insert or search a value — the BST invariant guides every step.");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => void (timer.current && clearInterval(timer.current)), []);

  const animateSearch = (target: number) => {
    const seq = findPath(tree, target);
    if (seq.length === 0) {
      setStatus(`${target} — the tree is empty.`);
      return;
    }
    if (timer.current) clearInterval(timer.current);
    setPath([]);
    let i = 0;
    timer.current = setInterval(() => {
      i += 1;
      setPath(seq.slice(0, i));
      if (i >= seq.length) {
        if (timer.current) clearInterval(timer.current);
        const found = seq[seq.length - 1] === target;
        setStatus(
          found
            ? `Found ${target} after ${seq.length} comparisons — that's the power of O(log n) on a balanced tree.`
            : `${target} is not in the tree — the walk fell off at a null child after ${seq.length} comparisons.`
        );
      }
    }, 550);
  };

  const insert = () => {
    const v = Math.max(1, Math.min(99, Number(value) || 0));
    const before = findPath(tree, v);
    if (before.length > 0 && before[before.length - 1] === v) {
      setStatus(`${v} is already in the tree — BSTs here store unique values.`);
      setPath(before);
      return;
    }
    setTree((t) => insertNode(t, v));
    setPath([v]);
    setStatus(`Inserted ${v} — walked ${before.length} step${before.length === 1 ? "" : "s"} down, attached at the exit point.`);
  };

  const reset = () => {
    if (timer.current) clearInterval(timer.current);
    setTree(sampleTree());
    setPath([]);
    setStatus("Tree reset to the sample shape.");
  };

  const { pos, cols, rows } = layout(tree);
  const w = cols * CELL_W + 36;
  const h = rows * CELL_H + 36;
  const px = (v: number) => 18 + (pos.get(v)?.x ?? 0) * CELL_W + CELL_W / 2;
  const py = (v: number) => 18 + (pos.get(v)?.y ?? 0) * CELL_H + 28;

  const edges: { a: TNode; b: TNode }[] = [];
  const collect = (node: TNode | null) => {
    if (!node) return;
    if (node.left) edges.push({ a: node, b: node.left });
    if (node.right) edges.push({ a: node, b: node.right });
    collect(node.left);
    collect(node.right);
  };
  collect(tree);

  const lastPathVal = path.length > 0 ? path[path.length - 1] : null;

  return (
    <VizShell title="BST insert & search — interactive" note={status}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="number"
          value={value}
          min={1}
          max={99}
          onChange={(e) => setValue(e.target.value)}
          className="h-8 w-20 rounded-lg border border-zinc-700 bg-zinc-800/70 px-2 font-mono text-xs text-zinc-200 outline-none focus:border-emerald-600/50"
          aria-label="Value"
        />
        <button
          onClick={insert}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-600/50 bg-emerald-500/10 px-2.5 font-mono text-xs text-emerald-400 transition-colors hover:bg-emerald-500/20"
        >
          <Plus className="h-3.5 w-3.5" />
          insert
        </button>
        <button
          onClick={() => animateSearch(Math.max(1, Math.min(99, Number(value) || 0)))}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-amber-600/50 bg-amber-500/10 px-2.5 font-mono text-xs text-amber-400 transition-colors hover:bg-amber-500/20"
        >
          <Search className="h-3.5 w-3.5" />
          search
        </button>
        <button
          onClick={reset}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/70 px-2.5 font-mono text-xs text-zinc-400 transition-colors hover:border-zinc-600"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          reset
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/60 p-2">
        <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label="Binary search tree" className="mx-auto block">
          {edges.map(({ a, b }, i) => {
            const active = path.includes(a.val) && path.includes(b.val);
            return (
              <line
                key={i}
                x1={px(a.val)}
                y1={py(a.val)}
                x2={px(b.val)}
                y2={py(b.val)}
                stroke={active ? "#fbbf24" : "#3f3f46"}
                strokeWidth={active ? 2.5 : 1.5}
                className="transition-all duration-300"
              />
            );
          })}
          {[...pos.entries()].map(([val, _]) => {
            const stepIdx = path.indexOf(val);
            const onPath = stepIdx >= 0;
            const isLast = val === lastPathVal;
            return (
              <g key={val} className="transition-all duration-300">
                <circle
                  cx={px(val)}
                  cy={py(val)}
                  r={17}
                  fill={isLast ? (path.length > 1 ? "#fbbf24" : "#34d399") : onPath ? "#fbbf2433" : "#18181b"}
                  stroke={isLast ? "#fbbf24" : onPath ? "#fbbf24" : "#52525b"}
                  strokeWidth={onPath ? 2.5 : 1.5}
                />
                <text
                  x={px(val)}
                  y={py(val) + 4}
                  textAnchor="middle"
                  className="fill-zinc-200 font-mono text-[12px] font-bold"
                  fill={onPath ? "#fde68a" : "#e4e4e7"}
                >
                  {val}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-2 text-center font-mono text-[11px] text-zinc-500">
        <span className="text-amber-400">●</span> search path <span className="mx-2 text-zinc-400">●</span> untouched · in-order
        traversal of a BST yields sorted order
      </div>
    </VizShell>
  );
}
