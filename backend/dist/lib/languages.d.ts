export type LangId = "js" | "cpp" | "py" | "java";
export interface LangDef {
    id: LangId;
    name: string;
    short: string;
    file: string;
    toolchain: string;
    color: string;
    chip: string;
    comment: string;
}
export declare const LANGUAGES: LangDef[];
export declare function getLang(id: string | undefined | null): LangDef;
export interface Snippet {
    label: string;
    insert: string;
    detail?: string;
}
export declare function completionsFor(lang: LangId, prefix: string): Snippet[];
export declare function explainError(lang: LangId, raw: string): string | null;
//# sourceMappingURL=languages.d.ts.map