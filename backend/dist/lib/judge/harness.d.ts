import type { PType, ProblemLang } from "@/lib/data/problem-langs";
export declare function serializeArgs(params: PType[], args: unknown[]): string;
/** Serialize a full batch of tests for the single-shot Java runner. */
export declare function serializeBatch(params: PType[], tests: {
    args: unknown[];
}[]): string;
export declare function fmtOut(v: unknown): string;
/** Normalize program output for comparison: trim line-ends + outer blank lines. */
export declare function normalizeOutput(s: string): string;
/** Split stdout into marked outputs (one per test) and outside-marker logs. */
export declare function extractMarked(stdout: string): {
    outputs: string[];
    logs: string[];
};
export declare function buildCppHarness(pl: ProblemLang): {
    prepend: string;
    append: string;
};
export declare function buildPyHarness(pl: ProblemLang): string;
export declare function buildJavaHarness(pl: ProblemLang): {
    prepend: string;
    append: string;
};
//# sourceMappingURL=harness.d.ts.map