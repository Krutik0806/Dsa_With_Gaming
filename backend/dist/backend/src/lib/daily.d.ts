import { type Problem } from "../../../modules/data/problems";
export declare function todayKey(): string;
/** Deterministic date hash → problem index (same for everyone that day). */
export declare function dailyProblem(): Problem;
export declare function isDailyProblem(slug: string): boolean;
/** XP value of a problem by difficulty (mirrors XP_REWARDS). */
export declare function xpForProblem(difficulty: Problem["difficulty"]): number;
//# sourceMappingURL=daily.d.ts.map