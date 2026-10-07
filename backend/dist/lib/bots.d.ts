export interface Bot {
    name: string;
    rating: number;
    skill: number;
    tagline: string;
    color: string;
}
export declare const BOTS: Bot[];
/** Pick an opponent close to the player's rating, with slight jitter. */
export declare function pickBot(userRating: number): {
    bot: Bot;
    rating: number;
};
//# sourceMappingURL=bots.d.ts.map