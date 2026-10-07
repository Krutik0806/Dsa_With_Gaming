// ─── Shop routes: GET+POST /api/shop ─────────────────────────────────────────
import { Router, Request, Response } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { User } from "../models/User";
import { Purchase } from "../models/Purchase";
import { serializeUser } from "../lib/auth";
import { getShopItem, SHOP_ITEMS } from "../lib/shop";
import { recordTransaction } from "../lib/ledger";
import type { ShopItemView, ShopResponse, PurchaseLogEntry, ShopItemKind } from "../../../modules/types";

const router = Router();
router.use(requireAuth);

function kindOf(itemId: string): ShopItemKind {
  const item = getShopItem(itemId);
  return item?.kind ?? "CONSUMABLE";
}

router.get("/", async (req: Request, res: Response) => {
  const user = req.user!;
  const purchaseRows = await Purchase.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  const purchases: PurchaseLogEntry[] = (purchaseRows as any[]).map((p) => ({
    id: p._id.toString(),
    itemId: p.itemId,
    itemName: getShopItem(p.itemId)?.name ?? p.itemId,
    kind: kindOf(p.itemId),
    cost: p.cost,
    at: p.createdAt.toISOString(),
  }));

  const items: ShopItemView[] = SHOP_ITEMS.map((item) => {
    const owned = item.kind === "CONSUMABLE" ? false : purchases.some((p) => p.itemId === item.id);
    const equipped = (item.kind === "FRAME" && user.equippedFrame === item.id) || (item.kind === "TITLE" && user.equippedTitle === item.id);
    return { id: item.id, kind: item.kind, name: item.name, description: item.description, cost: item.cost, accent: item.accent, flair: item.flair, owned, count: item.kind === "CONSUMABLE" ? user.freezes : undefined, equipped, affordable: user.coins >= item.cost };
  });

  const payload: ShopResponse = { coins: user.coins, freezes: user.freezes, items, purchases, equippedFrame: user.equippedFrame ?? null, equippedTitle: user.equippedTitle ?? null };
  res.json(payload);
});

const purchaseSchema = z.object({ action: z.literal("BUY"), itemId: z.string().min(1).max(64) });
const equipSchema = z.object({ action: z.literal("EQUIP"), itemId: z.string().min(1).max(64) });
const unequipSchema = z.object({ action: z.literal("UNEQUIP"), kind: z.enum(["FRAME", "TITLE"]) });

router.post("/", async (req: Request, res: Response) => {
  const user = req.user!;
  const parsed = z.union([purchaseSchema, equipSchema, unequipSchema]).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid shop request" }); return; }

  if (parsed.data.action === "EQUIP") {
    const item = getShopItem(parsed.data.itemId);
    if (!item || item.kind === "CONSUMABLE") { res.status(404).json({ error: "Unknown or non-equippable item" }); return; }
    const owned = await Purchase.findOne({ userId: user._id, itemId: item.id });
    if (!owned) { res.status(403).json({ error: "You don't own this item yet" }); return; }
    const updated = await User.findByIdAndUpdate(user._id, item.kind === "FRAME" ? { equippedFrame: item.id } : { equippedTitle: item.id }, { new: true });
    res.json({ user: serializeUser(updated!), equipped: item.id });
    return;
  }

  if (parsed.data.action === "UNEQUIP") {
    const updated = await User.findByIdAndUpdate(user._id, parsed.data.kind === "FRAME" ? { equippedFrame: null } : { equippedTitle: null }, { new: true });
    res.json({ user: serializeUser(updated!), unequipped: parsed.data.kind });
    return;
  }

  const item = getShopItem(parsed.data.itemId);
  if (!item) { res.status(404).json({ error: "Unknown item" }); return; }
  if (user.coins < item.cost) { res.status(402).json({ error: `Not enough coins — need ${item.cost - user.coins} more` }); return; }

  if (item.kind !== "CONSUMABLE") {
    const already = await Purchase.findOne({ userId: user._id, itemId: item.id });
    if (already) { res.status(409).json({ error: "Already owned" }); return; }
  }

  const updated = await User.findByIdAndUpdate(user._id, { coins: user.coins - item.cost, freezes: item.kind === "CONSUMABLE" ? user.freezes + 1 : user.freezes }, { new: true });
  await Purchase.create({ userId: user._id, itemId: item.id, cost: item.cost });
  await recordTransaction(user._id, -item.cost, "SHOP_PURCHASE", item.name.toLowerCase());

  res.status(201).json({ user: serializeUser(updated!), bought: item.id, itemName: item.name, cost: item.cost });
});

export default router;
