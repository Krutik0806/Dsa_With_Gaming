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
export declare const SHOP_ITEMS: ShopItem[];
export declare function getShopItem(id: string): ShopItem | undefined;
export declare const COIN_REWARDS: {
    readonly MATCH_WIN: 40;
    readonly MATCH_DRAW: 20;
    readonly MATCH_LOSS: 10;
    readonly CUP_ROUND_WIN: 30;
    readonly CUP_CHAMPION: 200;
    readonly DAILY_CHECKIN: 15;
    readonly DAILY_CHALLENGE: 50;
};
export declare function coinsForMatch(result: "WIN" | "LOSS" | "DRAW"): number;
//# sourceMappingURL=shop.d.ts.map