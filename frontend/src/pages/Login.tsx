// ─── Login page (React, no Next.js) ──────────────────────────────────────────
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Loader2, LogIn, Sparkles, UserRound } from "lucide-react";
import { AuthFooter, AuthHeader, AuthPanel } from "../components/game/auth-panel";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../lib/auth-context";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginAsGuest, loginAsDemo } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(identifier, password);
      navigate("/app");
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const guest = async () => {
    setError(null);
    setGuestLoading(true);
    try {
      await loginAsGuest();
      navigate("/app");
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Could not start guest session");
    } finally {
      setGuestLoading(false);
    }
  };

  const demo = async () => {
    setError(null);
    setDemoLoading(true);
    try {
      await loginAsDemo();
      navigate("/app");
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Could not prepare the demo account");
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-zinc-950 text-zinc-100 lg:grid-cols-2">
      <AuthPanel />
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <AuthHeader
            title="Back to the arena"
            subtitle={<>Your rating hasn&apos;t moved while you were gone. <span className="text-zinc-500">Yet.</span></>}
          />
          <div className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier" className="font-mono text-xs uppercase tracking-wider text-zinc-400">username or email</Label>
                <Input id="identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="byte_bandit" autoComplete="username" required className="h-11 rounded-xl border-zinc-800 bg-zinc-900/60 font-mono text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-emerald-500/40" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="font-mono text-xs uppercase tracking-wider text-zinc-400">password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" required className="h-11 rounded-xl border-zinc-800 bg-zinc-900/60 font-mono text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-emerald-500/40" />
              </div>
              <Button type="submit" disabled={loading || guestLoading || demoLoading} className="h-11 w-full rounded-xl bg-emerald-500 font-mono text-sm font-bold text-zinc-950 hover:bg-emerald-400">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                {loading ? "entering…" : "log_in"}
              </Button>
            </form>
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-zinc-800" />
              <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-600">or</span>
              <span className="h-px flex-1 bg-zinc-800" />
            </div>
            <Button onClick={guest} disabled={loading || guestLoading || demoLoading} variant="outline" className="h-11 w-full rounded-xl border-zinc-700 bg-zinc-900/40 font-mono text-sm text-zinc-300 hover:border-emerald-600/50 hover:text-emerald-400">
              {guestLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserRound className="h-4 w-4" />}
              continue as guest
            </Button>
            <Button onClick={demo} disabled={loading || guestLoading || demoLoading} variant="outline" className="h-11 w-full rounded-xl border-amber-500/40 bg-amber-500/5 font-mono text-sm text-amber-300 transition-colors hover:border-amber-400/60 hover:bg-amber-500/15 hover:text-amber-200">
              {demoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {demoLoading ? "seeding the arena…" : "explore demo data — 2 weeks of battles"}
            </Button>
            <p className="text-center font-mono text-[10px] leading-relaxed text-zinc-600">demo account: 19 matches, a cup title and a 6-day streak, seeded fresh every time</p>
          </div>
          <AuthFooter text="New here?" linkText="Create an account" href="/signup" />
        </div>
      </main>
    </div>
  );
}
