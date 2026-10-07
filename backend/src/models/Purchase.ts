import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPurchase extends Document {
  userId: mongoose.Types.ObjectId;
  itemId: string;
  cost: number;
  createdAt: Date;
}

const PurchaseSchema = new Schema<IPurchase>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    itemId: { type: String, required: true },
    cost: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

PurchaseSchema.index({ userId: 1, createdAt: -1 });

export const Purchase: Model<IPurchase> =
  mongoose.models.Purchase || mongoose.model<IPurchase>("Purchase", PurchaseSchema);
