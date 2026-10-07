
import { useEffect, useState } from "react";

interface Line {
  text: string;
  cls: string;
}

const SCRIPT: Line[] = [
  { text: "$ codeclash match --find", cls: "text-zinc-200" },
  { text: "⟩ scanning arena near rating 1240 …", cls: "text-zinc-500" },
  { text: "⟩ OPPONENT FOUND — dp_dragon (1288)", cls: "text-emerald-400" },
  { text: "⟩ problem: Maximum Subarray · Medium", cls: "text-amber-300" },
  { text: "⟩ clock started — 08:00", cls: "text-zinc-400" },
  { text: "⟩ tests passing: 4/9 …", cls: "text-zinc-400" },
  { text: "⟩ tests passing: 9/9 ✓ ACCEPTED", cls: "text-emerald-400" },
  { text: "⟩ VICTORY in 05:42 · rating +21", cls: "font-bold text-emerald-300" },
];

export function TypingTerminal() {
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);

  useEffect(() => {
    if (lineIdx >= SCRIPT.length) {
      const restart = setTimeout(() => {
        setLineIdx(0);
        setCharIdx(0);
      }, 4200);
      return () => clearTimeout(restart);
    }
    const line = SCRIPT[lineIdx].text;
    if (charIdx < line.length) {
      const t = setTimeout(() => setCharIdx((c) => c + 1), 26 + Math.random() * 30);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setLineIdx((l) => l + 1);
      setCharIdx(0);
    }, 380);
    return () => clearTimeout(t);
  }, [lineIdx, charIdx]);

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/90 shadow-2xl shadow-black/50">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/70 px-4 py-2.5">
        <span className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-500/80" />
          <span className="h-3 w-3 rounded-full bg-amber-400/80" />
          <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
        </span>
        <span className="font-mono text-xs text-zinc-500">codeclash — battle session</span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          LIVE
        </span>
      </div>
      <div className="min-h-64 space-y-1.5 p-4 font-mono text-[13px] leading-relaxed sm:p-5">
        {SCRIPT.slice(0, lineIdx).map((line, i) => (
          <div key={i} className={line.cls}>
            {line.text}
          </div>
        ))}
        {lineIdx < SCRIPT.length && (
          <div className={SCRIPT[lineIdx].cls}>
            {SCRIPT[lineIdx].text.slice(0, charIdx)}
            <span className="cc-caret ml-0.5 inline-block h-4 w-2 translate-y-0.5 bg-emerald-400" />
          </div>
        )}
        {lineIdx >= SCRIPT.length && (
          <div className="pt-1 text-zinc-500">
            $ <span className="cc-caret ml-0.5 inline-block h-4 w-2 translate-y-0.5 bg-emerald-400" />
          </div>
        )}
      </div>
    </div>
  );
}
