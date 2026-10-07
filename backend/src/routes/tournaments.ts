// ─── Tournaments routes ───────────────────────────────────────────────────────
import { Router, Request, Response } from "express";
import { z } from "zod";
import { requireAuth, optionalAuth } from "../middleware/auth";
import { TournamentEntry } from "../models/TournamentEntry";
import { User } from "../models/User";
import { TOURNAMENTS, getTournament } from "../../../modules/data/tournaments";
import { parseBracket, generateBracket } from "../lib/tournament-engine";
import { touchStreakActivity } from "../lib/streak";
import { recordTransaction } from "../lib/ledger";
import type { TournamentListResponse, TournamentDetailResponse } from "../../../modules/types";

const router = Router();

// GET /api/tournaments — public list, entries if logged in
router.get("/", optionalAuth, async (req: Request, res: Response) => {
  let entries: Record<string, TournamentListResponse["entries"][string]> = {};
  if (req.user) {
    const rows = await TournamentEntry.find({ userId: req.user._id }).select("slug status").lean();
    entries = Object.fromEntries((rows as any[]).map((r) => [r.slug, r.status])) as TournamentListResponse["entries"];
  }
  res.json({ tournaments: TOURNAMENTS, entries });
});

// GET /api/tournaments/:slug
router.get("/:slug", requireAuth, async (req: Request, res: Response) => {
  const t = getTournament(req.params.slug);
  if (!t) { res.status(404).json({ error: "Tournament not found" }); return; }
  const entry = await TournamentEntry.findOne({ userId: req.user!._id, slug: t.slug }).lean() as any;
  const entryState = entry
    ? {
        status: entry.status,
        round: entry.round,
        roundsTotal: t.roundsTotal,
        placement: entry.placement,
        bracket: JSON.parse(entry.bracket || "{}"),
        nextOpponent: null,
        xpAwarded: entry.xpAwarded,
      }
    : null;
  const payload: TournamentDetailResponse = { tournament: t as any, entry: entryState };
  res.json(payload);
});

// POST /api/tournaments/:slug/enter
router.post("/:slug/enter", requireAuth, async (req: Request, res: Response) => {
  const t = getTournament(req.params.slug);
  if (!t) { res.status(404).json({ error: "Tournament not found" }); return; }
  const user = req.user!;

  const existing = await TournamentEntry.findOne({ userId: user._id, slug: t.slug });
  if (existing) { res.status(409).json({ error: "Already entered" }); return; }

  const touched = await touchStreakActivity(user);
  const bracket = generateBracket(user.rating, touched.user.username);

  const entry = await TournamentEntry.create({
    userId: user._id,
    slug: t.slug,
    status: "ACTIVE",
    round: 1,
    bracket: JSON.stringify(bracket),
  });

  res.status(201).json({ entry: { ...entry.toObject(), id: entry._id.toString() }, tournament: t });
});

export default router;
