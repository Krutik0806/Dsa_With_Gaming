import { Link } from "react-router-dom";
import { Swords } from "lucide-react";
import { Logo } from "@/components/game/logo";

export function AuthPanel() {
  return (
    <aside className="cc-grid-bg cc-radial-fade relative hidden flex-col justify-between overflow-hidden border-r border-zinc-800/70 bg-zinc-950 p-10 lg:flex xl:p-14">
      <Logo />
      <div>
        <h2 className="max-w-md text-4xl font-black leading-tight tracking-tight">
          Every algorithm you master is another <span className="text-emerald-400">weapon</span> in the arena.
        </h2>
        <ul className="mt-8 space-y-3 font-mono text-sm text-zinc-400">
          <li className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            climb from Bronze to Grandmaster
          </li>
          <li className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            real judge, real test races, real ELO swings
          </li>
          <li className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
            a quiz battle takes two minutes flat
          </li>
        </ul>
      </div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <p className="font-mono text-sm leading-relaxed text-zinc-400">
          &ldquo;Learn DSA. Practice DSA. Challenge someone. Improve. Challenge stronger opponents.&rdquo;
        </p>
        <p className="mt-2 font-mono text-xs text-zinc-600">— the CodeClash loop</p>
      </div>
      <span className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
    </aside>
  );
}

export function AuthHeader({ title, subtitle }: { title: string; subtitle: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="mb-8 lg:hidden">
        <Logo />
      </div>
      <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
        <Swords className="h-6 w-6 text-emerald-400" />
        {title}
      </h1>
      <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>
    </div>
  );
}

export function AuthFooter({ text, linkText, href }: { text: string; linkText: string; href: string }) {
  return (
    <p className="mt-8 text-center text-sm text-zinc-500">
      {text}{" "}
      <Link to={href} className="font-medium text-emerald-400 transition-colors hover:text-emerald-300">
        {linkText}
      </Link>
    </p>
  );
}
