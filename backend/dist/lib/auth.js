"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.REFRESH_COOKIE = void 0;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.serializeUser = serializeUser;
// ─── Auth: JWT + bcrypt (replaces Next.js cookie session) ────────────────────
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ACCESS_SECRET = process.env.JWT_SECRET || "codeclash-access-secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "codeclash-refresh-secret";
const ACCESS_TTL = "15m";
const REFRESH_TTL = "30d";
exports.REFRESH_COOKIE = "cc_refresh";
// ─── Password hashing (bcrypt) ────────────────────────────────────────────────
async function hashPassword(password) {
    return bcryptjs_1.default.hash(password, 12);
}
async function verifyPassword(password, stored) {
    return bcryptjs_1.default.compare(password, stored);
}
function signAccessToken(userId, username) {
    return jsonwebtoken_1.default.sign({ sub: userId, username }, ACCESS_SECRET, {
        expiresIn: ACCESS_TTL,
    });
}
function signRefreshToken(userId, username) {
    return jsonwebtoken_1.default.sign({ sub: userId, username }, REFRESH_SECRET, {
        expiresIn: REFRESH_TTL,
    });
}
function verifyAccessToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, ACCESS_SECRET);
    }
    catch {
        return null;
    }
}
function verifyRefreshToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, REFRESH_SECRET);
    }
    catch {
        return null;
    }
}
function serializeUser(u) {
    const obj = u.toObject();
    const { passwordHash: _pw, __v, _id, ...rest } = obj;
    return { ...rest, id: _id.toString() };
}
//# sourceMappingURL=auth.js.map