// ─── JWT auth middleware ───────────────────────────────────────────────────────
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/auth";
import { User, IUser } from "../models/User";

// Augment Express Request to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

/**
 * requireAuth — 401 if no valid access token.
 * Reads from: Authorization: Bearer <token>
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    res.status(401).json({ error: "Token expired or invalid" });
    return;
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  req.user = user;
  next();
}

/**
 * optionalAuth — attaches user if token present, never 401s.
 * Used for public routes that benefit from knowing who's asking.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) {
      const user = await User.findById(payload.sub);
      if (user) req.user = user;
    }
  }
  next();
}
