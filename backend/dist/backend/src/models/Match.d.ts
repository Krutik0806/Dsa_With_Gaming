import mongoose, { Document, Model } from "mongoose";
export interface IMatch extends Document {
    userId: mongoose.Types.ObjectId;
    type: "QUIZ" | "CODING";
    result: "WIN" | "LOSS" | "DRAW";
    opponentName: string;
    opponentRating: number;
    ratingChange: number;
    xpEarned: number;
    score: number;
    opponentScore: number;
    problemTitle?: string | null;
    durationSec: number;
    details: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Match: Model<IMatch>;
//# sourceMappingURL=Match.d.ts.map