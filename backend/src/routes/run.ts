// ─── Code judge route: POST /api/run ─────────────────────────────────────────
// Adapted from Next.js API — same judge logic, Express request/response
import { Router, Request, Response } from "express";
import vm from "node:vm";
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { getProblem, type Problem } from "../../../modules/data/problems";
import { getProblemLang, type ProblemLang } from "../../../modules/data/problem-langs";
import { explainError, type LangId } from "../lib/languages";
import {
  buildCppHarness, buildJavaHarness, buildPyHarness,
  extractMarked, fmtOut, normalizeOutput, serializeArgs, serializeBatch,
} from "../lib/judge/harness";
import { getPythonBin, getJavaBin, getCppBin } from "../lib/judge/compilers";
import type { CodeRunResponse, CodeTestResult } from "../../../modules/types";

const router = Router();
router.use(requireAuth);

const schema = z.object({
  slug: z.string().min(1).max(64),
  code: z.string().min(1, "Write some code first").max(50_000),
  language: z.enum(["js", "cpp", "py", "java"]).optional().default("js"),
});

const COMPILE_TIMEOUT_MS = 20_000;
const RUN_TIMEOUT_MS = 5_000;
const JAVA_BATCH_TIMEOUT_MS = 45_000;
const MAX_STREAM = 120_000;

interface ProcResult { code: number | null; stdout: string; stderr: string; timedOut: boolean; spawnError?: string; }

function runProcess(cmd: string[], opts: { cwd: string; input: string; timeoutMs: number }): Promise<ProcResult> {
  return new Promise((resolve) => {
    let child: ReturnType<typeof spawn>;
    try { child = spawn(cmd[0], cmd.slice(1), { cwd: opts.cwd, stdio: ["pipe", "pipe", "pipe"] }); }
    catch (err) { resolve({ code: -1, stdout: "", stderr: String(err), timedOut: false, spawnError: String(err) }); return; }
    let stdout = "", stderr = "", timedOut = false, settled = false;
    const finish = (r: ProcResult) => { if (settled) return; settled = true; clearTimeout(timer); resolve(r); };
    const timer = setTimeout(() => { timedOut = true; child.kill("SIGKILL"); }, opts.timeoutMs);
    child.stdout?.on("data", (d: Buffer) => { if (stdout.length < MAX_STREAM) stdout += d.toString().slice(0, MAX_STREAM - stdout.length); });
    child.stderr?.on("data", (d: Buffer) => { if (stderr.length < MAX_STREAM) stderr += d.toString().slice(0, MAX_STREAM - stderr.length); });
    child.stdin?.on("error", () => undefined);
    child.stdin?.write(opts.input); child.stdin?.end();
    child.on("error", (err) => finish({ code: -1, stdout, stderr, timedOut, spawnError: String(err) }));
    child.on("close", (code) => finish({ code, stdout, stderr, timedOut }));
  });
}

function trimError(s: string, maxLines = 14): string {
  return s.split("\n").filter((l) => l.trim() !== "").slice(0, maxLines).join("\n").slice(0, 1600);
}

function norm(value: unknown): string {
  if (value === undefined) return "undefined";
  if (typeof value === "number" && Object.is(value, -0)) return "0";
  if (typeof value === "bigint") return `${value}n`;
  try { return JSON.stringify(value) ?? "undefined"; } catch { return String(value); }
}

function fmtLog(v: unknown): string {
  if (typeof v === "string") return v;
  try { return JSON.stringify(v) ?? String(v); } catch { return String(v); }
}

function judgeJS(problem: Problem, code: string): CodeRunResponse {
  const started = Date.now();
  const results: CodeTestResult[] = [];
  let compileError: string | undefined;
  for (const test of problem.tests) {
    const logs: string[] = [];
    const sandbox = { console: { log: (...a: unknown[]) => logs.push(a.map(fmtLog).join(" ")), error: (...a: unknown[]) => logs.push("ERROR " + a.map(fmtLog).join(" ")), warn: (...a: unknown[]) => logs.push("WARN " + a.map(fmtLog).join(" ")), }, };
    try {
      const ctx = vm.createContext(sandbox);
      const wrapped = `${code}\n;globalThis.__fn = typeof ${problem.functionName} === "function" ? ${problem.functionName} : null;`;
      vm.runInContext(wrapped, ctx, { timeout: 2500, filename: "solution.js" });
      const fn = (ctx as { __fn?: unknown }).__fn;
      if (typeof fn !== "function") { compileError = `Could not find function "${problem.functionName}". Keep the starter signature.`; break; }
      const call = `__fn(${test.args.map((a) => JSON.stringify(a)).join(", ")})`;
      const got = vm.runInContext(call, ctx, { timeout: 2000, filename: "test.js" });
      const passed = norm(got) === norm(test.expected);
      results.push({ passed, args: test.args, expected: test.expected, got: got === undefined ? "undefined" : got, logs });
    } catch (err) {
      const name = (err as { name?: string })?.name ?? "Error";
      const message = (err as { message?: string })?.message ?? String(err);
      if (name === "SyntaxError" && !compileError) { compileError = `SyntaxError: ${message}`; break; }
      results.push({ passed: false, args: test.args, expected: test.expected, got: "—", error: message.includes("timed out") ? "Timed out (possible infinite loop)" : `${name}: ${message}`, logs });
    }
  }
  return { ok: !compileError && results.length > 0 && results.every((r) => r.passed), compileError, suggestion: compileError ? explainError("js", compileError) ?? undefined : undefined, results, passed: results.filter((r) => r.passed).length, total: problem.tests.length, timeMs: Date.now() - started, language: "js" };
}

