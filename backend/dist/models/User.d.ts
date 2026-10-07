import mongoose, { Document, Model } from "mongoose";
export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    username: string;
    email?: string | null;
    passwordHash: string;
    isGuest: boolean;
    xp: number;
    rating: number;
    wins: number;
    losses: number;
    draws: number;
    quizWins: number;
    codeWins: number;
    streakCount: number;
    lastActiveDay?: string | null;
    coins: number;
    freezes: number;
    equippedFrame?: string | null;
    equippedTitle?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export declare const User: Model<IUser>;
//# sourceMappingURL=User.d.ts.map