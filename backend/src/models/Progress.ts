import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProgress extends Document {
  userId: mongoose.Types.ObjectId;
  kind: "LESSON" | "PROBLEM" | "DAILY";
  refId: string;
  xpAwarded: number;
  createdAt: Date;
}

const ProgressSchema = new Schema<IProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    kind: { type: String, enum: ["LESSON", "PROBLEM", "DAILY"], required: true },
    refId: { type: String, required: true },
    xpAwarded: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ProgressSchema.index({ userId: 1, kind: 1, refId: 1 }, { unique: true });

export const Progress: Model<IProgress> =
  mongoose.models.Progress || mongoose.model<IProgress>("Progress", ProgressSchema);
