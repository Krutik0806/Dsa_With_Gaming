"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// ─── Code judge route: POST /api/run ─────────────────────────────────────────
// Adapted from Next.js API — same judge logic, Express request/response
const express_1 = require("express");
const node_vm_1 = __importDefault(require("node:vm"));
const node_child_process_1 = require("node:child_process");
const node_fs_1 = require("node:fs");
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const problems_1 = require("../../../modules/data/problems");
const problem_langs_1 = require("../../../modules/data/problem-langs");
const languages_1 = require("../lib/languages");
const harness_1 = require("../lib/judge/harness");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
const schema = zod_1.z.object({
    slug: zod_1.z.string().min(1).max(64),
    code: zod_1.z.string().min(1, "Write some code first").max(50000),
    language: zod_1.z.enum(["js", "cpp", "py", "java"]).optional().default("js"),
});
const GPP = process.env.GPP_BIN ?? "/usr/bin/g++";
const JAVA = process.env.JAVA_BIN ?? "/usr/bin/java";
const PY = process.env.PYTHON_BIN ?? "/home/user/.venv/bin/python3";
const COMPILE_TIMEOUT_MS = 20000;
const RUN_TIMEOUT_MS = 5000;
const JAVA_BATCH_TIMEOUT_MS = 45000;
const MAX_STREAM = 120000;
function runProcess(cmd, opts) {
    return new Promise((resolve) => {
        let child;
        try {
            child = (0, node_child_process_1.spawn)(cmd[0], cmd.slice(1), { cwd: opts.cwd, stdio: ["pipe", "pipe", "pipe"] });
        }
        catch (err) {
            resolve({ code: -1, stdout: "", stderr: String(err), timedOut: false, spawnError: String(err) });
            return;
        }
        let stdout = "", stderr = "", timedOut = false, settled = false;
        const finish = (r) => { if (settled)
            return; settled = true; clearTimeout(timer); resolve(r); };
        const timer = setTimeout(() => { timedOut = true; child.kill("SIGKILL"); }, opts.timeoutMs);
        child.stdout?.on("data", (d) => { if (stdout.length < MAX_STREAM)
            stdout += d.toString().slice(0, MAX_STREAM - stdout.length); });
        child.stderr?.on("data", (d) => { if (stderr.length < MAX_STREAM)
            stderr += d.toString().slice(0, MAX_STREAM - stderr.length); });
        child.stdin?.on("error", () => undefined);
        child.stdin?.write(opts.input);
        child.stdin?.end();
        child.on("error", (err) => finish({ code: -1, stdout, stderr, timedOut, spawnError: String(err) }));
        child.on("close", (code) => finish({ code, stdout, stderr, timedOut }));
    });
}
function trimError(s, maxLines = 14) {
    return s.split("\n").filter((l) => l.trim() !== "").slice(0, maxLines).join("\n").slice(0, 1600);
}
function norm(value) {
    if (value === undefined)
        return "undefined";
    if (typeof value === "number" && Object.is(value, -0))
        return "0";
    if (typeof value === "bigint")
        return `${value}n`;
    try {
        return JSON.stringify(value) ?? "undefined";
    }
    catch {
        return String(value);
    }
}
function fmtLog(v) {
    if (typeof v === "string")
        return v;
    try {
        return JSON.stringify(v) ?? String(v);
    }
    catch {
        return String(v);
    }
}
function judgeJS(problem, code) {
    const started = Date.now();
    const results = [];
    let compileError;
    for (const test of problem.tests) {
        const logs = [];
        const sandbox = { console: { log: (...a) => logs.push(a.map(fmtLog).join(" ")), error: (...a) => logs.push("ERROR " + a.map(fmtLog).join(" ")), warn: (...a) => logs.push("WARN " + a.map(fmtLog).join(" ")), }, };
        try {
            const ctx = node_vm_1.default.createContext(sandbox);
            const wrapped = `${code}\n;globalThis.__fn = typeof ${problem.functionName} === "function" ? ${problem.functionName} : null;`;
            node_vm_1.default.runInContext(wrapped, ctx, { timeout: 2500, filename: "solution.js" });
            const fn = ctx.__fn;
            if (typeof fn !== "function") {
                compileError = `Could not find function "${problem.functionName}". Keep the starter signature.`;
                break;
            }
            const call = `__fn(${test.args.map((a) => JSON.stringify(a)).join(", ")})`;
            const got = node_vm_1.default.runInContext(call, ctx, { timeout: 2000, filename: "test.js" });
            const passed = norm(got) === norm(test.expected);
            results.push({ passed, args: test.args, expected: test.expected, got: got === undefined ? "undefined" : got, logs });
        }
        catch (err) {
            const name = err?.name ?? "Error";
            const message = err?.message ?? String(err);
            if (name === "SyntaxError" && !compileError) {
                compileError = `SyntaxError: ${message}`;
                break;
            }
            results.push({ passed: false, args: test.args, expected: test.expected, got: "—", error: message.includes("timed out") ? "Timed out (possible infinite loop)" : `${name}: ${message}`, logs });
        }
    }
    return { ok: !compileError && results.length > 0 && results.every((r) => r.passed), compileError, suggestion: compileError ? (0, languages_1.explainError)("js", compileError) ?? undefined : undefined, results, passed: results.filter((r) => r.passed).length, total: problem.tests.length, timeMs: Date.now() - started, language: "js" };
}
function computeExpected(problem, pl) {
    return problem.tests.map((test) => {
        const ctx = node_vm_1.default.createContext({});
        node_vm_1.default.runInContext(`${problem.solution}\n;globalThis.__f = ${pl.fn.js};`, ctx, { timeout: 2500, filename: "ref.js" });
        if (pl.ret === "void-inplace") {
            const mutated = node_vm_1.default.runInContext(`(function(){ const a = ${JSON.stringify(test.args)}; __f(...a); return a[0]; })()`, ctx, { timeout: 2000, filename: "refcall.js" });
            return (0, harness_1.fmtOut)(mutated);
        }
        const got = node_vm_1.default.runInContext(`__f(${test.args.map((a) => JSON.stringify(a)).join(", ")})`, ctx, { timeout: 2000, filename: "refcall.js" });
        return (0, harness_1.fmtOut)(got);
    });
}
async function judgeCpp(problem, pl, code, dir) {
    const started = Date.now();
    const expected = computeExpected(problem, pl);
    const src = node_path_1.default.join(dir, "solution.cpp");
    const exe = node_path_1.default.join(dir, "solution");
    const { prepend, append } = (0, harness_1.buildCppHarness)(pl);
    await node_fs_1.promises.writeFile(src, prepend + code + "\n" + append);
    const compile = await runProcess([GPP, "-O2", "-std=c++17", "-o", exe, src], { cwd: dir, input: "", timeoutMs: COMPILE_TIMEOUT_MS });
    if (compile.code !== 0) {
        const msg = compile.timedOut ? "Compilation timed out." : trimError(compile.stderr);
        return { ok: false, compileError: msg || "Compilation failed.", suggestion: (0, languages_1.explainError)("cpp", compile.stderr) ?? undefined, results: [], passed: 0, total: problem.tests.length, timeMs: Date.now() - started, language: "cpp" };
    }
    const results = [];
    for (let i = 0; i < problem.tests.length; i++) {
        const test = problem.tests[i];
        const r = await runProcess([exe], { cwd: dir, input: (0, harness_1.serializeArgs)(pl.params, test.args), timeoutMs: RUN_TIMEOUT_MS });
        if (r.timedOut) {
            results.push({ passed: false, args: test.args, expected: expected[i], got: "—", error: "Timed out", logs: [] });
            continue;
        }
        if (r.code !== 0) {
            results.push({ passed: false, args: test.args, expected: expected[i], got: "—", error: trimError(r.stderr, 3) || `Runtime error (exit ${r.code})`, logs: [] });
            continue;
        }
        const { outputs, logs } = (0, harness_1.extractMarked)(r.stdout);
        const got = outputs[0] ?? "";
        results.push({ passed: (0, harness_1.normalizeOutput)(got) === (0, harness_1.normalizeOutput)(expected[i]), args: test.args, expected: expected[i], got, logs });
    }
    return { ok: results.length > 0 && results.every((r) => r.passed), results, passed: results.filter((r) => r.passed).length, total: problem.tests.length, timeMs: Date.now() - started, language: "cpp" };
}
async function judgePy(problem, pl, code, dir) {
    const started = Date.now();
    const expected = computeExpected(problem, pl);
    const src = node_path_1.default.join(dir, "solution.py");
    await node_fs_1.promises.writeFile(src, code + "\n" + (0, harness_1.buildPyHarness)(pl));
    const results = [];
    let firstError, firstSuggestion;
    for (let i = 0; i < problem.tests.length; i++) {
        const test = problem.tests[i];
        const r = await runProcess([PY, src], { cwd: dir, input: (0, harness_1.serializeArgs)(pl.params, test.args), timeoutMs: RUN_TIMEOUT_MS });
        if (r.timedOut) {
            results.push({ passed: false, args: test.args, expected: expected[i], got: "—", error: "Timed out", logs: [] });
            continue;
        }
        if (r.code !== 0) {
            const msg = trimError(r.stderr, 4) || `Runtime error (exit ${r.code})`;
            if (/SyntaxError|IndentationError/.test(r.stderr) && !firstError) {
                firstError = msg;
                firstSuggestion = (0, languages_1.explainError)("py", r.stderr) ?? undefined;
            }
            results.push({ passed: false, args: test.args, expected: expected[i], got: "—", error: msg, logs: [] });
            continue;
        }
        const { outputs, logs } = (0, harness_1.extractMarked)(r.stdout);
        const got = outputs[0] ?? "";
        results.push({ passed: (0, harness_1.normalizeOutput)(got) === (0, harness_1.normalizeOutput)(expected[i]), args: test.args, expected: expected[i], got, logs });
    }
    return { ok: !firstError && results.length > 0 && results.every((r) => r.passed), compileError: firstError, suggestion: firstSuggestion, results, passed: results.filter((r) => r.passed).length, total: problem.tests.length, timeMs: Date.now() - started, language: "py" };
}
async function judgeJava(problem, pl, code, dir) {
    const started = Date.now();
    const expected = computeExpected(problem, pl);
    const { prepend } = (0, harness_1.buildJavaHarness)(pl);
    const src = node_path_1.default.join(dir, "Main.java");
    await node_fs_1.promises.writeFile(src, prepend + code + "\n");
    const stdin = (0, harness_1.serializeBatch)(pl.params, problem.tests);
    const r = await runProcess([JAVA, "Main.java"], { cwd: dir, input: stdin, timeoutMs: JAVA_BATCH_TIMEOUT_MS });
    const { outputs, logs } = (0, harness_1.extractMarked)(r.stdout);
    if (r.code !== 0 && outputs.length === 0) {
        const msg = r.timedOut ? "Compilation/execution timed out." : trimError(r.stderr) || `Execution failed (exit ${r.code})`;
        return { ok: false, compileError: msg, suggestion: (0, languages_1.explainError)("java", r.stderr) ?? undefined, results: [], passed: 0, total: problem.tests.length, timeMs: Date.now() - started, language: "java" };
    }
    const results = [];
    for (let i = 0; i < problem.tests.length; i++) {
        const test = problem.tests[i];
        const got = outputs[i];
        if (got === undefined) {
            results.push({ passed: false, args: test.args, expected: expected[i], got: "—", error: r.timedOut ? "Timed out" : "Program terminated before this test", logs: [] });
            continue;
        }
        if (got.startsWith("##ERR##")) {
            results.push({ passed: false, args: test.args, expected: expected[i], got: "—", error: got.replace("##ERR## ", "").trim(), logs: [] });
            continue;
        }
        results.push({ passed: (0, harness_1.normalizeOutput)(got) === (0, harness_1.normalizeOutput)(expected[i]), args: test.args, expected: expected[i], got, logs });
    }
    return { ok: results.length > 0 && results.every((x) => x.passed), results, passed: results.filter((x) => x.passed).length, total: problem.tests.length, timeMs: Date.now() - started, language: "java" };
}
router.post("/", async (req, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
        return;
    }
    const { slug, code, language } = parsed.data;
    const problem = (0, problems_1.getProblem)(slug);
    if (!problem) {
        res.status(404).json({ error: "Unknown problem" });
        return;
    }
    if (language === "js") {
        res.json(judgeJS(problem, code));
        return;
    }
    const pl = (0, problem_langs_1.getProblemLang)(slug);
    if (!pl) {
        res.status(400).json({ error: "This problem is not available in that language yet" });
        return;
    }
    const dir = await node_fs_1.promises.mkdtemp(node_path_1.default.join(node_os_1.default.tmpdir(), "codeclash-"));
    try {
        let response;
        if (language === "cpp")
            response = await judgeCpp(problem, pl, code, dir);
        else if (language === "py")
            response = await judgePy(problem, pl, code, dir);
        else
            response = await judgeJava(problem, pl, code, dir);
        res.json(response);
    }
    catch (err) {
        res.status(500).json({ error: `Judge crashed: ${err?.message ?? String(err)}` });
    }
    finally {
        await node_fs_1.promises.rm(dir, { recursive: true, force: true }).catch(() => undefined);
    }
});
exports.default = router;
//# sourceMappingURL=run.js.map