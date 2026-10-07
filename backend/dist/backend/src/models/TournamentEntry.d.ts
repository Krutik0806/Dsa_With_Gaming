import mongoose, { Document, Model } from "mongoose";
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
export declare const TournamentEntry: Model<ITournamentEntry>;
//# sourceMappingURL=TournamentEntry.d.ts.map