import mongoose, { Document, Model } from "mongoose";
export interface IPurchase extends Document {
    userId: mongoose.Types.ObjectId;
    itemId: string;
    cost: number;
    createdAt: Date;
}
export declare const Purchase: Model<IPurchase>;
//# sourceMappingURL=Purchase.d.ts.map