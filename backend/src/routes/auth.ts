// ─── Auth routes: login, signup, logout, me, guest, demo ─────────────────────
import { Router, Request, Response } from "express";
import { z } from "zod";
import { User } from "../models/User";
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  serializeUser,
  REFRESH_COOKIE,
} from "../lib/auth";
import { requireAuth } from "../middleware/auth";

const router = Router();

const REFRESH_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_MAX_AGE_MS,
  });
}

// ── POST /api/auth/signup ─────────────────────────────────────────────────────
const signupSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, "Username needs at least 2 characters")
    .max(20, "Username is capped at 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers and underscores only"),
  email: z
    .string()
    .trim()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "That email doesn't look right")
    .optional()
    .or(z.literal("")),
  password: z.string().min(6, "Password needs at least 6 characters").max(72),
});

router.post("/signup", async (req: Request, res: Response) => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
      return;
    }
    const { username, email, password } = parsed.data;

    const existing = await User.findOne({
      $or: [{ username }, ...(email ? [{ email }] : [])],
    });
    if (existing) {
      const msg =
        existing.username.toLowerCase() === username.toLowerCase()
          ? "That username is already taken"
          : "An account with that email already exists";
      res.status(409).json({ error: msg });
      return;
    }

    const user = await User.create({
      username,
      email: email || null,
      passwordHash: await hashPassword(password),
    });

    const access = signAccessToken(user._id.toString(), user.username);
    const refresh = signRefreshToken(user._id.toString(), user.username);
    setRefreshCookie(res, refresh);
    res.status(201).json({ user: serializeUser(user), accessToken: access });
  } catch {
    res.status(500).json({ error: "Something went wrong. Try again." });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your username or email"),
  password: z.string().min(1, "Enter your password"),
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
      return;
    }
    const { identifier, password } = parsed.data;

    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier.toLowerCase() }],
    });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      res.status(401).json({ error: "Wrong username or password" });
      return;
    }

    const access = signAccessToken(user._id.toString(), user.username);
    const refresh = signRefreshToken(user._id.toString(), user.username);
    setRefreshCookie(res, refresh);
    res.json({ user: serializeUser(user), accessToken: access });
  } catch {
    res.status(500).json({ error: "Something went wrong. Try again." });
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie(REFRESH_COOKIE, { path: "/" });
  res.json({ ok: true });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get("/me", requireAuth, (req: Request, res: Response) => {
  res.json({ user: serializeUser(req.user!) });
});

// ── POST /api/auth/refresh ────────────────────────────────────────────────────
router.post("/refresh", async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) { res.status(401).json({ error: "No refresh token" }); return; }
  const payload = verifyRefreshToken(token);
  if (!payload) { res.status(401).json({ error: "Refresh token expired" }); return; }
  const user = await User.findById(payload.sub);
  if (!user) { res.status(401).json({ error: "User not found" }); return; }
  const access = signAccessToken(user._id.toString(), user.username);
  res.json({ accessToken: access });
});

// ── POST /api/auth/guest ──────────────────────────────────────────────────────
router.post("/guest", async (_req: Request, res: Response) => {
  try {
    const id = Math.random().toString(36).slice(2, 8);
    const username = `guest_${id}`;
    const user = await User.create({
      username,
      passwordHash: await hashPassword(Math.random().toString(36)),
      isGuest: true,
    });
    const access = signAccessToken(user._id.toString(), user.username);
    const refresh = signRefreshToken(user._id.toString(), user.username);
    setRefreshCookie(res, refresh);
    res.status(201).json({ user: serializeUser(user), accessToken: access });
  } catch {
    res.status(500).json({ error: "Could not create guest account" });
  }
});

// ── POST /api/auth/demo ───────────────────────────────────────────────────────
router.post("/demo", async (_req: Request, res: Response) => {
  try {
    let demo = await User.findOne({ username: "demo" });
    if (!demo) {
      demo = await User.create({
        username: "demo",
        passwordHash: await hashPassword("demo1234"),
        xp: 3200,
        rating: 1250,
        wins: 18,
        losses: 9,
        draws: 3,
        quizWins: 10,
        codeWins: 8,
        coins: 480,
        streakCount: 5,
      });
    }
    const access = signAccessToken(demo._id.toString(), demo.username);
    const refresh = signRefreshToken(demo._id.toString(), demo.username);
    setRefreshCookie(res, refresh);
    res.json({ user: serializeUser(demo), accessToken: access });
  } catch {
    res.status(500).json({ error: "Could not log in as demo" });
  }
});

export default router;
