import mongoose, { Schema, Document, Model } from "mongoose";

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

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, default: null, sparse: true },
    passwordHash: { type: String, required: true },
    isGuest: { type: Boolean, default: false },
    xp: { type: Number, default: 0 },
    rating: { type: Number, default: 1000, index: true },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    quizWins: { type: Number, default: 0 },
    codeWins: { type: Number, default: 0 },
    streakCount: { type: Number, default: 0 },
    lastActiveDay: { type: String, default: null },
    coins: { type: Number, default: 0 },
    freezes: { type: Number, default: 0 },
    equippedFrame: { type: String, default: null },
    equippedTitle: { type: String, default: null },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
