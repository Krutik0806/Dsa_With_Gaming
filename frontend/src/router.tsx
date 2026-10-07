// ─── React Router v6 routes + protected route wrapper ────────────────────────
import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./lib/auth-context";

import LandingPage from "./pages/Landing";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup";

// Lazy-load internal app pages for code splitting
const AppLayout       = lazy(() => import("./pages/AppLayout"));
const DashboardPage   = lazy(() => import("./pages/Dashboard"));
const BattlePage      = lazy(() => import("./pages/game/Battle"));
const QuizPage        = lazy(() => import("./pages/game/Quiz"));
const LearnPage       = lazy(() => import("./pages/Learn"));
const LessonDetailPage = lazy(() => import("./pages/LessonDetail"));
const PracticePage    = lazy(() => import("./pages/Practice"));
const ProblemDetailPage = lazy(() => import("./pages/ProblemDetail"));
const LeaderboardPage = lazy(() => import("./pages/Leaderboard"));
const ProfilePage     = lazy(() => import("./pages/Profile"));
const HistoryPage     = lazy(() => import("./pages/History"));
const MatchDetailPage = lazy(() => import("./pages/MatchDetail"));
const ShopPage        = lazy(() => import("./pages/Shop"));
const SeasonsPage     = lazy(() => import("./pages/Seasons"));
const TournamentsPage = lazy(() => import("./pages/Tournaments"));
const TournamentDetailPage = lazy(() => import("./pages/TournamentDetail"));
const ReplayPage      = lazy(() => import("./pages/Replay"));

// ── PrivateRoute — redirects to /login if not authenticated ──────────────────
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500 text-sm font-mono animate-pulse">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

// ── PublicRoute — redirects authenticated users away from login/signup ────────
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500 text-sm font-mono animate-pulse">Loading…</div>
      </div>
    );
  }
  if (user) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

const Fallback = () => (
  <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
    <div className="text-zinc-500 text-sm font-mono animate-pulse">Loading…</div>
  </div>
);

export function AppRouter() {
  return (
    <Suspense fallback={<Fallback />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
        <Route path="/replay/:id" element={<ReplayPage />} />

        {/* Protected — nested under /app */}
        <Route
          path="/app"
          element={<PrivateRoute><AppLayout /></PrivateRoute>}
        >
          <Route index element={<DashboardPage />} />
          <Route path="game/battle" element={<BattlePage />} />
          <Route path="game/quiz" element={<QuizPage />} />
          <Route path="learn" element={<LearnPage />} />
          <Route path="learn/:slug" element={<LessonDetailPage />} />
          <Route path="practice" element={<PracticePage />} />
          <Route path="practice/:slug" element={<ProblemDetailPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="history/:id" element={<MatchDetailPage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="seasons" element={<SeasonsPage />} />
          <Route path="tournaments" element={<TournamentsPage />} />
          <Route path="tournaments/:slug" element={<TournamentDetailPage />} />
        </Route>

        {/* Redirects for old quiz/battle paths */}
        <Route path="/app/quiz" element={<Navigate to="/app/game/quiz" replace />} />
        <Route path="/app/battle" element={<Navigate to="/app/game/battle" replace />} />

        {/* Top-level aliases to /app/... */}
        <Route path="/learn" element={<Navigate to="/app/learn" replace />} />
        <Route path="/learn/:slug" element={<Navigate to="/app/learn/:slug" replace />} />
        <Route path="/practice" element={<Navigate to="/app/practice" replace />} />
        <Route path="/practice/:slug" element={<Navigate to="/app/practice/:slug" replace />} />
        <Route path="/tournaments" element={<Navigate to="/app/tournaments" replace />} />
        <Route path="/tournaments/:slug" element={<Navigate to="/app/tournaments/:slug" replace />} />
        <Route path="/leaderboard" element={<Navigate to="/app/leaderboard" replace />} />
        <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
        <Route path="/history" element={<Navigate to="/app/history" replace />} />
        <Route path="/history/:id" element={<Navigate to="/app/history/:id" replace />} />
        <Route path="/shop" element={<Navigate to="/app/shop" replace />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
