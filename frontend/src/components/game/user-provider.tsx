// ─── user-provider: now a thin shim over auth-context ────────────────────────
// All pages that previously imported useUser / UserProvider now work unchanged.
// The real auth state lives in src/lib/auth-context.tsx

import React from "react";
import { useAuth, type ClientUser } from "@/lib/auth-context";

export type { ClientUser };

// UserProvider is kept for any place that still wraps with it — it's now a no-op
// because AuthProvider in main.tsx is the true provider.
export function UserProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useUser() {
  const { user, setUser, refreshUser } = useAuth();
  if (!user) throw new Error("useUser called before user is available");
  return {
    user,
    setUser,
    refresh: refreshUser,
  };
}
