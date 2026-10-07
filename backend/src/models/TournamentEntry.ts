import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITournamentEntry extends Document {
  userId: mongoose.Types.ObjectId;
  slug: string;
  status: "ACTIVE" | "ELIMINATED" | "CHAMPION";
  round: number;
  placement?: number | null;
  bracket: string;
  xpAwarded: number;
  createdAt: Date;
  updatedAt: Date;
}

const TournamentEntrySchema = new Schema<ITournamentEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    slug: { type: String, required: true },
    status: { type: String, enum: ["ACTIVE", "ELIMINATED", "CHAMPION"], default: "ACTIVE" },
    round: { type: Number, default: 1 },
    placement: { type: Number, default: null },
    bracket: { type: String, default: "{}" },
    xpAwarded: { type: Number, default: 0 },
  },
  { timestamps: true }
);

TournamentEntrySchema.index({ userId: 1, slug: 1 }, { unique: true });
TournamentEntrySchema.index({ userId: 1, createdAt: -1 });

export const TournamentEntry: Model<ITournamentEntry> =
  mongoose.models.TournamentEntry ||
  mongoose.model<ITournamentEntry>("TournamentEntry", TournamentEntrySchema);
