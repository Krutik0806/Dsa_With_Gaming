/** Monday, 6 January 2025 00:00 UTC — the Season 1 anchor. */
export declare const SEASON_EPOCH_MS: number;
export declare const SEASON_LENGTH_DAYS = 7;
export declare const SEASON_MS: number;
export interface SeasonInfo {
    season: number;
    endsAt: Date;
    daysLeft: number;
    hoursLeft: number;
    /** 0..1 — how far through the current season we are */
    progress: number;
}
export declare function getSeasonInfo(now?: Date): SeasonInfo;
//# sourceMappingURL=season.d.ts.map