
import { LANGUAGES, type LangId } from "@/lib/languages";
import { cn } from "@/lib/utils";

/** Compact pill selector for the 4 judge languages. */
export function LangPicker({
  value,
  onChange,
  className,
  compact = false,
}: {
  value: LangId;
  onChange: (lang: LangId) => void;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Solution language"
      className={cn("inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950/70 p-1", className)}
    >
      {LANGUAGES.map((l) => (
        <button
          key={l.id}
          role="radio"
          aria-checked={value === l.id}
          title={`${l.name} — ${l.toolchain}`}
          onClick={() => onChange(l.id)}
          className={cn(
            "rounded-md font-mono font-bold transition-all",
            compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
            value === l.id ? l.chip : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300"
          )}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}

/** Inline chip describing the active language's toolchain. */
export function LangChip({ lang, className }: { lang: LangId; className?: string }) {
  const l = LANGUAGES.find((x) => x.id === lang) ?? LANGUAGES[0];
  return (
    <span
      title={l.toolchain}
      className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold", l.chip, className)}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: l.color }} />
      {l.name}
    </span>
  );
}
