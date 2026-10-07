import type { IUser } from "../models/User";
export declare const REFRESH_COOKIE = "cc_refresh";
export declare function hashPassword(password: string): Promise<string>;
export declare function verifyPassword(password: string, stored: string): Promise<boolean>;
export interface JwtPayload {
    sub: string;
    username: string;
}
export declare function signAccessToken(userId: string, username: string): string;
export declare function signRefreshToken(userId: string, username: string): string;
export declare function verifyAccessToken(token: string): JwtPayload | null;
export declare function verifyRefreshToken(token: string): JwtPayload | null;
export type PublicUser = Omit<IUser, "passwordHash" | "__v"> & {
    id: string;
};
export declare function serializeUser(u: IUser): PublicUser;
//# sourceMappingURL=auth.d.ts.map