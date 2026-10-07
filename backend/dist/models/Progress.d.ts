import mongoose, { Document, Model } from "mongoose";
export interface IProgress extends Document {
    userId: mongoose.Types.ObjectId;
    kind: "LESSON" | "PROBLEM" | "DAILY";
    refId: string;
    xpAwarded: number;
    createdAt: Date;
}
export declare const Progress: Model<IProgress>;
//# sourceMappingURL=Progress.d.ts.map