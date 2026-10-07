// ─── Coin transaction ledger (server-only, Mongoose version) ─────────────────
import { Transaction } from "../models/Transaction";
import mongoose from "mongoose";

export type TransactionSource =
  | "MATCH_WIN"
  | "MATCH_DRAW"
  | "MATCH_LOSS"
  | "CUP_ROUND"
  | "CUP_CHAMPION"
  | "DAILY_CHECKIN"
  | "DAILY_CHALLENGE"
  | "SHOP_PURCHASE"
  | "SEED"
  | "SEASON";

export async function recordTransaction(
  userId: string | mongoose.Types.ObjectId,
  amount: number,
  source: TransactionSource,
  description: string,
  at?: Date
): Promise<void> {
  try {
    await Transaction.create({
      userId,
      amount,
      source,
      description,
      ...(at ? { createdAt: at } : {}),
    });
  } catch (e) {
    console.error(`ledger write failed (${source} ${amount} for ${userId})`, e);
  }
}
