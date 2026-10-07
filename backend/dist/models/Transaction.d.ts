import mongoose, { Document, Model } from "mongoose";
export interface ITransaction extends Document {
    userId: mongoose.Types.ObjectId;
    amount: number;
    source: string;
    description: string;
    createdAt: Date;
}
export declare const Transaction: Model<ITransaction>;
//# sourceMappingURL=Transaction.d.ts.map