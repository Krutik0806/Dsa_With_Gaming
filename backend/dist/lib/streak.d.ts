import { IUser } from "../models/User";
export interface StreakTier {
    multiplier: number;
    label: string;
    bonusPct: number;
}
export declare const STREAK_TIERS: {
    min: number;
    tier: StreakTier;
}[];
export declare const CHECK_IN_XP = 25;
export declare function todayKey(): string;
export declare function tierFor(streakCount: number): StreakTier;
export interface StreakState {
    count: number;
    activeToday: boolean;
    alive: boolean;
    multiplier: number;
    multiplierLabel: string;
    bonusPct: number;
    daysToNextTier: number | null;
    nextTierLabel: string | null;
    nextTierBonusPct: number | null;
    freezes: number;
    freezeProtected: boolean;
    freezesToConsume: number;
}
export declare function computeStreakState(streakCount: number, lastActiveDay: string | null | undefined, freezes?: number): StreakState;
export declare function touchStreakActivity(user: IUser): Promise<{
    user: IUser;
    state: StreakState;
    justActivated: boolean;
    freezesConsumed: number;
}>;
//# sourceMappingURL=streak.d.ts.map