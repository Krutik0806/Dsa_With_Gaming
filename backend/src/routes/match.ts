// ─── Match routes: GET+POST /api/match ───────────────────────────────────────
import { Router, Request, Response } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { Match } from "../models/Match";
import { User } from "../models/User";
import { TournamentEntry } from "../models/TournamentEntry";
import { serializeUser } from "../lib/auth";
import { newRating, ratingChange, XP_REWARDS, clamp } from "../lib/game";
import { calculateEloMatch } from "../../../modules/elo-engine";
import { getTournament } from "../../../modules/data/tournaments";
import { advanceBracket, parseBracket } from "../lib/tournament-engine";
import { touchStreakActivity } from "../lib/streak";
import { COIN_REWARDS, coinsForMatch } from "../lib/shop";
import { recordTransaction, TransactionSource } from "../lib/ledger";
import type { TournamentMatchUpdate } from "../../../modules/types";

const router = Router();
router.use(requireAuth);

const schema = z.object({
  type: z.enum(["QUIZ", "CODING"]),
  result: z.enum(["WIN", "LOSS", "DRAW"]),
  opponentName: z.string().trim().min(1).max(40),
  opponentRating: z.number().int().min(100).max(3000),
  score: z.number().int().min(0).max(100000),
  opponentScore: z.number().int().min(0).max(100000),
  problemTitle: z.string().max(120).optional().nullable(),
  durationSec: z.number().int().min(1).max(7200),
  details: z.record(z.string(), z.unknown()).optional().default({}),
  tournament: z.object({ slug: z.string().min(1).max(64), round: z.number().int().min(1).max(5) }).optional(),
});

