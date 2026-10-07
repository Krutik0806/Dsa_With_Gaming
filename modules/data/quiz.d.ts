export interface QuizQuestion {
    id: string;
    category: string;
    difficulty: 1 | 2 | 3;
    q: string;
    options: string[];
    answer: number;
    explanation: string;
}
export declare const QUIZ_CATEGORIES: readonly ["Complexity", "Arrays & Hashing", "Lists, Stacks & Queues", "Trees & Graphs", "Sorting & Searching", "Recursion & DP", "CS Fundamentals"];
export declare const QUIZ_QUESTIONS: QuizQuestion[];
/** Deterministic PRNG (mulberry32) — two clients given the same seed get the
 *  same question set, which is how live human-vs-human battles stay in sync. */
export declare function seededRandom(seed: number): () => number;
export declare function pickQuizQuestions(count: number, seed?: number): QuizQuestion[];
//# sourceMappingURL=quiz.d.ts.map