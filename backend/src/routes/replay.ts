// ─── Replay route ─────────────────────────────────────────────────────────────
import { Router, Request, Response } from "express";
import { Match } from "../models/Match";
import { User } from "../models/User";
import { optionalAuth } from "../middleware/auth";
import type { PublicReplayResponse } from "../../../modules/types";

const router = Router();

router.get("/:id", optionalAuth, async (req: Request, res: Response) => {
  const match = await Match.findById(req.params.id).lean() as any;
  if (!match) { res.status(404).json({ error: "Match not found" }); return; }

  const owner = await User.findById(match.userId).select("username").lean() as any;
  let details = null;
  try { details = JSON.parse(match.details || "{}"); } catch { /* ignore */ }

  const payload: PublicReplayResponse = {
    id: match._id.toString(),
    ownerName: owner?.username ?? "unknown",
    type: match.type,
    result: match.result,
    score: match.score,
    opponentScore: match.opponentScore,
    opponentName: match.opponentName,
    opponentRating: match.opponentRating,
    problemTitle: match.problemTitle,
    durationSec: match.durationSec,
    createdAt: match.createdAt.toISOString(),
    tournamentName: details?.tournamentName ?? null,
    details,
  };
  res.json(payload);
});

export default router;
