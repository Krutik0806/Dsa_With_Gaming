import { useState } from "react";
import {
  Trophy,
  Flame,
  Percent,
  TrendingUp,
  ShieldAlert,
  ChevronRight,
  Info,
  X,
  Sparkles,
} from "lucide-react";
import {
  getRankTier,
  calculateExpectedScore,
  getAdaptiveKFactor,
  calculateEloMatch,
  type RankTierInfo,
} from "@/lib/elo-engine";

interface EloBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRating: number;
  userName?: string;
  opponentRating?: number;
  opponentName?: string;
  matchResult?: "WIN" | "LOSS" | "DRAW";
  actualDelta?: number;
  streak?: number;
}

export function EloBreakdownModal({
  isOpen,
  onClose,
  userRating,
  userName = "You",
  opponentRating = 1200,
  opponentName = "Opponent",
  matchResult,
  actualDelta,
  streak = 0,
}: EloBreakdownModalProps) {
  const [simOpponentRating, setSimOpponentRating] = useState(opponentRating);

  if (!isOpen) return null;

  const currentTier = getRankTier(userRating);
  const winProbability = Math.round(calculateExpectedScore(userRating, simOpponentRating) * 1000) / 10;
  const kFactor = getAdaptiveKFactor(30, userRating);

  const simWin = calculateEloMatch({
    playerRating: userRating,
    opponentRating: simOpponentRating,
    score: 1,
    currentStreak: streak,
  });

  const simLoss = calculateEloMatch({
    playerRating: userRating,
    opponentRating: simOpponentRating,
    score: 0,
    currentStreak: 0,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-emerald-500/10 text-zinc-100 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl font-bold shadow-lg"
            style={{
              backgroundColor: `${currentTier.badgeColor}22`,
              borderColor: currentTier.badgeColor,
              borderWidth: "1.5px",
              color: currentTier.badgeColor,
            }}
          >
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Competitive ELO Engine</h2>
            <p className="text-xs text-zinc-400">
              Standard Logistic Distribution Curve (FIDE/Chess & Esports Grade)
            </p>
          </div>
        </div>

        {/* Current Tier & Progress */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Current Standing</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-lg font-bold" style={{ color: currentTier.badgeColor }}>
                  {currentTier.fullName}
                </span>
                <span className="text-xs text-zinc-400 font-mono">({userRating} ELO)</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-zinc-400">Next Division In</span>
              <div className="text-sm font-bold font-mono text-emerald-400">
                {currentTier.pointsToNext > 0 ? `+${currentTier.pointsToNext} pts` : "Max Rank"}
              </div>
            </div>
          </div>

          {/* Tier Progress Bar */}
          <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden mb-1.5">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${currentTier.progressPercent}%`,
                backgroundColor: currentTier.badgeColor,
              }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
            <span>{currentTier.minRating}</span>
            <span>{currentTier.progressPercent}% to next bracket</span>
            <span>{currentTier.maxRating}</span>
          </div>
        </div>

        {/* If match result provided */}
        {matchResult && actualDelta !== undefined && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Recent Match Evaluation
              </span>
              <span
                className={`text-sm font-black font-mono px-2 py-0.5 rounded ${
                  actualDelta >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                }`}
              >
                {actualDelta >= 0 ? `+${actualDelta}` : actualDelta} ELO
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs text-zinc-300">
              <div className="flex justify-between">
                <span className="text-zinc-400">Opponent:</span>
                <span className="font-semibold">{opponentName} ({opponentRating})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Expected Win:</span>
                <span className="font-mono">{winProbability}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Live Matchup Simulator */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-1.5 text-zinc-200">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Matchup ELO Simulator
            </h3>
            <span className="text-xs font-mono text-zinc-400">
              Opponent: <strong className="text-zinc-200">{simOpponentRating} ELO</strong>
            </span>
          </div>

          <input
            type="range"
            min="600"
            max="2600"
            step="25"
            value={simOpponentRating}
            onChange={(e) => setSimOpponentRating(Number(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 mb-4"
          />

          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="rounded-lg bg-zinc-950/80 p-2.5 border border-zinc-800">
              <span className="text-[11px] text-zinc-400 block mb-0.5">Win Probability</span>
              <span className="text-sm font-bold font-mono text-indigo-400">{winProbability}%</span>
            </div>
            <div className="rounded-lg bg-zinc-950/80 p-2.5 border border-emerald-900/40">
              <span className="text-[11px] text-emerald-400/80 block mb-0.5">If You Win</span>
              <span className="text-sm font-bold font-mono text-emerald-400">+{simWin.delta} ELO</span>
            </div>
            <div className="rounded-lg bg-zinc-950/80 p-2.5 border border-red-900/40">
              <span className="text-[11px] text-red-400/80 block mb-0.5">If You Lose</span>
              <span className="text-sm font-bold font-mono text-red-400">{simLoss.delta} ELO</span>
            </div>
          </div>
        </div>

        {/* Engine Specs */}
        <div className="space-y-2 text-xs text-zinc-400 border-t border-zinc-800/80 pt-4">
          <div className="flex items-center gap-1.5 font-medium text-zinc-300">
            <Info className="w-3.5 h-3.5 text-emerald-400" /> How Rating Is Calculated:
          </div>
          <ul className="list-disc list-inside space-y-1 pl-1 text-[11.5px] leading-relaxed">
            <li>
              <strong>Adaptive K-Factor:</strong> Currently <code className="text-emerald-400 font-mono">K={kFactor}</code> based on your skill tier.
            </li>
            <li>
              <strong>Streak Momentum:</strong> Win streaks of 3+ matches grant a 12% to 25% accelerated ELO bonus.
            </li>
            <li>
              <strong>Expected Score formula:</strong> <code className="text-zinc-300 font-mono">E = 1 / (1 + 10^((R_opp - R_you) / 400))</code>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
