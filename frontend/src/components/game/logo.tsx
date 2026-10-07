import { Swords } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function Logo({ href = "/", size = "md", showWord = true }: { href?: string; size?: "sm" | "md" | "lg"; showWord?: boolean }) {
  const icon = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-7 w-7" : "h-5 w-5";
  const box = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-11 w-11" : "h-9 w-9";
  const word = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg";
  return (
    <Link to={href} className="group inline-flex items-center gap-2.5" aria-label="CodeClash home">
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-[0_0_18px_-4px_rgba(52,211,153,0.5)] transition-shadow group-hover:shadow-[0_0_24px_-2px_rgba(52,211,153,0.7)]",
          box
        )}
      >
        <Swords className={icon} />
      </span>
      {showWord && (
        <span className={cn("font-mono font-black tracking-tight text-zinc-50", word)}>
          Code<span className="text-emerald-400">Clash</span>
        </span>
      )}
    </Link>
  );
}
