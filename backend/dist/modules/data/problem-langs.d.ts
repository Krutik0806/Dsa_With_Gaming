export type PType = "int" | "int[]" | "int[][]" | "string";
export type RType = "int" | "int[]" | "int[][]" | "string" | "boolean" | "void-inplace";
export interface ProblemLang {
    slug: string;
    params: PType[];
    paramNames: string[];
    ret: RType;
    fn: {
        js: string;
        cpp: string;
        py: string;
        java: string;
    };
    starter: {
        cpp: string;
        py: string;
        java: string;
    };
    solution: {
        cpp: string;
        py: string;
        java: string;
    };
}
export declare const PROBLEM_LANGS: Record<string, ProblemLang>;
export declare function getProblemLang(slug: string): ProblemLang | undefined;
//# sourceMappingURL=problem-langs.d.ts.map