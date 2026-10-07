"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ─── Auth routes: login, signup, logout, me, guest, demo ─────────────────────
const express_1 = require("express");
const zod_1 = require("zod");
const User_1 = require("../models/User");
const auth_1 = require("../lib/auth");
const auth_2 = require("../middleware/auth");
const router = (0, express_1.Router)();
const REFRESH_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
function setRefreshCookie(res, token) {
    res.cookie(auth_1.REFRESH_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: REFRESH_MAX_AGE_MS,
    });
}
// ── POST /api/auth/signup ─────────────────────────────────────────────────────
const signupSchema = zod_1.z.object({
    username: zod_1.z
        .string()
        .trim()
        .min(2, "Username needs at least 2 characters")
        .max(20, "Username is capped at 20 characters")
        .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers and underscores only"),
    email: zod_1.z
        .string()
        .trim()
        .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "That email doesn't look right")
        .optional()
        .or(zod_1.z.literal("")),
    password: zod_1.z.string().min(6, "Password needs at least 6 characters").max(72),
});
router.post("/signup", async (req, res) => {
    try {
        const parsed = signupSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
            return;
        }
        const { username, email, password } = parsed.data;
        const existing = await User_1.User.findOne({
            $or: [{ username }, ...(email ? [{ email }] : [])],
        });
        if (existing) {
            const msg = existing.username.toLowerCase() === username.toLowerCase()
                ? "That username is already taken"
                : "An account with that email already exists";
            res.status(409).json({ error: msg });
            return;
        }
        const user = await User_1.User.create({
            username,
            email: email || null,
            passwordHash: await (0, auth_1.hashPassword)(password),
        });
        const access = (0, auth_1.signAccessToken)(user._id.toString(), user.username);
        const refresh = (0, auth_1.signRefreshToken)(user._id.toString(), user.username);
        setRefreshCookie(res, refresh);
        res.status(201).json({ user: (0, auth_1.serializeUser)(user), accessToken: access });
    }
    catch {
        res.status(500).json({ error: "Something went wrong. Try again." });
    }
});
// ── POST /api/auth/login ──────────────────────────────────────────────────────
const loginSchema = zod_1.z.object({
    identifier: zod_1.z.string().trim().min(1, "Enter your username or email"),
    password: zod_1.z.string().min(1, "Enter your password"),
});
router.post("/login", async (req, res) => {
    try {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
            return;
        }
        const { identifier, password } = parsed.data;
        const user = await User_1.User.findOne({
            $or: [{ username: identifier }, { email: identifier.toLowerCase() }],
        });
        if (!user || !(await (0, auth_1.verifyPassword)(password, user.passwordHash))) {
            res.status(401).json({ error: "Wrong username or password" });
            return;
        }
        const access = (0, auth_1.signAccessToken)(user._id.toString(), user.username);
        const refresh = (0, auth_1.signRefreshToken)(user._id.toString(), user.username);
        setRefreshCookie(res, refresh);
        res.json({ user: (0, auth_1.serializeUser)(user), accessToken: access });
    }
    catch {
        res.status(500).json({ error: "Something went wrong. Try again." });
    }
});
// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post("/logout", (_req, res) => {
    res.clearCookie(auth_1.REFRESH_COOKIE, { path: "/" });
    res.json({ ok: true });
});
// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get("/me", auth_2.requireAuth, (req, res) => {
    res.json({ user: (0, auth_1.serializeUser)(req.user) });
});
// ── POST /api/auth/refresh ────────────────────────────────────────────────────
router.post("/refresh", async (req, res) => {
    const token = req.cookies?.[auth_1.REFRESH_COOKIE];
    if (!token) {
        res.status(401).json({ error: "No refresh token" });
        return;
    }
    const payload = (0, auth_1.verifyRefreshToken)(token);
    if (!payload) {
        res.status(401).json({ error: "Refresh token expired" });
        return;
    }
    const user = await User_1.User.findById(payload.sub);
    if (!user) {
        res.status(401).json({ error: "User not found" });
        return;
    }
    const access = (0, auth_1.signAccessToken)(user._id.toString(), user.username);
    res.json({ accessToken: access });
});
// ── POST /api/auth/guest ──────────────────────────────────────────────────────
router.post("/guest", async (_req, res) => {
    try {
        const id = Math.random().toString(36).slice(2, 8);
        const username = `guest_${id}`;
        const user = await User_1.User.create({
            username,
            passwordHash: await (0, auth_1.hashPassword)(Math.random().toString(36)),
            isGuest: true,
        });
        const access = (0, auth_1.signAccessToken)(user._id.toString(), user.username);
        const refresh = (0, auth_1.signRefreshToken)(user._id.toString(), user.username);
        setRefreshCookie(res, refresh);
        res.status(201).json({ user: (0, auth_1.serializeUser)(user), accessToken: access });
    }
    catch {
        res.status(500).json({ error: "Could not create guest account" });
    }
});
// ── POST /api/auth/demo ───────────────────────────────────────────────────────
router.post("/demo", async (_req, res) => {
    try {
        let demo = await User_1.User.findOne({ username: "demo" });
        if (!demo) {
            demo = await User_1.User.create({
                username: "demo",
                passwordHash: await (0, auth_1.hashPassword)("demo1234"),
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
        const access = (0, auth_1.signAccessToken)(demo._id.toString(), demo.username);
        const refresh = (0, auth_1.signRefreshToken)(demo._id.toString(), demo.username);
        setRefreshCookie(res, refresh);
        res.json({ user: (0, auth_1.serializeUser)(demo), accessToken: access });
    }
    catch {
        res.status(500).json({ error: "Could not log in as demo" });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map