function computeExpected(problem: Problem, pl: ProblemLang): string[] {
  return problem.tests.map((test) => {
    const ctx = vm.createContext({});
    vm.runInContext(`${problem.solution}\n;globalThis.__f = ${pl.fn.js};`, ctx, { timeout: 2500, filename: "ref.js" });
    if (pl.ret === "void-inplace") {
      const mutated = vm.runInContext(`(function(){ const a = ${JSON.stringify(test.args)}; __f(...a); return a[0]; })()`, ctx, { timeout: 2000, filename: "refcall.js" });
      return fmtOut(mutated);
    }
    const got = vm.runInContext(`__f(${test.args.map((a) => JSON.stringify(a)).join(", ")})`, ctx, { timeout: 2000, filename: "refcall.js" });
    return fmtOut(got);
  });
}

async function judgeCpp(problem: Problem, pl: ProblemLang, code: string, dir: string, gppBin: string): Promise<CodeRunResponse> {
  const started = Date.now();
  const expected = computeExpected(problem, pl);
  const src = path.join(dir, "solution.cpp");
  const exe = path.join(dir, process.platform === "win32" ? "solution.exe" : "solution");
  const { prepend, append } = buildCppHarness(pl);
  await fs.writeFile(src, prepend + code + "\n" + append);
  const compile = await runProcess([gppBin, "-O2", "-std=c++17", "-o", exe, src], { cwd: dir, input: "", timeoutMs: COMPILE_TIMEOUT_MS });
  if (compile.code !== 0) {
    const msg = compile.timedOut ? "Compilation timed out." : trimError(compile.stderr);
    return { ok: false, compileError: msg || "Compilation failed.", suggestion: explainError("cpp", compile.stderr) ?? undefined, results: [], passed: 0, total: problem.tests.length, timeMs: Date.now() - started, language: "cpp" };
  }
  const results: CodeTestResult[] = [];
  for (let i = 0; i < problem.tests.length; i++) {
    const test = problem.tests[i];
    const r = await runProcess([exe], { cwd: dir, input: serializeArgs(pl.params, test.args), timeoutMs: RUN_TIMEOUT_MS });
    if (r.timedOut) { results.push({ passed: false, args: test.args, expected: expected[i], got: "—", error: "Timed out", logs: [] }); continue; }
    if (r.code !== 0) { results.push({ passed: false, args: test.args, expected: expected[i], got: "—", error: trimError(r.stderr, 3) || `Runtime error (exit ${r.code})`, logs: [] }); continue; }
    const { outputs, logs } = extractMarked(r.stdout);
    const got = outputs[0] ?? "";
    results.push({ passed: normalizeOutput(got) === normalizeOutput(expected[i]), args: test.args, expected: expected[i], got, logs });
  }
  return { ok: results.length > 0 && results.every((r) => r.passed), results, passed: results.filter((r) => r.passed).length, total: problem.tests.length, timeMs: Date.now() - started, language: "cpp" };
}

async function judgePy(problem: Problem, pl: ProblemLang, code: string, dir: string, pyBin: string): Promise<CodeRunResponse> {
  const started = Date.now();
  const expected = computeExpected(problem, pl);
  const src = path.join(dir, "solution.py");
  await fs.writeFile(src, code + "\n" + buildPyHarness(pl));
  const results: CodeTestResult[] = [];
  let firstError: string | undefined, firstSuggestion: string | undefined;
  for (let i = 0; i < problem.tests.length; i++) {
    const test = problem.tests[i];
    const r = await runProcess([pyBin, src], { cwd: dir, input: serializeArgs(pl.params, test.args), timeoutMs: RUN_TIMEOUT_MS });
    if (r.timedOut) { results.push({ passed: false, args: test.args, expected: expected[i], got: "—", error: "Timed out", logs: [] }); continue; }
    if (r.code !== 0) {
      const msg = trimError(r.stderr, 4) || r.spawnError || `Runtime error (exit ${r.code})`;
      if (/SyntaxError|IndentationError/.test(r.stderr) && !firstError) { firstError = msg; firstSuggestion = explainError("py", r.stderr) ?? undefined; }
      results.push({ passed: false, args: test.args, expected: expected[i], got: "—", error: msg, logs: [] }); continue;
    }
    const { outputs, logs } = extractMarked(r.stdout);
    const got = outputs[0] ?? "";
    results.push({ passed: normalizeOutput(got) === normalizeOutput(expected[i]), args: test.args, expected: expected[i], got, logs });
  }
  return { ok: !firstError && results.length > 0 && results.every((r) => r.passed), compileError: firstError, suggestion: firstSuggestion, results, passed: results.filter((r) => r.passed).length, total: problem.tests.length, timeMs: Date.now() - started, language: "py" };
}

