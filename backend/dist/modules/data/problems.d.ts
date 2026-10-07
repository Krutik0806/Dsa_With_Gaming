import type { Difficulty } from "../types";
export interface ProblemTest {
    args: unknown[];
    expected: unknown;
}
export interface Problem {
    slug: string;
    title: string;
    difficulty: Difficulty;
    topics: string[];
    statement: string;
    examples: {
        input: string;
        output: string;
        explanation?: string;
    }[];
    constraints: string[];
    functionName: string;
    starterCode: string;
    tests: ProblemTest[];
    hints: string[];
    solution: string;
    acceptance: number;
}
export declare const PROBLEMS: Problem[];
export declare function getProblem(slug: string): Problem | undefined;
export declare function problemsByDifficulty(difficulty: Difficulty): Problem[];
export declare const PROBLEM_TOPICS: string[];
//# sourceMappingURL=problems.d.ts.map