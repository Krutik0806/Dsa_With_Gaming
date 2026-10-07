"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordTransaction = recordTransaction;
// ─── Coin transaction ledger (server-only, Mongoose version) ─────────────────
const Transaction_1 = require("../models/Transaction");
async function recordTransaction(userId, amount, source, description, at) {
    try {
        await Transaction_1.Transaction.create({
            userId,
            amount,
            source,
            description,
            ...(at ? { createdAt: at } : {}),
        });
    }
    catch (e) {
        console.error(`ledger write failed (${source} ${amount} for ${userId})`, e);
    }
}
//# sourceMappingURL=ledger.js.map