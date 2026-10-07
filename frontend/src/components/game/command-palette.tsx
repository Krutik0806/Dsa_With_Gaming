
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import {
  BookOpen,
  Crown,
  Flame,
  History,
  LayoutDashboard,
  LogOut,
  Search,
  ShoppingBag,
  Swords,
  Target,
  Trophy,
  User as UserIcon,
  Zap,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { playSound } from "@/lib/sound";

interface PaletteAction {
  label: string;
  href: string;
  icon: typeof Zap;
  hint?: string;
}

const NAV_ACTIONS: { group: string; actions: PaletteAction[] }[] = [
  {
    group: "train",
    actions: [
      { label: "Dashboard", href: "/app", icon: LayoutDashboard },
      { label: "Learn — interactive lessons", href: "/app/learn", icon: BookOpen },
      { label: "Practice — problem arena", href: "/app/practice", icon: Target },
    ],
  },
  {
    group: "compete",
    actions: [
      { label: "Quiz Battle — 1v1 trivia", href: "/app/game/quiz", icon: Zap, hint: "2 min" },
      { label: "Coding Battle — 1v1 code duel", href: "/app/game/battle", icon: Swords },
      { label: "Tournaments — knockout cups", href: "/app/tournaments", icon: Crown },
    ],
  },
  {
    group: "progress",
    actions: [
      { label: "History — match analysis", href: "/app/history", icon: History },
      { label: "Leaderboard — season 1", href: "/app/leaderboard", icon: Trophy },
      { label: "Season archive — past champions", href: "/app/seasons", icon: History },
      { label: "Shop — spend your coins", href: "/app/shop", icon: ShoppingBag },
      { label: "Profile — skills & trophies", href: "/app/profile", icon: UserIcon },
    ],
  },
];

const QUICK_ACTIONS: PaletteAction[] = [
  { label: "Daily challenge — 2× XP today", href: "/app/practice", icon: Flame, hint: "daily" },
  { label: "Find a quiz opponent", href: "/app/game/quiz", icon: Zap },
  { label: "Enter a live cup", href: "/app/tournaments", icon: Crown },
  { label: "Browse the arena shop", href: "/app/shop", icon: ShoppingBag, hint: "coins" },
];

/**
 * Global ⌘K command palette — navigate the arena without touching the sidebar.
 * Rendered once from AppShell (which owns the open state); listens for
 * Cmd/Ctrl+K globally.
 */
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const go = (href: string) => {
    onOpenChange(false);
    playSound("click");
    navigate(href);
  };

  const handleLogout = async () => {
    onOpenChange(false);
    await logout();
    navigate("/");
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command palette"
      description="Jump anywhere in the arena"
      className="border-zinc-800 bg-zinc-950 sm:max-w-xl [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.2em] [&_[cmdk-group-heading]]:text-zinc-600 [&_[cmdk-input]]:font-mono [&_[cmdk-item]]:font-mono [&_[cmdk-item]]:text-sm [&_[cmdk-overlay]]:bg-black/70"
    >
      <CommandInput placeholder="Type a page, mode or action…" />
      <CommandList className="cc-scroll-thin">
        <CommandEmpty className="py-6 text-center font-mono text-sm text-zinc-600">
          nothing matches — the arena is silent
        </CommandEmpty>
        <CommandGroup heading="quick actions">
          {QUICK_ACTIONS.map((a) => (
            <CommandItem key={a.label} value={a.label} onSelect={() => go(a.href)} className="text-zinc-300 hover:bg-zinc-900">
              <a.icon className="!h-4 !w-4 text-emerald-400" />
              {a.label}
              {a.hint && <CommandShortcut className="font-mono text-[10px] text-amber-400">{a.hint}</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator className="bg-zinc-800" />
        {NAV_ACTIONS.map((g) => (
          <CommandGroup key={g.group} heading={g.group}>
            {g.actions.map((a) => (
              <CommandItem key={a.label} value={a.label} onSelect={() => go(a.href)} className="text-zinc-300 hover:bg-zinc-900">
                <a.icon className="!h-4 !w-4 text-zinc-500" />
                {a.label}
                {a.hint && <CommandShortcut className="font-mono text-[10px] text-zinc-600">{a.hint}</CommandShortcut>}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
        <CommandSeparator className="bg-zinc-800" />
        <CommandGroup heading="session">
          <CommandItem value="log out" onSelect={handleLogout} className="text-zinc-300 hover:bg-zinc-900">
            <LogOut className="!h-4 !w-4 text-red-400" />
            Log out
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

/** Small header trigger button — pairs with the palette. */
export function CommandPaletteTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Open command palette (Ctrl+K)"
      className="hidden items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-1.5 font-mono text-xs text-zinc-500 transition-colors hover:border-emerald-600/40 hover:text-zinc-300 md:flex"
    >
      <Search className="h-3.5 w-3.5" />
      <span className="hidden lg:inline">jump to…</span>
      <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-px text-[10px] text-zinc-400">⌘K</kbd>
    </button>
  );
}
