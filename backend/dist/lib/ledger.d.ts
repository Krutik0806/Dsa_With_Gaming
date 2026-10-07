import mongoose from "mongoose";
export type TransactionSource = "MATCH_WIN" | "MATCH_DRAW" | "MATCH_LOSS" | "CUP_ROUND" | "CUP_CHAMPION" | "DAILY_CHECKIN" | "DAILY_CHALLENGE" | "SHOP_PURCHASE" | "SEED" | "SEASON";
export declare function recordTransaction(userId: string | mongoose.Types.ObjectId, amount: number, source: TransactionSource, description: string, at?: Date): Promise<void>;
//# sourceMappingURL=ledger.d.ts.map