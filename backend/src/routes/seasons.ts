import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { getSeasonArchive } from "../lib/season-archive";

const router = Router();

router.get("/", requireAuth, (req: Request, res: Response) => {
  res.json(getSeasonArchive(req.user!.rating));
});

export default router;
