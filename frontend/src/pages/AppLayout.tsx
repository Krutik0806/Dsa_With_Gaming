// ─── App Layout — authenticated shell (replaces src/app/app/layout.tsx) ───────
// The Next.js version did server-side auth redirect + passed user via props.
// Here: auth guard is in the router, user comes from AuthContext.
import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { AppShell } from "../components/game/app-shell";

export default function AppLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // This should never render without a user (PrivateRoute guards it)
  // but as safety net:
  if (!user) return null;

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
