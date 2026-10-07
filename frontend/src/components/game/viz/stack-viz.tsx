import { useState } from "react";
import { ArrowDownToLine, ArrowRightToLine, ArrowRightFromLine, Eraser, Pin, Popcorn, Layers, ArrowRight } from "lucide-react";
import { VizShell } from "./viz-shell";

interface LogEntry {
  op: string;
  detail: string;
  ok: boolean;
}

type Mode = "stack" | "queue";

export function StackViz() {
  const [mode, setMode] = useState<Mode>("stack");
  const [items, setItems] = useState<number[]>([4, 8, 15]);
  const [value, setValue] = useState("23");
  const [log, setLog] = useState<LogEntry[]>([]);

  const handleAdd = () => {
    const v = Math.max(0, Math.min(99, Number(value) || Math.floor(Math.random() * 90) + 10));
    setItems((s) => [...s, v]);
    if (mode === "stack") {
      setLog((l) => [{ op: "push", detail: `push(${v}) — ${v} becomes the new TOP of the stack (LIFO)`, ok: true }, ...l].slice(0, 6));
    } else {
      setLog((l) => [{ op: "enqueue", detail: `enqueue(${v}) — joins at the REAR/BACK of the queue (FIFO)`, ok: true }, ...l].slice(0, 6));
    }
  };

  const handleRemove = () => {
    if (items.length === 0) {
      setLog((l) => [
        {
          op: mode === "stack" ? "pop" : "dequeue",
          detail: `${mode === "stack" ? "pop()" : "dequeue()"} on empty ${mode} — underflow error!`,
          ok: false,
        },
        ...l,
      ].slice(0, 6));
      return;
    }

    if (mode === "stack") {
      const top = items[items.length - 1];
      setItems((s) => s.slice(0, -1));
      setLog((l) => [{ op: "pop", detail: `pop() → ${top} removed from TOP (Last-In, First-Out)`, ok: true }, ...l].slice(0, 6));
    } else {
      const front = items[0];
      setItems((s) => s.slice(1));
      setLog((l) => [{ op: "dequeue", detail: `dequeue() → ${front} served from FRONT (First-In, First-Out)`, ok: true }, ...l].slice(0, 6));
    }
  };

  const clear = () => {
    setItems([]);
    setLog([]);
  };

  return (
    <VizShell title={`${mode === "stack" ? "Stack (LIFO)" : "Queue (FIFO)"} interactive visualizer`}>
      {/* Mode switch */}
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => {
              setMode("stack");
              setLog([]);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              mode === "stack"
                ? "bg-emerald-500 text-zinc-950 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Stack (LIFO)
          </button>
          <button
            onClick={() => {
              setMode("queue");
              setLog([]);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              mode === "queue"
                ? "bg-emerald-500 text-zinc-950 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Queue (FIFO)
          </button>
        </div>

        <span className="text-xs text-zinc-400">
          {mode === "stack" ? "Last-In, First-Out (e.g. Call Stack, Undo)" : "First-In, First-Out (e.g. Printer, BFS)"}
        </span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="number"
          value={value}
          min={0}
          max={99}
          onChange={(e) => setValue(e.target.value)}
          className="h-8 w-20 rounded-lg border border-zinc-700 bg-zinc-800/70 px-2 font-mono text-xs text-zinc-200 outline-none focus:border-emerald-600/50"
          aria-label="Value"
        />
        <button
          onClick={handleAdd}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-600/50 bg-emerald-500/10 px-2.5 font-mono text-xs text-emerald-400 transition-colors hover:bg-emerald-500/20"
        >
          {mode === "stack" ? <ArrowDownToLine className="h-3.5 w-3.5" /> : <ArrowRightToLine className="h-3.5 w-3.5" />}
          {mode === "stack" ? "push" : "enqueue"}
        </button>
        <button
          onClick={handleRemove}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-amber-600/50 bg-amber-500/10 px-2.5 font-mono text-xs text-amber-400 transition-colors hover:bg-amber-500/20"
        >
          {mode === "stack" ? <Popcorn className="h-3.5 w-3.5" /> : <ArrowRightFromLine className="h-3.5 w-3.5" />}
          {mode === "stack" ? "pop" : "dequeue"}
        </button>
        <button
          onClick={clear}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/70 px-2.5 font-mono text-xs text-zinc-400 transition-colors hover:border-zinc-600"
        >
          <Eraser className="h-3.5 w-3.5" />
          clear
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {mode === "stack" ? (
          /* Stack: vertical pile */
          <div className="flex min-h-56 flex-col-reverse items-center justify-start gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
            {items.length === 0 && <span className="py-8 font-mono text-xs text-zinc-600">stack is empty</span>}
            {items.map((v, i) => (
              <div
                key={`${i}-${v}`}
                className={`flex w-44 items-center justify-between rounded-lg border px-3 py-2 font-mono text-sm font-bold transition-all ${
                  i === items.length - 1
                    ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300 shadow-[0_0_16px_-4px_rgba(52,211,153,0.5)]"
                    : "border-zinc-700 bg-zinc-800/70 text-zinc-300"
                }`}
              >
                <span className="text-[10px] text-zinc-500">[{i}]</span>
                {v}
                {i === items.length - 1 && <Pin className="h-3.5 w-3.5 text-emerald-400" />}
              </div>
            ))}
            {items.length > 0 && (
              <span className="mt-1 font-mono text-[10px] uppercase tracking-widest text-emerald-400">
                ← top (next to pop)
              </span>
            )}
          </div>
        ) : (
          /* Queue: horizontal line */
          <div className="flex min-h-56 flex-col justify-center items-center rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
            {items.length === 0 && <span className="font-mono text-xs text-zinc-600">queue is empty</span>}
            <div className="flex items-center gap-2 overflow-x-auto max-w-full py-3">
              {items.map((v, i) => (
                <div
                  key={`${i}-${v}`}
                  className={`flex flex-col items-center justify-center rounded-lg border px-3 py-2.5 font-mono text-sm font-bold transition-all min-w-[3.5rem] ${
                    i === 0
                      ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300 shadow-[0_0_16px_-4px_rgba(52,211,153,0.5)]"
                      : i === items.length - 1
                      ? "border-cyan-500/60 bg-cyan-500/15 text-cyan-300"
                      : "border-zinc-700 bg-zinc-800/70 text-zinc-300"
                  }`}
                >
                  <span className="text-[10px] text-zinc-500">
                    {i === 0 ? "FRONT" : i === items.length - 1 ? "REAR" : `[${i}]`}
                  </span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
            {items.length > 0 && (
              <div className="flex items-center gap-4 text-[10.5px] font-mono text-zinc-400 mt-2">
                <span className="text-emerald-400">← Served First (Dequeue)</span>
                <span className="text-cyan-400">Joins Last (Enqueue) →</span>
              </div>
            )}
          </div>
        )}

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-zinc-500">operation log</div>
          <div className="space-y-1.5">
            {log.length === 0 && (
              <p className="font-mono text-xs text-zinc-600">
                Perform operations to observe {mode === "stack" ? "LIFO" : "FIFO"} mechanics…
              </p>
            )}
            {log.map((entry, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 rounded-lg border px-2.5 py-1.5 font-mono text-xs ${
                  entry.ok
                    ? "border-zinc-800/80 bg-zinc-900/60 text-zinc-300"
                    : "border-rose-900/60 bg-rose-950/40 text-rose-300"
                }`}
              >
                <span
                  className={`mt-0.5 inline-block h-1.5 w-1.5 rounded-full ${
                    entry.ok ? "bg-emerald-400" : "bg-rose-400"
                  }`}
                />
                <span className="flex-1">{entry.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </VizShell>
  );
}
