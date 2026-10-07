// ─── Arena shop: coin economy catalog (server + shared) ─────────────────────
// Coins are earned by playing (matches, cups, dailies) and spent on
// consumables (streak freezes) and cosmetics (avatar frames, name titles).

export type ShopItemKind = "CONSUMABLE" | "FRAME" | "TITLE";

export interface ShopItem {
  id: string;
  kind: ShopItemKind;
  name: string;
  description: string;
  cost: number;
  /** Cosmetic preview accent (hex) used by the UI. */
  accent: string;
  /** Titles render as a name flair; frames style the avatar ring. */
  flair?: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "streak-freeze",
    kind: "CONSUMABLE",
    name: "Streak Freeze",
    description: "Protects your streak through one missed day. Auto-consumed when you return after a gap.",
    cost: 150,
    accent: "#38bdf8",
  },
  {
    id: "frame-emerald",
    kind: "FRAME",
    name: "Emerald Circuit",
    description: "A double emerald ring around your avatar. Quiet flex for ladder grinders.",
    cost: 300,
    accent: "#34d399",
  },
  {
    id: "frame-ruby",
    kind: "FRAME",
    name: "Ruby Vanguard",
    description: "Blood-red ruby ring with a soft pulse. For duellists who live in the arena.",
    cost: 500,
    accent: "#f87171",
  },
  {
    id: "frame-laurel",
    kind: "FRAME",
    name: "Golden Laurel",
    description: "Champion-grade gold laurel wreath with animated shimmer. Cup winners' choice.",
    cost: 750,
    accent: "#fbbf24",
  },
  {
    id: "title-consistent",
    kind: "TITLE",
    name: "the Consistent",
    description: "Shown next to your name — earned by showing up every single day.",
    cost: 200,
    accent: "#34d399",
    flair: "the Consistent",
  },
  {
    id: "title-bugslayer",
    kind: "TITLE",
    name: "Bug Slayer",
    description: "Shown next to your name — for those who debug under fire.",
    cost: 350,
    accent: "#f472b6",
    flair: "Bug Slayer",
  },
  {
    id: "title-arena-legend",
    kind: "TITLE",
    name: "Arena Legend",
    description: "Shown next to your name — the most expensive flex in the shop.",
    cost: 600,
    accent: "#fbbf24",
    flair: "Arena Legend",
  },
];

export function getShopItem(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((i) => i.id === id);
}

// ─── Coin faucets (server-side award rules) ────────────────────────────────

export const COIN_REWARDS = {
  MATCH_WIN: 40,
  MATCH_DRAW: 20,
  MATCH_LOSS: 10, // participation
  CUP_ROUND_WIN: 30, // each bracket round advanced
  CUP_CHAMPION: 200,
  DAILY_CHECKIN: 15,
  DAILY_CHALLENGE: 50, // first solve of the daily problem
} as const;

export function coinsForMatch(result: "WIN" | "LOSS" | "DRAW"): number {
  return result === "WIN" ? COIN_REWARDS.MATCH_WIN : result === "DRAW" ? COIN_REWARDS.MATCH_DRAW : COIN_REWARDS.MATCH_LOSS;
}
