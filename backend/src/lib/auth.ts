// ─── Auth: JWT + bcrypt (replaces Next.js cookie session) ────────────────────
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { IUser } from "../models/User";

const ACCESS_SECRET = process.env.JWT_SECRET || "codeclash-access-secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "codeclash-refresh-secret";
const ACCESS_TTL = "15m";
const REFRESH_TTL = "30d";

export const REFRESH_COOKIE = "cc_refresh";

// ─── Password hashing (bcrypt) ────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  return bcrypt.compare(password, stored);
}

// ─── JWT helpers ──────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string; // user ID
  username: string;
}

export function signAccessToken(userId: string, username: string): string {
  return jwt.sign({ sub: userId, username } as JwtPayload, ACCESS_SECRET, {
    expiresIn: ACCESS_TTL,
  });
}

export function signRefreshToken(userId: string, username: string): string {
  return jwt.sign({ sub: userId, username } as JwtPayload, REFRESH_SECRET, {
    expiresIn: REFRESH_TTL,
  });
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// ─── User serializer ──────────────────────────────────────────────────────────

export type PublicUser = Omit<IUser, "passwordHash" | "__v"> & { id: string };

export function serializeUser(u: IUser): PublicUser {
  const obj = u.toObject();
  const { passwordHash: _pw, __v, _id, ...rest } = obj as any;
  return { ...rest, id: _id.toString() };
}
