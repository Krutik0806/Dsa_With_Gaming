import mongoose, { Schema, Document, Model } from "mongoose";

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

const MatchSchema = new Schema<IMatch>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["QUIZ", "CODING"], required: true },
    result: { type: String, enum: ["WIN", "LOSS", "DRAW"], required: true },
    opponentName: { type: String, required: true },
    opponentRating: { type: Number, required: true },
    ratingChange: { type: Number, required: true },
    xpEarned: { type: Number, required: true },
    score: { type: Number, required: true },
    opponentScore: { type: Number, required: true },
    problemTitle: { type: String, default: null },
    durationSec: { type: Number, required: true },
    details: { type: String, default: "{}" },
  },
  { timestamps: true }
);

MatchSchema.index({ userId: 1, createdAt: -1 });

export const Match: Model<IMatch> =
  mongoose.models.Match || mongoose.model<IMatch>("Match", MatchSchema);
