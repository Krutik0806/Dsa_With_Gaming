"use strict";
// ─── Judge harness generation (server-only) ──────────────────────────────────
// Builds the main()/runner appended to user submissions for C++, Python and
// Java. Input is serialized from each test's args (one arg per line; matrices
// are "R" followed by R rows). Output is printed between ##BEGIN__/##END__
// markers so free-form debug prints never corrupt judging.
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeArgs = serializeArgs;
exports.serializeBatch = serializeBatch;
exports.fmtOut = fmtOut;
exports.normalizeOutput = normalizeOutput;
exports.extractMarked = extractMarked;
exports.buildCppHarness = buildCppHarness;
exports.buildPyHarness = buildPyHarness;
exports.buildJavaHarness = buildJavaHarness;
// ─── Input serialization ─────────────────────────────────────────────────────
function serializeArgs(params, args) {
    const lines = [];
    params.forEach((p, i) => {
        const a = args[i];
        switch (p) {
            case "int":
                lines.push(String(a));
                break;
            case "int[]":
                lines.push(a.join(" "));
                break;
            case "int[][]": {
                const m = a;
                lines.push(String(m.length));
                for (const row of m)
                    lines.push(row.join(" "));
                break;
            }
            case "string":
                lines.push(String(a));
                break;
        }
    });
    return lines.join("\n") + "\n";
}
/** Serialize a full batch of tests for the single-shot Java runner. */
function serializeBatch(params, tests) {
    return `${tests.length}\n` + tests.map((t) => serializeArgs(params, t.args)).join("");
}
// ─── Canonical output formatting (matches what harnesses print) ──────────────
function fmtOut(v) {
    if (typeof v === "boolean")
        return v ? "true" : "false";
    if (Array.isArray(v)) {
        if (v.length > 0 && Array.isArray(v[0])) {
            return v.map((row) => row.join(" ")).join("\n");
        }
        return v.join(" ");
    }
    return String(v);
}
/** Normalize program output for comparison: trim line-ends + outer blank lines. */
function normalizeOutput(s) {
    const lines = s.split("\n").map((l) => l.replace(/\s+$/, ""));
    while (lines.length > 0 && lines[lines.length - 1] === "")
        lines.pop();
    while (lines.length > 0 && lines[0] === "")
        lines.shift();
    return lines.join("\n");
}
/** Split stdout into marked outputs (one per test) and outside-marker logs. */
function extractMarked(stdout) {
    const outputs = [];
    const logs = [];
    const lines = stdout.split("\n");
    let inBlock = false;
    let block = [];
    for (const raw of lines) {
        const t = raw.trim();
        if (t === "##BEGIN##") {
            inBlock = true;
            block = [];
        }
        else if (t === "##END##") {
            inBlock = false;
            outputs.push(block.join("\n"));
        }
        else if (inBlock) {
            block.push(raw);
        }
        else if (t !== "") {
            logs.push(raw);
        }
    }
    return { outputs, logs };
}
// ─── C++ ─────────────────────────────────────────────────────────────────────
function cppParse(param, name) {
    switch (param) {
        case "int":
            return `    int ${name} = (int)jnum(jline());`;
        case "int[]":
            return `    vector<int> ${name} = jints(jline());`;
        case "int[][]":
            return `    vector<vector<int>> ${name}; { int R = (int)jnum(jline()); for (int r = 0; r < R; r++) ${name}.push_back(jints(jline())); }`;
        case "string":
            return `    string ${name} = jline();`;
    }
}
function cppCall(pl) {
    const args = pl.paramNames.join(", ");
    const begin = `    cout << "##BEGIN##" << "\\n";`;
    const end = `    cout << "##END##" << "\\n";`;
    if (pl.ret === "void-inplace") {
        return [`    ${pl.fn.cpp}(${args});`, begin, `    jprintvvi(${pl.paramNames[0]});`, end].join("\n");
    }
    const call = `${pl.fn.cpp}(${args})`;
    switch (pl.ret) {
        case "boolean":
            return [`    bool res = ${call};`, begin, `    cout << (res ? "true" : "false") << "\\n";`, end].join("\n");
        case "int[]":
            return [`    vector<int> res = ${call};`, begin, `    jprintvi(res);`, end].join("\n");
        case "int[][]":
            return [`    vector<vector<int>> res = ${call};`, begin, `    jprintvvi(res);`, end].join("\n");
        default:
            return [`    int res = ${call};`, begin, `    cout << res << "\\n";`, end].join("\n");
    }
}
function buildCppHarness(pl) {
    const parses = pl.params.map((p, i) => cppParse(p, pl.paramNames[i])).join("\n");
    return {
        // Includes go BEFORE user code: submissions must compile even if the
        // starter header was stripped.
        prepend: "#include <bits/stdc++.h>\nusing namespace std;\n\n",
        append: `

// ═══ judge harness (appended automatically — do not edit below) ═══
static vector<string> JL;
static int JP = 0;
static string jline() { return JP < (int)JL.size() ? JL[JP++] : ""; }
static vector<long long> jnums(const string& s) { vector<long long> v; long long x; istringstream ss(s); while (ss >> x) v.push_back(x); return v; }
static long long jnum(const string& s) { vector<long long> v = jnums(s); return v.empty() ? 0LL : v[0]; }
static vector<int> jints(const string& s) { vector<long long> v = jnums(s); vector<int> r; for (auto x : v) r.push_back((int)x); return r; }
static void jprintvi(const vector<int>& v) { for (int i = 0; i < (int)v.size(); i++) cout << v[i] << (i + 1 == (int)v.size() ? "\\n" : " "); }
static void jprintvvi(const vector<vector<int>>& m) { for (auto& row : m) jprintvi(row); }

int main() {
    string ln;
    while (getline(cin, ln)) JL.push_back(ln);
${parses}
${cppCall(pl)}
    return 0;
}
`,
    };
}
// ─── Python ──────────────────────────────────────────────────────────────────
function pyParse(param, name) {
    switch (param) {
        case "int":
            return `    ${name} = int(_line() or 0)`;
        case "int[]":
            return `    ${name} = _nums(_line())`;
        case "int[][]":
            return `    _r = int(_line() or 0)\n    ${name} = [_nums(_line()) for _ in range(_r)]`;
        case "string":
            return `    ${name} = _line()`;
    }
}
function pyCall(pl) {
    const args = pl.paramNames.join(", ");
    if (pl.ret === "void-inplace") {
        return [`    ${pl.fn.py}(${args})`, `    print("##BEGIN##")`, `    print(_jfmt(${pl.paramNames[0]}))`, `    print("##END##")`].join("\n");
    }
    return [`    _res = ${pl.fn.py}(${args})`, `    print("##BEGIN##")`, `    print(_jfmt(_res))`, `    print("##END##")`].join("\n");
}
function buildPyHarness(pl) {
    const parses = pl.params.map((p, i) => pyParse(p, pl.paramNames[i])).join("\n");
    return `

# ═══ judge harness (appended automatically — do not edit below) ═══
import sys as _sys

def _jfmt(v):
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, list):
        if v and isinstance(v[0], list):
            return "\\n".join(" ".join(str(x) for x in row) for row in v)
        return " ".join(str(x) for x in v)
    return str(v)

def _jmain():
    _lines = _sys.stdin.read().split("\\n")
    if _lines and _lines[-1] == "":
        _lines.pop()
    _p = [0]
    def _line():
        if _p[0] < len(_lines):
            v = _lines[_p[0]]
            _p[0] += 1
            return v
        return ""
    def _nums(s):
        return [int(t) for t in s.split()]
${parses}
${pyCall(pl)}

_jmain()
`;
}
// ─── Java (batch runner: all tests in one process) ───────────────────────────
// JEP 330 launches the FIRST top-level class in the file, so the generated
// Main is placed BEFORE the user's Solution class.
function javaParse(param, name) {
    switch (param) {
        case "int":
            return `int ${name} = (int) jnum(jline());`;
        case "int[]":
            return `int[] ${name} = jints(jline());`;
        case "int[][]":
            return `int R${name} = (int) jnum(jline()); int[][] ${name} = new int[R${name}][]; for (int r = 0; r < R${name}; r++) ${name}[r] = jints(jline());`;
        case "string":
            return `String ${name} = jline();`;
    }
}
function javaCall(pl) {
    const args = pl.paramNames.join(", ");
    const begin = `sb.append("##BEGIN##\\n");`;
    const end = `sb.append("##END##\\n");`;
    if (pl.ret === "void-inplace") {
        return [`new Solution().${pl.fn.java}(${args});`, begin, `jfmtVvi(sb, ${pl.paramNames[0]});`, end].join("\n");
    }
    const call = `new Solution().${pl.fn.java}(${args})`;
    switch (pl.ret) {
        case "boolean":
            return [`boolean res = ${call};`, begin, `sb.append(res ? "true" : "false").append('\\n');`, end].join("\n");
        case "int[]":
            return [`int[] res = ${call};`, begin, `jfmtVi(sb, res);`, end].join("\n");
        case "int[][]":
            return [`int[][] res = ${call};`, begin, `jfmtVvi(sb, res);`, end].join("\n");
        default:
            return [`int res = ${call};`, begin, `sb.append(res).append('\\n');`, end].join("\n");
    }
}
function buildJavaHarness(pl) {
    const parses = pl.params.map((p, i) => javaParse(p, pl.paramNames[i]).replace(/^/, "                ")).join("\n");
    const call = javaCall(pl)
        .split("\n")
        .map((l) => "                " + l)
        .join("\n");
    return {
        prepend: `import java.util.*;
import java.io.*;

// ═══ judge harness (appended automatically — do not edit below) ═══
public class Main {
    static List<String> JL = new ArrayList<>();
    static int JP = 0;
    static String jline() { return JP < JL.size() ? JL.get(JP++) : ""; }
    static long[] jnums(String s) {
        s = s.trim();
        if (s.isEmpty()) return new long[0];
        String[] t = s.split("\\\\s+");
        long[] v = new long[t.length];
        for (int i = 0; i < t.length; i++) v[i] = Long.parseLong(t[i]);
        return v;
    }
    static long jnum(String s) { long[] a = jnums(s); return a.length == 0 ? 0L : a[0]; }
    static int[] jints(String s) { long[] a = jnums(s); int[] v = new int[a.length]; for (int i = 0; i < a.length; i++) v[i] = (int) a[i]; return v; }
    static void jfmtVi(StringBuilder sb, int[] v) { for (int i = 0; i < v.length; i++) sb.append(v[i]).append(i + 1 == v.length ? '\\n' : ' '); }
    static void jfmtVvi(StringBuilder sb, int[][] m) { for (int[] row : m) jfmtVi(sb, row); }

    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String ln;
        while ((ln = br.readLine()) != null) JL.add(ln);
        int T = (int) jnum(jline());
        StringBuilder sb = new StringBuilder();
        for (int t = 0; t < T; t++) {
            try {
${parses}
${call}
            } catch (Throwable err) {
                sb.append("##BEGIN##\\n");
                sb.append("##ERR## ").append(err.getClass().getSimpleName());
                if (err.getMessage() != null) sb.append(": ").append(err.getMessage().replace("\\n", " "));
                sb.append("\\n##END##\\n");
            }
        }
        System.out.print(sb);
    }
}

// ═══ your solution goes below ═══
`,
        append: "",
    };
}
//# sourceMappingURL=harness.js.map