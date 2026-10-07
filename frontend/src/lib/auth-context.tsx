
// ─── Auth Context — JWT-based authentication for the React frontend ───────────
// Replaces the Next.js user-provider + server-side getSessionUser pattern.

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { api, setAccessToken, clearAccessToken } from "./api";

export interface ClientUser {
  id: string;
  username: string;
  isGuest: boolean;
  xp: number;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  quizWins: number;
  codeWins: number;
  coins: number;
  freezes: number;
  equippedFrame: string | null;
  equippedTitle: string | null;
  streakCount: number;
  lastActiveDay: string | null;
  createdAt: string;
}

interface AuthContextValue {
  user: ClientUser | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  loginAsDemo: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (u: ClientUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ClientUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Try to restore session on mount via refresh token cookie
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.post<{ accessToken: string }>("/auth/refresh");
        setAccessToken(data.accessToken);
        const me = await api.get<{ user: ClientUser }>("/auth/me");
        setUser(me.data.user);
      } catch {
        // No valid session — user stays null
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const { data } = await api.post<{ user: ClientUser; accessToken: string }>("/auth/login", { identifier, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const signup = useCallback(async (username: string, email: string, password: string) => {
    const { data } = await api.post<{ user: ClientUser; accessToken: string }>("/auth/signup", { username, email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const loginAsGuest = useCallback(async () => {
    const { data } = await api.post<{ user: ClientUser; accessToken: string }>("/auth/guest");
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const loginAsDemo = useCallback(async () => {
    const { data } = await api.post<{ user: ClientUser; accessToken: string }>("/auth/demo");
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try { await api.post("/auth/logout"); } catch { /* ignore */ }
    clearAccessToken();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await api.get<{ user: ClientUser }>("/auth/me");
    setUser(data.user);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, loginAsGuest, loginAsDemo, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
