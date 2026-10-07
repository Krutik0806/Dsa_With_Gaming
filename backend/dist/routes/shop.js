"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ─── Shop routes: GET+POST /api/shop ─────────────────────────────────────────
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const User_1 = require("../models/User");
const Purchase_1 = require("../models/Purchase");
const auth_2 = require("../lib/auth");
const shop_1 = require("../lib/shop");
const ledger_1 = require("../lib/ledger");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
function kindOf(itemId) {
    const item = (0, shop_1.getShopItem)(itemId);
    return item?.kind ?? "CONSUMABLE";
}
router.get("/", async (req, res) => {
    const user = req.user;
    const purchaseRows = await Purchase_1.Purchase.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean();
    const purchases = purchaseRows.map((p) => ({
        id: p._id.toString(),
        itemId: p.itemId,
        itemName: (0, shop_1.getShopItem)(p.itemId)?.name ?? p.itemId,
        kind: kindOf(p.itemId),
        cost: p.cost,
        at: p.createdAt.toISOString(),
    }));
    const items = shop_1.SHOP_ITEMS.map((item) => {
        const owned = item.kind === "CONSUMABLE" ? false : purchases.some((p) => p.itemId === item.id);
        const equipped = (item.kind === "FRAME" && user.equippedFrame === item.id) || (item.kind === "TITLE" && user.equippedTitle === item.id);
        return { id: item.id, kind: item.kind, name: item.name, description: item.description, cost: item.cost, accent: item.accent, flair: item.flair, owned, count: item.kind === "CONSUMABLE" ? user.freezes : undefined, equipped, affordable: user.coins >= item.cost };
    });
    const payload = { coins: user.coins, freezes: user.freezes, items, purchases, equippedFrame: user.equippedFrame ?? null, equippedTitle: user.equippedTitle ?? null };
    res.json(payload);
});
const purchaseSchema = zod_1.z.object({ action: zod_1.z.literal("BUY"), itemId: zod_1.z.string().min(1).max(64) });
const equipSchema = zod_1.z.object({ action: zod_1.z.literal("EQUIP"), itemId: zod_1.z.string().min(1).max(64) });
const unequipSchema = zod_1.z.object({ action: zod_1.z.literal("UNEQUIP"), kind: zod_1.z.enum(["FRAME", "TITLE"]) });
router.post("/", async (req, res) => {
    const user = req.user;
    const parsed = zod_1.z.union([purchaseSchema, equipSchema, unequipSchema]).safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Invalid shop request" });
        return;
    }
    if (parsed.data.action === "EQUIP") {
        const item = (0, shop_1.getShopItem)(parsed.data.itemId);
        if (!item || item.kind === "CONSUMABLE") {
            res.status(404).json({ error: "Unknown or non-equippable item" });
            return;
        }
        const owned = await Purchase_1.Purchase.findOne({ userId: user._id, itemId: item.id });
        if (!owned) {
            res.status(403).json({ error: "You don't own this item yet" });
            return;
        }
        const updated = await User_1.User.findByIdAndUpdate(user._id, item.kind === "FRAME" ? { equippedFrame: item.id } : { equippedTitle: item.id }, { new: true });
        res.json({ user: (0, auth_2.serializeUser)(updated), equipped: item.id });
        return;
    }
    if (parsed.data.action === "UNEQUIP") {
        const updated = await User_1.User.findByIdAndUpdate(user._id, parsed.data.kind === "FRAME" ? { equippedFrame: null } : { equippedTitle: null }, { new: true });
        res.json({ user: (0, auth_2.serializeUser)(updated), unequipped: parsed.data.kind });
        return;
    }
    const item = (0, shop_1.getShopItem)(parsed.data.itemId);
    if (!item) {
        res.status(404).json({ error: "Unknown item" });
        return;
    }
    if (user.coins < item.cost) {
        res.status(402).json({ error: `Not enough coins — need ${item.cost - user.coins} more` });
        return;
    }
    if (item.kind !== "CONSUMABLE") {
        const already = await Purchase_1.Purchase.findOne({ userId: user._id, itemId: item.id });
        if (already) {
            res.status(409).json({ error: "Already owned" });
            return;
        }
    }
    const updated = await User_1.User.findByIdAndUpdate(user._id, { coins: user.coins - item.cost, freezes: item.kind === "CONSUMABLE" ? user.freezes + 1 : user.freezes }, { new: true });
    await Purchase_1.Purchase.create({ userId: user._id, itemId: item.id, cost: item.cost });
    await (0, ledger_1.recordTransaction)(user._id, -item.cost, "SHOP_PURCHASE", item.name.toLowerCase());
    res.status(201).json({ user: (0, auth_2.serializeUser)(updated), bought: item.id, itemName: item.name, cost: item.cost });
});
exports.default = router;
//# sourceMappingURL=shop.js.map