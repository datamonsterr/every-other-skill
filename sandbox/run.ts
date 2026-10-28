#!/usr/bin/env bun
/**
 * A/B test skill sets: run the same prompt on the same project once per variant,
 * each in a fresh workspace that sees only that variant's skills.
 *
 *   bun sandbox/run.ts examples/landing-page/experiments/taste.json
 *     [--variants baseline,taste] [--runs 2] [--parallel 2]
 *     [--harness claude|codex|fake] [--model sonnet] [--isolated-config]
 *     [--judge] [--judge-model opus] [--out .sandbox] [--dry-run]
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { argValue, bankPath, repoRoot } from "../scripts/lib.ts";
import {
  type AgentResult,
  type LoadedExperiment,
  loadExperiment,
  materializeSkills,
  parseClaudeStream,
  type RunRecord,
  renderReport,
  resolveVariant,
  type Variant,
} from "./lib.ts";

const args = process.argv.slice(2);
const file = args.find(
  (a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"),
);
if (!file || args.includes("--help")) {
  console.log(
    "Usage: bun sandbox/run.ts <experiment.json> [--variants a,b] [--runs N] [--parallel N]\n" +
      "  [--harness claude|codex|fake] [--model M] [--isolated-config] [--judge] [--judge-model M]\n" +
      "  [--out DIR] [--dry-run]",
  );
  process.exit(file ? 0 : 1);
}

const exp = loadExperiment(file);
const harness = argValue(args, "--harness") ?? "claude";
const model = argValue(args, "--model");
const runs = Number(argValue(args, "--runs") ?? exp.runs ?? 1);
const parallel = Math.max(1, Number(argValue(args, "--parallel") ?? 1));
const only = argValue(args, "--variants")?.split(",");
const isolated = args.includes("--isolated-config");
const bank = bankPath();
const variants = exp.variants.filter((v) => !only || only.includes(v.name));
if (!variants.length) throw new Error("no variants selected");
if (!["claude", "codex", "fake"].includes(harness))
  throw new Error(`unknown harness ${harness}`);

const startedAt = new Date().toISOString();
const outRoot = path.resolve(
  argValue(args, "--out") ?? path.join(repoRoot, ".sandbox"),
  exp.name,
  startedAt.replace(/[:.]/g, "-"),
);

const plan = variants.map((v) => ({
  variant: v,
  skills: resolveVariant(v, bank),
}));
for (const { variant, skills } of plan)
  console.log(
    `${variant.name}: ${skills.map((s) => s.name).join(", ") || "(no skills)"}`,
  );
if (args.includes("--dry-run")) process.exit(0);
fs.mkdirSync(outRoot, { recursive: true });

async function sh(
  cmd: string[],
  cwd: string,
  options: {
    env?: Record<string, string | undefined>;
    timeoutMs?: number;
    stdoutFile?: string;
  } = {},
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn(cmd, {
    cwd,
    env: { ...process.env, ...options.env },
    stdout: "pipe",
    stderr: "pipe",
    stdin: "ignore",
  });
  const timer = options.timeoutMs
    ? setTimeout(() => proc.kill(), options.timeoutMs)
    : undefined;
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  const exitCode = await proc.exited;
  if (timer) clearTimeout(timer);
  if (options.stdoutFile) fs.writeFileSync(options.stdoutFile, stdout);
  return { exitCode, stdout, stderr };
}

function git(args: string[], cwd: string) {
  const r = Bun.spawnSync(["git", ...args], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });
  if (r.exitCode !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout.toString();
}

function harnessCommand(prompt: string): string[] {
  switch (harness) {
    case "claude":
      return [
        "claude",
        "-p",
        prompt,
        "--output-format",
        "stream-json",
        "--verbose",
        // Project settings only: keeps user-level hooks (such as a global OtherSkill
        // router) and user skills out of the comparison.
        "--setting-sources",
        "project",
        "--permission-mode",
        "bypassPermissions",
        ...(model ? ["--model", model] : []),
      ];
    case "codex":
      return [
        "codex",
        "exec",
        "--json",
        "--skip-git-repo-check",
        "--dangerously-bypass-approvals-and-sandbox",
        ...(model ? ["-m", model] : []),
        prompt,
      ];
    default:
      // Deterministic stand-in used by tests: records which skills it could see.
      return [
        process.execPath,
        path.join(import.meta.dir, "fake-agent.ts"),
        prompt,
      ];
  }
}

async function runAgent(
  workspace: string,
  dir: string,
  prompt: string,
  variant: string,
): Promise<AgentResult> {
  const started = Date.now();
  const env: Record<string, string | undefined> = {};
  if (isolated && harness === "claude")
    env.CLAUDE_CONFIG_DIR = path.join(outRoot, `claude-config-${variant}`);
  const transcript = path.join(dir, "transcript.jsonl");
  const result = await sh(harnessCommand(prompt), workspace, {
    env,
    timeoutMs: (exp.timeoutMinutes ?? 30) * 60_000,
    stdoutFile: transcript,
  });
  fs.writeFileSync(path.join(dir, "stderr.log"), result.stderr);
  const parsed = parseClaudeStream(result.stdout);
  return {
    ...parsed,
    exitCode: result.exitCode,
    durationMs: parsed.durationMs ?? Date.now() - started,
    error:
      parsed.error ?? (result.exitCode ? result.stderr.slice(-500) : undefined),
  };
}

async function capture(
  workspace: string,
  dir: string,
): Promise<string | undefined> {
  const c = exp.capture;
  if (!c || (!c.file && !c.url)) return;
  let server: ReturnType<typeof Bun.spawn> | undefined;
  try {
    // biome-ignore lint/suspicious/noExplicitAny: optional dependency, typed loosely
    const { chromium } = (await import("playwright" as string)) as any;
    if (c.start) {
      server = Bun.spawn(["sh", "-c", c.start], {
        cwd: workspace,
        stdout: "ignore",
        stderr: "ignore",
      });
      const deadline = Date.now() + 60_000;
      while (Date.now() < deadline) {
        try {
          if ((await fetch(c.url as string)).ok) break;
        } catch {}
        await Bun.sleep(500);
      }
    }
    const browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: c.width ?? 1440, height: c.height ?? 900 },
    });
    await page.goto(c.file ? `file://${path.join(workspace, c.file)}` : c.url, {
      waitUntil: "networkidle",
    });
    const shot = path.join(dir, "screenshot.png");
    await page.screenshot({ path: shot, fullPage: true });
    await browser.close();
    return shot;
  } catch (error) {
    fs.writeFileSync(path.join(dir, "capture-error.log"), String(error));
    return;
  } finally {
    server?.kill();
  }
}

async function runOne(variant: Variant, run: number): Promise<RunRecord> {
  const skills = plan.find((p) => p.variant === variant)?.skills ?? [];
  const dir = path.join(outRoot, `${variant.name}-${run}`);
  const workspace = path.join(dir, "workspace");
  fs.cpSync(exp.projectDir, workspace, { recursive: true });
  materializeSkills(workspace, skills);
  git(["init", "-q"], workspace);
  git(["add", "-A"], workspace);
  git(
    [
      "-c",
      "user.name=sandbox",
      "-c",
      "user.email=sandbox@localhost",
      "commit",
      "-qm",
      "baseline",
      "--allow-empty",
    ],
    workspace,
  );
  const prompt = variant.promptSuffix
    ? `${exp.promptText}\n\n${variant.promptSuffix}`
    : exp.promptText;
  fs.writeFileSync(path.join(dir, "prompt.txt"), prompt);
  console.log(`▶ ${variant.name} #${run}`);
  const agent = await runAgent(workspace, dir, prompt, variant.name);
  let checkExitCode: number | undefined;
  if (exp.check) {
    const check = await sh(["sh", "-c", exp.check], workspace, {
      timeoutMs: 10 * 60_000,
    });
    checkExitCode = check.exitCode;
    fs.writeFileSync(path.join(dir, "check.log"), check.stdout + check.stderr);
  }
  git(["add", "-A"], workspace);
  fs.writeFileSync(
    path.join(dir, "diff.patch"),
    git(["diff", "--cached"], workspace),
  );
  let filesChanged = 0;
  let linesAdded = 0;
  let linesRemoved = 0;
  for (const line of git(["diff", "--cached", "--numstat"], workspace).split(
    "\n",
  )) {
    const [a, r] = line.split("\t");
    if (a === undefined || r === undefined) continue;
    filesChanged++;
    linesAdded += Number(a) || 0;
    linesRemoved += Number(r) || 0;
  }
  const screenshot = await capture(workspace, dir);
  const record: RunRecord = {
    ...agent,
    variant: variant.name,
    run,
    skillsLoaded: skills.map((s) => s.name),
    workspace: path.relative(outRoot, workspace),
    filesChanged,
    linesAdded,
    linesRemoved,
    checkExitCode,
    screenshot: screenshot && path.relative(outRoot, screenshot),
  };
  console.log(
    `✓ ${variant.name} #${run}: exit ${agent.exitCode}, ${filesChanged} files, skills used: ${agent.skillsUsed.join(", ") || "none"}`,
  );
  return record;
}

/** Blind judge: candidates are relabelled A, B, C... in random order. */
async function judge(records: RunRecord[]): Promise<string | undefined> {
  if (!args.includes("--judge")) return;
  // Judge in a directory outside the run folder so it cannot see variant names.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sandbox-judge-"));
  fs.cpSync(exp.projectDir, path.join(dir, "original-project"), {
    recursive: true,
  });
  const shuffled = [...records].sort(() => Math.random() - 0.5);
  const labels = new Map<string, RunRecord>();
  shuffled.forEach((r, i) => {
    const label = String.fromCharCode(65 + i);
    labels.set(label, r);
    const target = path.join(dir, `candidate-${label}`);
    const workspace = path.join(outRoot, r.workspace);
    fs.mkdirSync(target, { recursive: true });
    const patterns = exp.artifacts ?? ["**/*"];
    for (const pattern of patterns)
      for (const f of new Bun.Glob(pattern).scanSync({
        cwd: workspace,
        dot: false,
      })) {
        if (/^(\.claude|\.agents|node_modules|\.git)\//.test(f)) continue;
        fs.mkdirSync(path.dirname(path.join(target, f)), { recursive: true });
        fs.copyFileSync(path.join(workspace, f), path.join(target, f));
      }
    if (r.screenshot)
      fs.copyFileSync(
        path.join(outRoot, r.screenshot),
        path.join(target, "screenshot.png"),
      );
  });
  const rubric = (
    exp.rubric ?? ["Overall quality of the result for the prompt"]
  )
    .map((c, i) => `${i + 1}. ${c}`)
    .join("\n");
  const prompt = `You are judging ${labels.size} anonymous candidate results for the same task.
Each candidate is a folder candidate-<LETTER> in the current directory (screenshot.png when present).
original-project/ holds the project every candidate started from. Stay inside the current directory.
Read every candidate before scoring. Do not guess how each was produced.

Task given to every candidate:
"""
${exp.promptText}
"""

Score each candidate 1-5 on each criterion:
${rubric}

Reply with a Markdown table (candidate x criterion, plus total), a ranking, and two sentences of rationale per candidate.`;
  const result = await sh(
    [
      "claude",
      "-p",
      prompt,
      "--output-format",
      "json",
      "--setting-sources",
      "project",
      "--allowedTools",
      "Read,Glob,Grep",
      ...(argValue(args, "--judge-model")
        ? ["--model", argValue(args, "--judge-model") as string]
        : []),
    ],
    dir,
    { timeoutMs: 20 * 60_000 },
  );
  let text = result.stdout;
  try {
    text = (JSON.parse(result.stdout) as { result?: string }).result ?? text;
  } catch {}
  const key = [...labels]
    .map(([l, r]) => `- ${l} = ${r.variant} #${r.run}`)
    .join("\n");
  const out = `${text.trim()}\n\n**Unblinded:**\n\n${key}\n`;
  fs.writeFileSync(path.join(dir, "judge.md"), out);
  fs.cpSync(dir, path.join(outRoot, "judge"), { recursive: true });
  fs.rmSync(dir, { recursive: true, force: true });
  return out;
}

const jobs = plan.flatMap(({ variant }) =>
  Array.from({ length: runs }, (_, i) => () => runOne(variant, i + 1)),
);
const records: RunRecord[] = [];
async function worker() {
  for (let job = jobs.shift(); job; job = jobs.shift())
    records.push(await job());
}
await Promise.all(
  Array.from({ length: Math.min(parallel, jobs.length) }, worker),
);
records.sort((a, b) => a.variant.localeCompare(b.variant) || a.run - b.run);

const judged = await judge(records);
const meta = { harness, model, startedAt, judge: judged };
fs.writeFileSync(
  path.join(outRoot, "results.json"),
  `${JSON.stringify({ experiment: exp.name, ...meta, records }, null, 2)}\n`,
);
fs.writeFileSync(
  path.join(outRoot, "report.md"),
  renderReport(exp as LoadedExperiment, records, meta),
);
console.log(`\nReport: ${path.join(outRoot, "report.md")}`);