async function judgeJava(problem: Problem, pl: ProblemLang, code: string, dir: string, javaBin: string): Promise<CodeRunResponse> {
  const started = Date.now();
  const expected = computeExpected(problem, pl);
  const { prepend } = buildJavaHarness(pl);
  const imports: string[] = [];
  const cleanCode = code.replace(/^\s*import\s+[^;]+;\s*$/gm, (m) => {
    imports.push(m.trim());
    return "";
  });
  const src = path.join(dir, "Main.java");
  await fs.writeFile(src, `${imports.join("\n")}\n${prepend}\n${cleanCode}\n`);
  const stdin = serializeBatch(pl.params, problem.tests);
  const r = await runProcess([javaBin, "Main.java"], { cwd: dir, input: stdin, timeoutMs: JAVA_BATCH_TIMEOUT_MS });
  const { outputs, logs } = extractMarked(r.stdout);
  if (r.code !== 0 && outputs.length === 0) {
    const msg = r.timedOut ? "Compilation/execution timed out." : trimError(r.stderr) || `Execution failed (exit ${r.code})`;
    return { ok: false, compileError: msg, suggestion: explainError("java", r.stderr) ?? undefined, results: [], passed: 0, total: problem.tests.length, timeMs: Date.now() - started, language: "java" };
  }
  const results: CodeTestResult[] = [];
  for (let i = 0; i < problem.tests.length; i++) {
    const test = problem.tests[i];
    const got = outputs[i];
    if (got === undefined) { results.push({ passed: false, args: test.args, expected: expected[i], got: "—", error: r.timedOut ? "Timed out" : "Program terminated before this test", logs: [] }); continue; }
    if (got.startsWith("##ERR##")) { results.push({ passed: false, args: test.args, expected: expected[i], got: "—", error: got.replace("##ERR## ", "").trim(), logs: [] }); continue; }
    results.push({ passed: normalizeOutput(got) === normalizeOutput(expected[i]), args: test.args, expected: expected[i], got, logs });
  }
  return { ok: results.length > 0 && results.every((x) => x.passed), results, passed: results.filter((x) => x.passed).length, total: problem.tests.length, timeMs: Date.now() - started, language: "java" };
}

import { isOnlineCompilerAvailable, judgeOnline } from "../lib/judge/online-compiler";

router.post("/", async (req: Request, res: Response) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }); return; }
  const { slug, code, language } = parsed.data;
  const problem = getProblem(slug);
  if (!problem) { res.status(404).json({ error: "Unknown problem" }); return; }

  if (language === "js") { res.json(judgeJS(problem, code)); return; }

  const pl = getProblemLang(slug);
  if (!pl) { res.status(400).json({ error: "This problem is not available in that language yet" }); return; }

  // 1. First-class execution via OnlineCompiler.io
  if (isOnlineCompilerAvailable && (language === "cpp" || language === "py" || language === "java")) {
    try {
      const expected = computeExpected(problem, pl);
      const onlineResp = await judgeOnline(problem, pl, language, code, expected);
      res.json(onlineResp);
      return;
    } catch (onlineErr) {
      console.warn(`OnlineCompiler fallback triggered: ${(onlineErr as Error)?.message}`);
    }
  }

  // 2. Local compiler fallback
  if (language === "cpp") {
    const cpp = getCppBin();
    if (!cpp.available) {
      res.json({
        ok: false,
        compileError: "C++ compiler (g++) is not installed on this system.",
        suggestion: cpp.installHint,
        results: [],
        passed: 0,
        total: problem.tests.length,
        timeMs: 0,
        language: "cpp",
      });
      return;
    }
  } else if (language === "py") {
    const py = getPythonBin();
    if (!py.available) {
      res.json({
        ok: false,
        compileError: "Python 3 interpreter is not installed on this system.",
        suggestion: py.installHint,
        results: [],
        passed: 0,
        total: problem.tests.length,
        timeMs: 0,
        language: "py",
      });
      return;
    }
  } else if (language === "java") {
    const java = getJavaBin();
    if (!java.available) {
      res.json({
        ok: false,
        compileError: "Java runtime (java) is not installed on this system.",
        suggestion: java.installHint,
        results: [],
        passed: 0,
        total: problem.tests.length,
        timeMs: 0,
        language: "java",
      });
      return;
    }
  }

  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "codeclash-"));
  try {
    let response: CodeRunResponse;
    if (language === "cpp") response = await judgeCpp(problem, pl, code, dir, getCppBin().binPath);
    else if (language === "py") response = await judgePy(problem, pl, code, dir, getPythonBin().binPath);
    else response = await judgeJava(problem, pl, code, dir, getJavaBin().binPath);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: `Judge crashed: ${(err as Error)?.message ?? String(err)}` });
  } finally {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
});

export default router;
