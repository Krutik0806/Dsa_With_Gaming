// ─── Lightweight multi-language syntax highlighter ───────────────────────────
// Produces HTML with tailwind color spans for the editor overlay. Covers the
// subset of syntax that matters in battle solutions: keywords, types/builtins,
// strings, numbers, comments, function calls.

import type { LangId } from "@/lib/languages";

const CONTROL: Record<LangId, Set<string>> = {
  js: new Set(["function", "return", "const", "let", "var", "if", "else", "for", "while", "do", "break", "continue", "new", "class", "extends", "typeof", "of", "in", "switch", "case", "default", "try", "catch", "finally", "throw", "null", "undefined", "true", "false", "this", "delete", "instanceof", "void", "yield", "await", "async"]),
  cpp: new Set(["if", "else", "for", "while", "do", "break", "continue", "return", "true", "false", "nullptr", "auto", "const", "struct", "class", "template", "typename", "using", "namespace", "new", "delete", "switch", "case", "default", "try", "catch", "throw", "static", "sizeof", "operator", "public", "private", "protected", "virtual", "override", "inline", "constexpr", "goto", "and", "or", "not"]),
  py: new Set(["def", "return", "if", "elif", "else", "for", "while", "break", "continue", "import", "from", "as", "in", "not", "and", "or", "is", "None", "True", "False", "class", "try", "except", "finally", "raise", "lambda", "with", "pass", "yield", "global", "nonlocal", "assert", "del", "async", "await"]),
  java: new Set(["if", "else", "for", "while", "do", "break", "continue", "return", "true", "false", "null", "public", "private", "protected", "static", "final", "class", "void", "new", "this", "super", "extends", "implements", "interface", "enum", "try", "catch", "finally", "throw", "throws", "instanceof", "switch", "case", "default", "abstract", "synchronized", "volatile", "transient", "import", "package", "record", "var"]),
};

const TYPES: Record<LangId, Set<string>> = {
  js: new Set(["Map", "Set", "Array", "Math", "Object", "JSON", "String", "Number", "Boolean", "Infinity", "NaN", "parseInt", "parseFloat", "isNaN", "console"]),
  cpp: new Set(["int", "long", "long long", "bool", "char", "double", "float", "string", "vector", "unordered_map", "unordered_set", "map", "set", "pair", "queue", "stack", "priority_queue", "deque", "size_t", "INT_MAX", "INT_MIN", "LLONG_MAX", "sort", "min", "max", "abs", "swap", "reverse", "lower_bound", "upper_bound", "begin", "end", "front", "back", "push_back", "push", "pop", "top", "empty", "make_pair", "memset", "accumulate", "tuple", "cout", "cin", "endl", "istream", "ostream"]),
  py: new Set(["range", "len", "enumerate", "sorted", "reversed", "min", "max", "abs", "sum", "list", "dict", "set", "tuple", "map", "filter", "zip", "print", "int", "str", "float", "bool", "input", "any", "all", "isinstance", "ord", "chr", "divmod", "pow", "round", "type", "self", "append", "pop", "items", "keys", "values", "get", "Exception", "ValueError", "KeyError", "IndexError"]),
  java: new Set(["int", "long", "boolean", "char", "double", "float", "byte", "short", "String", "List", "ArrayList", "Map", "HashMap", "HashSet", "Set", "Deque", "ArrayDeque", "Arrays", "Collections", "Integer", "Character", "Long", "Math", "System", "Object", "Queue", "PriorityQueue", "LinkedList", "Optional", "Exception", "StringBuilder", "Comparable", "Iterator"]),
};

const CLS = {
  control: "text-[#f472b6]",
  type: "text-[#5eead4]",
  string: "text-[#a3e635]",
  number: "text-[#fbbf24]",
  comment: "text-zinc-600 italic",
  fn: "text-emerald-300",
};

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function highlightCode(code: string, lang: LangId): string {
  const control = CONTROL[lang];
  const types = TYPES[lang];
  const lineComment = lang === "py" ? "#" : "//";
  const hasBlock = lang !== "py";
  const out: string[] = [];
  let inBlock = false;

  const lines = code.split("\n");
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    let i = 0;
    while (i < line.length) {
      if (inBlock) {
        const end = line.indexOf("*/", i);
        if (end === -1) {
          out.push(`<span class="${CLS.comment}">${esc(line.slice(i))}</span>`);
          i = line.length;
        } else {
          out.push(`<span class="${CLS.comment}">${esc(line.slice(i, end + 2))}</span>`);
          i = end + 2;
          inBlock = false;
        }
        continue;
      }
      const ch = line[i];

      if (hasBlock && line.startsWith("/*", i)) {
        inBlock = true;
        continue;
      }
      if (line.startsWith(lineComment, i)) {
        out.push(`<span class="${CLS.comment}">${esc(line.slice(i))}</span>`);
        break;
      }
      if (ch === '"' || ch === "'" || (ch === "`" && lang === "js")) {
        let j = i + 1;
        while (j < line.length && line[j] !== ch) {
          if (line[j] === "\\") j++;
          j++;
        }
        const text = j < line.length ? line.slice(i, j + 1) : line.slice(i);
        out.push(`<span class="${CLS.string}">${esc(text)}</span>`);
        i += text.length;
        continue;
      }
      if (/[0-9]/.test(ch)) {
        const m = /^[0-9][0-9_]*(\.[0-9]+)?([eE][+-]?[0-9]+)?/.exec(line.slice(i));
        const text = m ? m[0] : ch;
        out.push(`<span class="${CLS.number}">${esc(text)}</span>`);
        i += text.length;
        continue;
      }
      if (/[A-Za-z_$]/.test(ch)) {
        const m = /^[A-Za-z_$][A-Za-z0-9_$]*/.exec(line.slice(i))!;
        const word = m[0];
        let cls = "";
        if (control.has(word)) cls = CLS.control;
        else if (types.has(word)) cls = CLS.type;
        else {
          let k = i + word.length;
          while (k < line.length && line[k] === " ") k++;
          if (line[k] === "(") cls = CLS.fn;
        }
        out.push(cls ? `<span class="${cls}">${esc(word)}</span>` : esc(word));
        i += word.length;
        continue;
      }
      // plain run until next interesting char
      let j = i;
      while (j < line.length && !/[A-Za-z0-9_$'"`]/.test(line[j]) && !line.startsWith(lineComment, j) && !(hasBlock && line.startsWith("/*", j))) j++;
      if (j === i) j++;
      out.push(esc(line.slice(i, j)));
      i = j;
    }
    if (li < lines.length - 1) out.push("\n");
  }
  return out.join("");
}
