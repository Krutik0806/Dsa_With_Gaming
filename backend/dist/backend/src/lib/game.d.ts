export type RankKey = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND" | "MASTER" | "GRANDMASTER";
export interface RankDef {
    key: RankKey;
    name: string;
    min: number;
    max: number;
    color: string;
    text: string;
    chip: string;
}
export declare const RANKS: RankDef[];
export declare function getRank(rating: number): RankDef;
export declare function xpForLevel(level: number): number;
export interface LevelInfo {
    level: number;
    intoLevel: number;
    levelSpan: number;
    progress: number;
    nextAt: number;
}
export declare function getLevelInfo(xp: number): LevelInfo;
export declare const ELO_K = 32;
export declare function expectedScore(a: number, b: number): number;
export declare function ratingChange(userRating: number, opponentRating: number, score: number, k?: number): number;
export declare function newRating(rating: number, change: number): number;
export declare const XP_REWARDS: {
    readonly LESSON: 75;
    readonly PROBLEM_EASY: 100;
    readonly PROBLEM_MEDIUM: 200;
    readonly PROBLEM_HARD: 300;
    readonly PROBLEM_REPEAT: 25;
    readonly QUIZ_PLAY: 50;
    readonly QUIZ_WIN: 50;
    readonly CODE_PLAY: 75;
    readonly CODE_WIN: 75;
    readonly CODE_PER_TEST: 5;
};
export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export declare const DIFFICULTY_META: Record<Difficulty, {
    label: string;
    chip: string;
    text: string;
    color: string;
}>;
export declare function clamp(v: number, min: number, max: number): number;
//# sourceMappingURL=game.d.ts.map