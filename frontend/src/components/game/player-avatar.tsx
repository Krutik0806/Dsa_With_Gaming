import { avatarColor } from "@/lib/format";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "h-7 w-7 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
} as const;

// Frame styles wrap the avatar tile — purchased in the arena shop.
const FRAMES: Record<string, string> = {
  "frame-emerald": "ring-2 ring-emerald-400/70 ring-offset-2 ring-offset-zinc-950",
  "frame-ruby": "ring-2 ring-red-400/80 ring-offset-2 ring-offset-zinc-950 cc-frame-pulse",
  "frame-laurel": "ring-2 ring-amber-400/90 ring-offset-2 ring-offset-zinc-950 cc-frame-gold",
};

export function frameClass(frame?: string | null): string | null {
  if (!frame) return null;
  return FRAMES[frame] ?? null;
}

export function PlayerAvatar({
  name,
  size = "md",
  isBot = false,
  color,
  frame,
  className,
}: {
  name: string;
  size?: keyof typeof SIZES;
  isBot?: boolean;
  color?: string;
  /** Equipped shop frame item id — renders a cosmetic ring. */
  frame?: string | null;
  className?: string;
}) {
  const bg = color ?? avatarColor(name);
  const initial = name.replace(/[^a-zA-Z0-9]/g, "").charAt(0).toUpperCase() || "?";
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-lg border font-mono font-bold",
          SIZES[size],
          frameClass(frame)
        )}
        style={{ backgroundColor: `${bg}1f`, borderColor: `${bg}55`, color: bg }}
        aria-hidden
      >
        {initial}
      </span>
      {frame === "frame-laurel" && (
        <span
          className="cc-laurel absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] leading-none"
          aria-hidden
        >
          🏆
        </span>
      )}
      {isBot && (
        <span className="absolute -bottom-1.5 -right-1.5 rounded bg-zinc-800 px-1 py-px font-mono text-[8px] font-bold tracking-wider text-zinc-400 ring-1 ring-zinc-700">
          BOT
        </span>
      )}
    </span>
  );
}
