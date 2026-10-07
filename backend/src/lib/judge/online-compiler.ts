// ─── OnlineCompiler.io Integration ──────────────────────────────────────────
// Executes user code in isolated cloud containers using OnlineCompiler.io API.
// Supports C++ (g++-15), Java (openjdk-25), and Python (python-3.14).
import type { Problem } from "../../../../modules/data/problems";
import type { ProblemLang, PType } from "../../../../modules/data/problem-langs";
import type { CodeRunResponse, CodeTestResult } from "../../../../modules/types";
import {
  buildJavaHarness,
  extractMarked,
  normalizeOutput,
  serializeBatch,
} from "./harness";

const API_KEY = process.env.ONLINE_COMPILER_API_KEY || "fca0c882d1c90190aca2a11e1ac89c79";
const API_URL = "https://api.onlinecompiler.io/api/run-code-sync/";

export const isOnlineCompilerAvailable = Boolean(API_KEY);

interface OnlineCompilerResponse {
  output?: string;
  error?: string;
  status?: string;
  exit_code?: number;
  time?: string;
  memory?: string;
}

export async function runCodeOnline(compiler: string, code: string, input: string): Promise<OnlineCompilerResponse> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Authorization": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ compiler, code, input }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OnlineCompiler API error (${res.status}): ${txt}`);
  }

  return (await res.json()) as OnlineCompilerResponse;
}

// ─── Batch C++ Harness ─────────────────────────────────────────────────────────

function buildCppBatch(pl: ProblemLang, code: string): string {
  const parses = pl.params.map((p, i) => {
    switch (p) {
      case "int": return `        int ${pl.paramNames[i]} = (int)jnum(jline());`;
      case "int[]": return `        vector<int> ${pl.paramNames[i]} = jints(jline());`;
      case "int[][]": return `        vector<vector<int>> ${pl.paramNames[i]}; { int R = (int)jnum(jline()); for (int r = 0; r < R; r++) ${pl.paramNames[i]}.push_back(jints(jline())); }`;
      case "string": return `        string ${pl.paramNames[i]} = jline();`;
    }
  }).join("\n");

  const args = pl.paramNames.join(", ");
  const begin = `        cout << "##BEGIN##\\n";`;
  const end = `        cout << "##END##\\n";`;
  let call = "";
  if (pl.ret === "void-inplace") {
    call = `        ${pl.fn.cpp}(${args});\n${begin}\n        jprintvvi(${pl.paramNames[0]});\n${end}`;
  } else if (pl.ret === "boolean") {
    call = `        bool res = ${pl.fn.cpp}(${args});\n${begin}\n        cout << (res ? "true" : "false") << "\\n";\n${end}`;
  } else if (pl.ret === "int[]") {
    call = `        vector<int> res = ${pl.fn.cpp}(${args});\n${begin}\n        jprintvi(res);\n${end}`;
  } else if (pl.ret === "int[][]") {
    call = `        vector<vector<int>> res = ${pl.fn.cpp}(${args});\n${begin}\n        jprintvvi(res);\n${end}`;
  } else {
    call = `        int res = ${pl.fn.cpp}(${args});\n${begin}\n        cout << res << "\\n";\n${end}`;
  }

  return `#include <bits/stdc++.h>
using namespace std;

${code}

// ═══ judge harness (appended automatically) ═══
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
    int T = (int)jnum(jline());
    for (int t = 0; t < T; t++) {
${parses}
${call}
    }
    return 0;
}
`;
}

// ─── Batch Python Harness ──────────────────────────────────────────────────────

