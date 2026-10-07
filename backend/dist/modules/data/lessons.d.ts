export type VizKind = "sort" | "two-pointer" | "binsearch" | "stack" | "bst" | "bfs" | "dp";
export type LessonBlock = {
    type: "text";
    text: string;
} | {
    type: "list";
    title?: string;
    items: string[];
} | {
    type: "callout";
    tone: "tip" | "warn" | "info";
    title: string;
    text: string;
} | {
    type: "code";
    title?: string;
    code: string;
    caption?: string;
} | {
    type: "viz";
    kind: VizKind;
    title?: string;
};
export interface Lesson {
    slug: string;
    title: string;
    tagline: string;
    icon: string;
    difficulty: "Beginner" | "Intermediate" | "Advanced";
    minutes: number;
    xp: number;
    category: string;
    blocks: LessonBlock[];
    example: {
        title: string;
        code: string;
        points: string[];
    };
    check: {
        question: string;
        options: string[];
        answer: number;
        explanation: string;
    };
    practiceSlugs: string[];
    nextSlug?: string;
}
export declare const LESSONS: Lesson[];
export declare function getLesson(slug: string): Lesson | undefined;
//# sourceMappingURL=lessons.d.ts.map