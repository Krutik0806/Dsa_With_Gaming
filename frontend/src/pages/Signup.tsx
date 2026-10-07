// ─── Signup page (React, no Next.js) ─────────────────────────────────────────
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Loader2, Rocket, UserRound } from "lucide-react";
import { AuthFooter, AuthHeader, AuthPanel } from "../components/game/auth-panel";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../lib/auth-context";

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup, loginAsGuest } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError("Password needs at least 6 characters"); return; }
    setLoading(true);
    try {
      await signup(username, email, password);
      navigate("/app");
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Signup failed");
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

  return (
    <div className="grid min-h-screen bg-zinc-950 text-zinc-100 lg:grid-cols-2">
      <AuthPanel />
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <AuthHeader title="Enlist in the arena" subtitle="Free forever. Your rating starts at 1000 — where it goes is up to you." />
          <div className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
              </div>
            )}
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="font-mono text-xs uppercase tracking-wider text-zinc-400">username</Label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="future_grandmaster" autoComplete="username" required minLength={2} maxLength={20} className="h-11 rounded-xl border-zinc-800 bg-zinc-900/60 font-mono text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-emerald-500/40" />
                <p className="font-mono text-[11px] text-zinc-600">letters, numbers, underscores — this is your arena name</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="font-mono text-xs uppercase tracking-wider text-zinc-400">email <span className="normal-case text-zinc-600">(optional)</span></Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className="h-11 rounded-xl border-zinc-800 bg-zinc-900/60 font-mono text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-emerald-500/40" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="font-mono text-xs uppercase tracking-wider text-zinc-400">password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="at least 6 characters" autoComplete="new-password" required className="h-11 rounded-xl border-zinc-800 bg-zinc-900/60 font-mono text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-emerald-500/40" />
              </div>
              <Button type="submit" disabled={loading || guestLoading} className="h-11 w-full rounded-xl bg-emerald-500 font-mono text-sm font-bold text-zinc-950 hover:bg-emerald-400">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                {loading ? "creating…" : "create_account"}
              </Button>
            </form>
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-zinc-800" />
              <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-600">or</span>
              <span className="h-px flex-1 bg-zinc-800" />
            </div>
            <Button onClick={guest} disabled={loading || guestLoading} variant="outline" className="h-11 w-full rounded-xl border-zinc-700 bg-zinc-900/40 font-mono text-sm text-zinc-300 hover:border-emerald-600/50 hover:text-emerald-400">
              {guestLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserRound className="h-4 w-4" />}
              try it as a guest first
            </Button>
          </div>
          <AuthFooter text="Already enlisted?" linkText="Log in" href="/login" />
        </div>
      </main>
    </div>
  );
}
