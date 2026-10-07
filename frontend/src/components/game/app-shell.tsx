import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Coins,
  Crown,
  Flame,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  ShoppingBag,
  Swords,
  Target,
  Trophy,
  User as UserIcon,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/game/logo";
import { PlayerAvatar } from "@/components/game/player-avatar";
import { RankBadge } from "@/components/game/rank-badge";
import { XPBar } from "@/components/game/xp-bar";
import { useAuth } from "@/lib/auth-context";
import { CommandPalette, CommandPaletteTrigger } from "@/components/game/command-palette";
import { SoundToggle } from "@/components/game/sound-toggle";
import { ThemeToggle } from "@/components/game/theme-toggle";
import { getShopItem } from "@/lib/shop";
import { playSound } from "@/lib/sound";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV = [
  {
    section: "train",
    items: [
      { href: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/app/learn", label: "Learn", icon: BookOpen },
      { href: "/app/practice", label: "Practice", icon: Target },
    ],
  },
  {
    section: "compete",
    items: [
      { href: "/app/game/quiz", label: "Quiz Battle", icon: Zap },
      { href: "/app/game/battle", label: "Coding Battle", icon: Swords },
      { href: "/app/tournaments", label: "Tournaments", icon: Crown },
    ],
  },
  {
    section: "progress",
    items: [
      { href: "/app/history", label: "History", icon: History },
      { href: "/app/leaderboard", label: "Leaderboard", icon: Trophy },
      { href: "/app/shop", label: "Shop", icon: ShoppingBag },
      { href: "/app/profile", label: "Profile", icon: UserIcon },
    ],
  },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto p-3 cc-scroll-thin" aria-label="Main navigation">
      {NAV.map((group) => (
        <div key={group.section}>
          <p className="px-3 pb-1.5 pt-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
            {group.section}
          </p>
          <ul className="space-y-1">
            {group.items.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link to={item.href}
                    onClick={() => {
                      playSound("click");
                      onNavigate?.();
                    }}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-3 py-2 font-mono text-sm transition-all",
                      active
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                    {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function UserCard({ onNavigate }: { onNavigate?: () => void }) {
  const { user: userRaw, logout } = useAuth(); const user = userRaw!;
  const navigate = useNavigate();
  const titleFlair = user.equippedTitle ? getShopItem(user.equippedTitle)?.flair : null;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="border-t border-zinc-800/70 p-3">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
        <div className="flex items-center gap-2.5">
          <PlayerAvatar name={user.username} size="md" frame={user.equippedFrame} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-sm font-bold text-zinc-100">{user.username}</p>
            {titleFlair && (
              <p className="truncate font-mono text-[10px] font-semibold uppercase tracking-wider text-amber-300/90">
                ✦ {titleFlair}
              </p>
            )}
            <div className="mt-1">
              <RankBadge rating={user.rating} showRating />
            </div>
          </div>
          <span
            title="arena coins — spend them in the shop"
            className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 font-mono text-xs font-bold text-amber-300"
          >
            <Coins className="h-3 w-3" />
            {(user.coins ?? 0).toLocaleString()}
          </span>
        </div>
        <div className="mt-3">
          <XPBar xp={user.xp} compact />
        </div>
        <button
          onClick={handleLogout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-1.5 font-mono text-xs text-zinc-500 transition-colors hover:border-red-500/40 hover:text-red-400"
        >
          <LogOut className="h-3.5 w-3.5" />
          log out
        </button>
      </div>
    </div>
  );
}

// Streak chip is date-dependent — render only after mount so server/client
// (potentially different local dates) never disagree during hydration.
function StreakChip({ streakCount, lastActiveDay }: { streakCount: number; lastActiveDay: string | null }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      setShow(streakCount >= 2 && lastActiveDay === today);
    });
    return () => cancelAnimationFrame(raf);
  }, [streakCount, lastActiveDay]);
  if (!show) return null;
  return (
    <span
      title={`${streakCount}-day streak — XP multiplier live today`}
      className="hidden items-center gap-1 rounded-lg border border-orange-500/40 bg-orange-500/10 px-2.5 py-1.5 font-mono text-xs font-bold text-orange-300 sm:inline-flex"
    >
      <Flame className="cc-flame h-3.5 w-3.5" />
      {streakCount}
    </span>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user: userRaw } = useAuth(); const user = userRaw!;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-zinc-800/70 bg-zinc-950 lg:flex">
        <div className="flex h-16 shrink-0 items-center border-b border-zinc-800/70 px-5">
          <Logo href="/app" size="sm" />
        </div>
        <NavLinks />
        <UserCard />
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-60">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-zinc-800/70 bg-zinc-950/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-300 lg:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="h-4 w-4" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 border-zinc-800 bg-zinc-950 p-0">
                <SheetTitle className="sr-only">Navigation menu</SheetTitle>
                <div className="flex h-full flex-col">
                  <div className="flex h-16 shrink-0 items-center border-b border-zinc-800/70 px-5">
                    <Logo href="/app" size="sm" />
                  </div>
                  <NavLinks onNavigate={() => setMobileOpen(false)} />
                  <UserCard />
                </div>
              </SheetContent>
            </Sheet>
            <span className="hidden font-mono text-xs uppercase tracking-[0.25em] text-zinc-600 lg:inline">
              the dsa arena
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <CommandPaletteTrigger onClick={() => setPaletteOpen(true)} />
            <SoundToggle />
            <ThemeToggle />
            <StreakChip streakCount={user.streakCount} lastActiveDay={user.lastActiveDay} />
            <Link to="/app/shop"
              title="arena shop"
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 font-mono text-xs font-bold text-amber-300 transition-colors hover:border-amber-400/60 hover:bg-amber-500/20"
            >
              <Coins className="h-3.5 w-3.5" />
              {(user.coins ?? 0).toLocaleString()}
            </Link>
            <Link to="/app/profile"
              className="hidden items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 font-mono text-xs text-zinc-300 transition-colors hover:border-emerald-600/40 hover:text-emerald-400 sm:flex"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {user.xp.toLocaleString()} XP
            </Link>
            <RankBadge rating={user.rating} showRating />
            <Link to="/app/profile" aria-label="Profile">
              <PlayerAvatar name={user.username} size="sm" frame={user.equippedFrame} />
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
