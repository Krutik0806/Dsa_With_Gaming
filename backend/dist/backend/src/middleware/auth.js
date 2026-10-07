"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.optionalAuth = optionalAuth;
const auth_1 = require("../lib/auth");
const User_1 = require("../models/User");
/**
 * requireAuth — 401 if no valid access token.
 * Reads from: Authorization: Bearer <token>
 */
async function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
        res.status(401).json({ error: "Not authenticated" });
        return;
    }
    const payload = (0, auth_1.verifyAccessToken)(token);
    if (!payload) {
        res.status(401).json({ error: "Token expired or invalid" });
        return;
    }
    const user = await User_1.User.findById(payload.sub);
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
async function optionalAuth(req, _res, next) {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (token) {
        const payload = (0, auth_1.verifyAccessToken)(token);
        if (payload) {
            const user = await User_1.User.findById(payload.sub);
            if (user)
                req.user = user;
        }
    }
    next();
}
//# sourceMappingURL=auth.js.map