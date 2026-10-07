"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/dsa-gaming";
let isConnected = false;
async function connectDB() {
    if (isConnected)
        return;
    try {
        await mongoose_1.default.connect(MONGODB_URI);
        isConnected = true;
        console.log("✅ MongoDB connected:", MONGODB_URI.split("@").pop() ?? MONGODB_URI);
    }
    catch (err) {
        console.error("❌ MongoDB connection failed:", err);
        process.exit(1);
    }
}
exports.default = mongoose_1.default;
//# sourceMappingURL=db.js.map