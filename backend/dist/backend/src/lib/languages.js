"use strict";
// ─── Language engine: metadata, editor intelligence, error triage ─────────────
// The judge runs code locally: g++ 14 (C++17), CPython 3.12, OpenJDK 21
// (single-file source execution) and the node:vm JS harness.
Object.defineProperty(exports, "__esModule", { value: true });
exports.LANGUAGES = void 0;
exports.getLang = getLang;
exports.completionsFor = completionsFor;
exports.explainError = explainError;
exports.LANGUAGES = [
    {
        id: "js",
        name: "JavaScript",
        short: "JS",
        file: "solution.js",
        toolchain: "Node · vm sandbox",
        color: "#fbbf24",
        chip: "border-amber-500/40 bg-amber-500/10 text-amber-300",
        comment: "//",
    },
    {
        id: "cpp",
        name: "C++",
        short: "C++",
        file: "solution.cpp",
        toolchain: "g++ 14.2 · -O2 · -std=c++17",
        color: "#34d399",
        chip: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
        comment: "//",
    },
    {
        id: "py",
        name: "Python",
        short: "PY",
        file: "solution.py",
        toolchain: "CPython 3.12",
        color: "#5eead4",
        chip: "border-teal-400/40 bg-teal-500/10 text-teal-300",
        comment: "#",
    },
    {
        id: "java",
        name: "Java",
        short: "JAVA",
        file: "Solution.java",
        toolchain: "OpenJDK 21 · single-file launch",
        color: "#f472b6",
        chip: "border-pink-500/40 bg-pink-500/10 text-pink-300",
        comment: "//",
    },
];
function getLang(id) {
    return exports.LANGUAGES.find((l) => l.id === id) ?? exports.LANGUAGES[0];
}
const JS_KEYWORDS = [
    "function", "return", "const", "let", "var", "if", "else", "for", "while", "do",
    "break", "continue", "new", "class", "extends", "typeof", "of", "in", "switch",
    "case", "default", "try", "catch", "finally", "throw", "null", "undefined",
    "true", "false", "Map", "Set", "Array", "Math", "Object", "JSON", "String", "Number",
];
const CPP_KEYWORDS = [
    "int", "long", "long long", "bool", "char", "string", "vector", "vector<int>",
    "vector<vector<int>>", "unordered_map", "unordered_map<int,int>", "map", "set",
    "pair", "queue", "stack", "priority_queue", "sort", "min", "max", "abs", "swap",
    "if", "else", "for", "while", "do", "break", "continue", "return", "true", "false",
    "nullptr", "auto", "const", "struct", "class", "template", "size_t", "push_back",
    "begin", "end", "front", "back", "size", "empty", "reverse", "lower_bound", "upper_bound",
];
const PY_KEYWORDS = [
    "def", "return", "if", "elif", "else", "for", "while", "break", "continue",
    "import", "from", "as", "in", "not", "and", "or", "is", "None", "True", "False",
    "class", "try", "except", "finally", "raise", "lambda", "with", "pass", "yield",
    "range", "len", "enumerate", "sorted", "min", "max", "abs", "sum", "list", "dict",
    "set", "tuple", "map", "filter", "zip", "print", "append", "pop", "items", "keys", "values",
];
const JAVA_KEYWORDS = [
    "int", "long", "boolean", "char", "String", "int[]", "int[][]", "long[]", "new",
    "int[]", "if", "else", "for", "while", "do", "break", "continue", "return",
    "true", "false", "null", "public", "private", "static", "final", "class", "void",
    "List", "ArrayList", "Map", "HashMap", "HashSet", "Set", "Deque", "ArrayDeque",
    "Arrays", "Collections", "Integer", "Character", "Math", "System", "length", "size", "add", "get", "put", "containsKey",
];
const SNIPPETS = {
    js: [
        { label: "for", insert: "for (let i = 0; i < n; i++) {\n  \n}", detail: "indexed loop" },
        { label: "forof", insert: "for (const x of arr) {\n  \n}", detail: "iterate values" },
        { label: "while", insert: "while (condition) {\n  \n}" },
        { label: "if", insert: "if (condition) {\n  \n}" },
        { label: "func", insert: "function name(args) {\n  \n}" },
        { label: "map", insert: "new Map()", detail: "hash map" },
        { label: "set", insert: "new Set()", detail: "hash set" },
        { label: "sort", insert: "arr.sort((a, b) => a - b)", detail: "numeric sort" },
        { label: "arr", insert: "new Array(n).fill(0)", detail: "zero-filled array" },
    ],
    cpp: [
        { label: "for", insert: "for (int i = 0; i < n; i++) {\n    \n}", detail: "indexed loop" },
        { label: "forauto", insert: "for (auto& x : v) {\n    \n}", detail: "range-for" },
        { label: "while", insert: "while (cond) {\n    \n}" },
        { label: "if", insert: "if (cond) {\n    \n}" },
        { label: "ump", insert: "unordered_map<long long, int> mp;", detail: "hash map" },
        { label: "vii", insert: "vector<pair<int,int>> v;", detail: "pair list" },
        { label: "vi", insert: "vector<long long> v(n);", detail: "int vector" },
        { label: "pq", insert: "priority_queue<pair<int,int>> pq;", detail: "max-heap" },
        { label: "sort", insert: "sort(v.begin(), v.end());" },
        { label: "pb", insert: "v.push_back(x);", detail: "append" },
        { label: "mp", insert: "make_pair(a, b)" },
        { label: "twin", insert: "auto [lo, hi] = make_pair(0, n - 1);" },
    ],
    py: [
        { label: "for", insert: "for i in range(n):\n    ", detail: "indexed loop" },
        { label: "forenum", insert: "for i, x in enumerate(arr):\n    ", detail: "index + value" },
        { label: "while", insert: "while cond:\n    " },
        { label: "if", insert: "if cond:\n    " },
        { label: "def", insert: "def name(args):\n    " },
        { label: "dict", insert: "d = {}", detail: "hash map" },
        { label: "set", insert: "seen = set()", detail: "hash set" },
        { label: "sort", insert: "arr.sort()", detail: "in-place sort" },
        { label: "sortedk", insert: "sorted(arr, key=lambda x: x[0])", detail: "sort by key" },
        { label: "listcomp", insert: "[x for x in arr if x > 0]" },
    ],
    java: [
        { label: "for", insert: "for (int i = 0; i < n; i++) {\n    \n}", detail: "indexed loop" },
        { label: "foreach", insert: "for (int x : arr) {\n    \n}", detail: "iterate array" },
        { label: "while", insert: "while (cond) {\n    \n}" },
        { label: "if", insert: "if (cond) {\n    \n}" },
        { label: "map", insert: "Map<Integer, Integer> map = new HashMap<>();", detail: "hash map" },
        { label: "set", insert: "Set<Integer> set = new HashSet<>();", detail: "hash set" },
        { label: "deque", insert: "Deque<Character> stack = new ArrayDeque<>();", detail: "stack" },
        { label: "arr", insert: "int[] arr = new int[n];" },
        { label: "sort", insert: "Arrays.sort(arr);" },
        { label: "list", insert: "List<Integer> list = new ArrayList<>();" },
        { label: "mmin", insert: "Math.min(a, b)" },
        { label: "mmax", insert: "Math.max(a, b)" },
    ],
};
function completionsFor(lang, prefix) {
    const out = [];
    const lower = prefix.toLowerCase();
    for (const s of SNIPPETS[lang]) {
        if (s.label.toLowerCase().startsWith(lower))
            out.push(s);
    }
    if (out.length < 8) {
        for (const k of lang === "js" ? JS_KEYWORDS : lang === "cpp" ? CPP_KEYWORDS : lang === "py" ? PY_KEYWORDS : JAVA_KEYWORDS) {
            if (out.length >= 10)
                break;
            if (k.toLowerCase().startsWith(lower) && !out.some((o) => o.label === k)) {
                out.push({ label: k, insert: k });
            }
        }
    }
    return out.slice(0, 8);
}
const RULES = {
    js: [
        { test: /is not defined/i, hint: "That name is never declared — check the spelling or declare it with let/const." },
        { test: /Unexpected token/i, hint: "The syntax is malformed around the reported position — look for a missing bracket or comma." },
        { test: /is not a function/i, hint: "You are calling something that isn't a function — keep the starter signature." },
        { test: /Cannot read propert(y|ies)/i, hint: "Accessing a property of undefined/null — guard edge cases like empty arrays." },
        { test: /timed out/i, hint: "Infinite loop suspicion — check your loop bounds and base cases." },
    ],
    cpp: [
        { test: /expected ';' before/i, hint: "Missing semicolon — end the statement on the previous line with ;" },
        { test: /expected '}' at end of input/i, hint: "Unbalanced braces — every { needs a matching }." },
        { test: /expected initializer/i, hint: "The declaration syntax is off — check the type and variable name spelling." },
        { test: /'cin'|'cout' was not declared/i, hint: "Missing #include <bits/stdc++.h> or using namespace std; — keep the starter header." },
        { test: /no match for 'operator<</i, hint: "You are printing a type cout doesn't accept — cast it to long long or print its elements." },
        { test: /out of range/i, hint: "Vector index out of range — check empty inputs and boundary indices." },
        { test: /segmentation fault/i, hint: "Dereferencing an invalid address — look for out-of-bounds indexing or an empty container." },
        { test: /no matching function for call/i, hint: "Argument types don't match any overload — check what you pass (int vs vector)." },
        { test: /expected unqualified-id/i, hint: "A declaration landed outside a function body — check brace balance." },
    ],
    py: [
        { test: /IndentationError: expected an indented block/i, hint: "Python needs the function body indented — indent the lines after def." },
        { test: /IndentationError: unindent does not match/i, hint: "Mixing tabs and spaces — stick to 4 spaces per level." },
        { test: /SyntaxError: invalid syntax/i, hint: "Python can't parse that line — check for a missing colon or closing bracket." },
        { test: /NameError: name '.*' is not defined/i, hint: "Typo or missing definition — Python is case-sensitive (two_sum ≠ twoSum)." },
        { test: /TypeError: .* argument/i, hint: "Wrong argument types — remember input arrives as a list/int/str exactly like the signature." },
        { test: /IndexError: list index out of range/i, hint: "Indexing past the end — handle empty sequences and i+1 style access." },
        { test: /KeyError/i, hint: "Dictionary key missing — use dict.get(key, default) or check membership first." },
        { test: /RecursionError/i, hint: "Recursion never reaches a base case — or n is big; prefer an iterative version." },
    ],
    java: [
        { test: /';' expected/i, hint: "Missing semicolon — end the statement with ;" },
        { test: /class, interface, enum, or record expected/i, hint: "Brace mismatch — a } closed the class too early or a { was never closed." },
        { test: /cannot find symbol/i, hint: "Unknown name — check spelling, and declare variables before use." },
        { test: /incompatible types/i, hint: "Type mismatch — int/long/int[] are not interchangeable; cast deliberately." },
        { test: /missing return statement/i, hint: "The method must return on every path — add a final return." },
        { test: /is public, should be declared in a file named/i, hint: "Don't mark class Solution as public — the judge appends its own public Main." },
        { test: /ArrayIndexOutOfBounds/i, hint: "Index outside the array — Java arrays are 0-based and length is .length." },
        { test: /NullPointerException/i, hint: "Using a null reference — initialize collections before use." },
        { test: /no suitable constructor/i, hint: "Constructor arguments don't match — check parameter types." },
    ],
};
const FALLBACK = {
    js: "Check the reported line — JS is picky about brackets, commas and closing quotes.",
    cpp: "g++ choked near the reported line — check brackets, semicolons and declaration syntax around it.",
    py: "CPython couldn't parse that line — check for a missing colon, bracket or a typo.",
    java: "javac flagged that line — check semicolons, types and brace balance around it.",
};
function explainError(lang, raw) {
    for (const rule of RULES[lang]) {
        if (rule.test.test(raw))
            return rule.hint;
    }
    return FALLBACK[lang];
}
//# sourceMappingURL=languages.js.map