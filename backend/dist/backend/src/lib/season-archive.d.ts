export interface PastSeasonRecord {
    season: number;
    /** Season start date. */
    startAt: string;
    champion: {
        name: string;
        rating: number;
        tagline: string;
        color: string;
    };
    finalist: {
        name: string;
        rating: number;
        tagline: string;
        color: string;
    };
    /** Final ratings of the top 4 — for a mini standings strip. */
    topFour: {
        name: string;
        rating: number;
        color: string;
    }[];
    /** Headline matches played in the arena that week (deterministic). */
    matchesPlayed: number;
    /** The cup that anchored the week. */
    cupName: string;
}
export declare function getPastSeasons(count?: number): PastSeasonRecord[];
/** Percentile of a rating against the deterministic current-season field. */
export declare function seasonPercentile(rating: number): {
    pct: number;
    label: string;
};
export interface SeasonArchiveResponse {
    current: {
        season: number;
        daysLeft: number;
        hoursLeft: number;
        progress: number;
        endsAt: string;
    };
    yourStanding: {
        pct: number;
        label: string;
        rating: number;
    };
    pastSeasons: PastSeasonRecord[];
}
export declare function getSeasonArchive(userRating: number): SeasonArchiveResponse;
//# sourceMappingURL=season-archive.d.ts.map