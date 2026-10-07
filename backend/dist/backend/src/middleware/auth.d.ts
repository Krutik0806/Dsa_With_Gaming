import { Request, Response, NextFunction } from "express";
import { IUser } from "../models/User";
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
export declare function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * optionalAuth — attaches user if token present, never 401s.
 * Used for public routes that benefit from knowing who's asking.
 */
export declare function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=auth.d.ts.map