router.get("/", async (req: Request, res: Response) => {
  const matches = await Match.find({ userId: req.user!._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const annotated = matches.map((m: any) => {
    let tournamentName: string | null = null;
    let human = false;
    try {
      const d = JSON.parse(m.details || "{}") as { tournamentName?: string; human?: boolean };
      tournamentName = d.tournamentName ?? null;
      human = d.human === true;
    } catch { /* malformed payload */ }
    return { ...m, id: m._id.toString(), tournamentName, human };
  });
  res.json({ matches: annotated });
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const match = await Match.findById(req.params.id).lean();
    if (!match || match.userId.toString() !== req.user!._id.toString()) {
      res.status(404).json({ error: "Match not found" });
      return;
    }
    let quizDetails: any = null;
    let codingDetails: any = null;
    let tournamentName: string | null = null;
    try {
      const parsed = JSON.parse((match as any).details || "{}");
      if (match.type === "QUIZ" && parsed.review) quizDetails = parsed;
      if (match.type === "CODING" && parsed.problemSlug) codingDetails = parsed;
      if (typeof parsed.tournamentName === "string") tournamentName = parsed.tournamentName;
    } catch { /* summary only */ }

    const summary = {
      ...match,
      id: match._id.toString(),
      tournamentName,
      createdAt: (match as any).createdAt ? new Date((match as any).createdAt).toISOString() : new Date().toISOString(),
    };
    res.json({ match: summary, quizDetails, codingDetails, tournamentName });
  } catch {
    res.status(500).json({ error: "Could not load match" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid match payload" }); return; }
  const m = parsed.data;
  const user = req.user!;

  // ELO Engine with adaptive K-factor & streak momentum
  const score = m.result === "WIN" ? 1 : m.result === "LOSS" ? 0 : 0.5;
  const matchCount = await Match.countDocuments({ userId: user._id });
  const eloResult = calculateEloMatch({
    playerRating: user.rating,
    opponentRating: m.opponentRating,
    score: score as 1 | 0.5 | 0,
    gamesPlayed: matchCount,
    currentStreak: (user as any).winStreak ?? 0,
  });
  const change = eloResult.delta;
  const rating = eloResult.newRating;

  // Streak
  const touched = await touchStreakActivity(user);
  const u = touched.user;
  const multiplier = touched.state.multiplier;

  // XP
  let xpEarned = 0;
  if (m.type === "QUIZ") {
    xpEarned = XP_REWARDS.QUIZ_PLAY + (m.result === "WIN" ? XP_REWARDS.QUIZ_WIN : 0);
  } else {
    const details = m.details as { userTestsPassed?: number; totalTests?: number };
    const tests = clamp(details.userTestsPassed ?? 0, 0, details.totalTests ?? 20);
    xpEarned = XP_REWARDS.CODE_PLAY + tests * XP_REWARDS.CODE_PER_TEST + (m.result === "WIN" ? XP_REWARDS.CODE_WIN : 0);
  }
  xpEarned = Math.round(xpEarned * multiplier);

  // Tournament
  let tournamentUpdate: TournamentMatchUpdate | undefined;
  let xpBonus = 0;
  let coinsEarned = coinsForMatch(m.result);
  let cupRoundBonus = 0;
  let cupChampionBonus = 0;
  let cupName: string | null = null;
  let cupRound = 0;
  const details = { ...(m.details ?? {}) } as any;

  if (m.tournament) {
    const t = getTournament(m.tournament.slug);
    const entry = t
      ? await TournamentEntry.findOne({ userId: u._id, slug: t.slug })
      : null;
    if (t && entry && entry.status === "ACTIVE" && entry.round === m.tournament.round) {
      const bracket = parseBracket(entry.bracket, u.username);
      const adv = advanceBracket(bracket, m.tournament.round, m.result, m.score, m.opponentScore, t.gameType, t.prizeXp);
      xpBonus = Math.round(adv.xpBonus * multiplier);
      await TournamentEntry.findByIdAndUpdate(entry._id, {
        status: adv.status,
        round: adv.round,
        placement: adv.placement,
        bracket: JSON.stringify(adv.bracket),
        xpAwarded: entry.xpAwarded + adv.xpBonus,
      });
      tournamentUpdate = {
        advanced: adv.advanced,
        status: adv.status,
        round: adv.round,
        placement: adv.placement,
        xpBonus: adv.xpBonus,
        eliminatedIn: adv.eliminatedIn,
      };
      details.tournamentSlug = t.slug;
      details.tournamentName = t.name;
      details.tournamentRound = m.tournament.round;
      if (adv.advanced) { coinsEarned += COIN_REWARDS.CUP_ROUND_WIN; cupRoundBonus = COIN_REWARDS.CUP_ROUND_WIN; }
      if (adv.status === "CHAMPION") { coinsEarned += COIN_REWARDS.CUP_CHAMPION; cupChampionBonus = COIN_REWARDS.CUP_CHAMPION; }
      cupName = t.name;
      cupRound = m.tournament.round;
    }
  }

  const match = await Match.create({
    userId: u._id,
    type: m.type,
    result: m.result,
    opponentName: m.opponentName,
    opponentRating: m.opponentRating,
    ratingChange: change,
    xpEarned,
    score: m.score,
    opponentScore: m.opponentScore,
    problemTitle: m.problemTitle ?? null,
    durationSec: m.durationSec,
    details: JSON.stringify(details),
  });

  const updated = await User.findByIdAndUpdate(
    u._id,
    {
      rating,
      xp: u.xp + xpEarned + xpBonus,
      coins: u.coins + coinsEarned,
      wins: u.wins + (m.result === "WIN" ? 1 : 0),
      losses: u.losses + (m.result === "LOSS" ? 1 : 0),
      draws: u.draws + (m.result === "DRAW" ? 1 : 0),
      quizWins: u.quizWins + (m.type === "QUIZ" && m.result === "WIN" ? 1 : 0),
      codeWins: u.codeWins + (m.type === "CODING" && m.result === "WIN" ? 1 : 0),
    },
    { new: true }
  );

  const matchSource: TransactionSource = m.result === "WIN" ? "MATCH_WIN" : m.result === "DRAW" ? "MATCH_DRAW" : "MATCH_LOSS";
  const ledgerRows: { amount: number; source: TransactionSource; description: string }[] = [
    { amount: coinsForMatch(m.result), source: matchSource, description: `${m.type === "QUIZ" ? "quiz" : "coding"} ${m.result.toLowerCase()} vs ${m.opponentName}` },
  ];
  if (cupRoundBonus > 0) ledgerRows.push({ amount: cupRoundBonus, source: "CUP_ROUND", description: `cup round ${cupRound} bonus · ${cupName}` });
  if (cupChampionBonus > 0) ledgerRows.push({ amount: cupChampionBonus, source: "CUP_CHAMPION", description: `cup champion purse · ${cupName}` });
  await Promise.all(ledgerRows.map((row) => recordTransaction(u._id, row.amount, row.source, row.description)));

  res.status(201).json({
    match: { ...match.toObject(), id: match._id.toString() },
    user: serializeUser(updated!),
    ratingChange: change,
    xpEarned,
    coinsEarned,
    tournament: tournamentUpdate,
    streak: { multiplier, days: touched.state.count },
    eloBreakdown: {
      expectedWinPct: eloResult.expectedWinPct,
      kFactor: eloResult.kFactor,
      streakBonus: eloResult.streakBonus,
      promoted: eloResult.promoted,
      demoted: eloResult.demoted,
      tier: eloResult.newTier,
    },
  });
});

export default router;
