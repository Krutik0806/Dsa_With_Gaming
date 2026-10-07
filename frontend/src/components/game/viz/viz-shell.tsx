
import { Pause, Play, RotateCcw, Shuffle, SkipForward, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function VizShell({
  title,
  children,
  note,
  className,
}: {
  title: string;
  children: React.ReactNode;
  note?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5", className)}>
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-emerald-400" />
        <span className="font-mono text-sm font-semibold text-zinc-200">{title}</span>
      </div>
      {children}
      {note && (
        <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-2 font-mono text-xs text-zinc-400">
          {note}
        </div>
      )}
    </div>
  );
}

export function VizButton({
  onClick,
  disabled,
  children,
  label,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/70 px-2.5 font-mono text-xs text-zinc-300 transition-colors hover:border-emerald-600/50 hover:text-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function VizControls({
  playing,
  onTogglePlay,
  onStep,
  onReset,
  onShuffle,
  speed,
  onSpeedChange,
  disabled,
}: {
  playing: boolean;
  onTogglePlay: () => void;
  onStep: () => void;
  onReset: () => void;
  onShuffle?: () => void;
  speed?: number;
  onSpeedChange?: (ms: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <VizButton onClick={onTogglePlay} disabled={disabled} label={playing ? "Pause" : "Play"}>
        {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        {playing ? "pause" : "play"}
      </VizButton>
      <VizButton onClick={onStep} disabled={disabled} label="Step">
        <SkipForward className="h-3.5 w-3.5" />
        step
      </VizButton>
      {onShuffle && (
        <VizButton onClick={onShuffle} label="Shuffle">
          <Shuffle className="h-3.5 w-3.5" />
          shuffle
        </VizButton>
      )}
      <VizButton onClick={onReset} label="Reset">
        <RotateCcw className="h-3.5 w-3.5" />
        reset
      </VizButton>
      {speed !== undefined && onSpeedChange && (
        <select
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className="h-8 rounded-lg border border-zinc-700 bg-zinc-800/70 px-1.5 font-mono text-xs text-zinc-300 outline-none focus:border-emerald-600/50"
          aria-label="Animation speed"
        >
          <option value={140}>0.5×</option>
          <option value={420}>1×</option>
          <option value={900}>2×</option>
        </select>
      )}
    </div>
  );
}