function buildPyBatch(pl: ProblemLang, code: string): string {
  const parses = pl.params.map((p, i) => {
    switch (p) {
      case "int": return `            ${pl.paramNames[i]} = int(_line() or 0)`;
      case "int[]": return `            ${pl.paramNames[i]} = _nums(_line())`;
      case "int[][]": return `            _r = int(_line() or 0)\n            ${pl.paramNames[i]} = [_nums(_line()) for _ in range(_r)]`;
      case "string": return `            ${pl.paramNames[i]} = _line()`;
    }
  }).join("\n");

  const args = pl.paramNames.join(", ");
  const call = pl.ret === "void-inplace"
    ? `            ${pl.fn.py}(${args})\n            print("##BEGIN##")\n            print(_jfmt(${pl.paramNames[0]}))\n            print("##END##")`
    : `            _res = ${pl.fn.py}(${args})\n            print("##BEGIN##")\n            print(_jfmt(_res))\n            print("##END##")`;

  return `${code}

# ═══ judge harness (appended automatically) ═══
import sys as _sys

def _jfmt(v):
    if isinstance(v, bool): return "true" if v else "false"
    if isinstance(v, list):
        if v and isinstance(v[0], list): return "\\n".join(" ".join(str(x) for x in row) for row in v)
        return " ".join(str(x) for x in v)
    return str(v)

def _jmain():
    _lines = _sys.stdin.read().split("\\n")
    if _lines and _lines[-1] == "": _lines.pop()
    _p = [0]
    def _line():
        if _p[0] < len(_lines):
            v = _lines[_p[0]]; _p[0] += 1; return v
        return ""
    def _nums(s): return [int(t) for t in s.split()]
    
    _T_str = _line()
    if not _T_str: return
    _T = int(_T_str)
    for _ in range(_T):
        try:
${parses}
${call}
        except Exception as e:
            print("##BEGIN##")
            print(f"##ERR## {type(e).__name__}: {e}")
            print("##END##")

_jmain()
`;
}

// ─── Batch Java Harness ────────────────────────────────────────────────────────

function buildJavaBatch(pl: ProblemLang, code: string): string {
  const { prepend } = buildJavaHarness(pl);
  const imports: string[] = [];
  const cleanCode = code.replace(/^\s*import\s+[^;]+;\s*$/gm, (m) => {
    imports.push(m.trim());
    return "";
  });
  return `${imports.join("\n")}\n${prepend}\n${cleanCode}\n`;
}

// ─── Judge via OnlineCompiler.io ──────────────────────────────────────────────

export async function judgeOnline(
  problem: Problem,
  pl: ProblemLang,
  language: "cpp" | "py" | "java",
  code: string,
  expected: string[]
): Promise<CodeRunResponse> {
  const started = Date.now();
  const compiler = language === "cpp" ? "g++-15" : language === "py" ? "python-3.14" : "openjdk-25";

  let fullSource = "";
  if (language === "cpp") fullSource = buildCppBatch(pl, code);
  else if (language === "py") fullSource = buildPyBatch(pl, code);
  else fullSource = buildJavaBatch(pl, code);

  const stdin = serializeBatch(pl.params, problem.tests);
  const resp = await runCodeOnline(compiler, fullSource, stdin);

  const totalTime = Math.round(parseFloat(resp.time || "0") * 1000) || (Date.now() - started);

  if (resp.status !== "success" || (resp.exit_code !== 0 && (!resp.output || !resp.output.includes("##BEGIN##")))) {
    const errorMsg = (resp.error || resp.output || "Execution failed").trim();
    return {
      ok: false,
      compileError: errorMsg,
      results: [],
      passed: 0,
      total: problem.tests.length,
      timeMs: totalTime,
      language,
    };
  }

  const { outputs, logs } = extractMarked(resp.output || "");
  const results: CodeTestResult[] = [];

  for (let i = 0; i < problem.tests.length; i++) {
    const test = problem.tests[i];
    const got = outputs[i];
    if (got === undefined) {
      results.push({
        passed: false,
        args: test.args,
        expected: expected[i],
        got: "—",
        error: resp.error || "Program exited before evaluating this test",
        logs,
      });
      continue;
    }

    if (got.startsWith("##ERR##")) {
      results.push({
        passed: false,
        args: test.args,
        expected: expected[i],
        got: "—",
        error: got.replace("##ERR## ", "").trim(),
        logs,
      });
      continue;
    }

    const passed = normalizeOutput(got) === normalizeOutput(expected[i]);
    results.push({
      passed,
      args: test.args,
      expected: expected[i],
      got,
      logs,
    });
  }

  return {
    ok: results.length > 0 && results.every((r) => r.passed),
    results,
    passed: results.filter((r) => r.passed).length,
    total: problem.tests.length,
    timeMs: totalTime,
    language,
  };
}
