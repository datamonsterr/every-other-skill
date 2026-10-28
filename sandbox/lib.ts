import fs from "node:fs";
import path from "node:path";
import { type BankSkill, listBank } from "../scripts/lib.ts";

/** One arm of an experiment: the skills the agent can see natively for this run. */
export interface Variant {
  name: string;
  /** Skill names (frontmatter `name`) or `category/name` refs from the bank. */
  skills?: string[];
  /** Every skill in these categories (prefix match: "techstack" includes "techstack/rust"). */
  categories?: string[];
  /** Extra text appended to the prompt for this arm only. Keep empty for fair comparisons. */
  promptSuffix?: string;
}

export interface Capture {
  /** Static file in the workspace to screenshot, e.g. "index.html". */
  file?: string;
  /** URL to screenshot after `start` is running, e.g. "http://localhost:4173". */
  url?: string;
  /** Command started in the workspace before `url` is captured; killed afterwards. */
  start?: string;
  width?: number;
  height?: number;
}

export interface Experiment {
  name: string;
  description?: string;
  /** Project template copied into every run, relative to the experiment file. */
  project: string;
  prompt?: string;
  /** File holding the prompt, relative to the experiment file. */
  promptFile?: string;
  variants: Variant[];
  runs?: number;
  /** Command run in the workspace after the agent finishes; its exit code is recorded. */
  check?: string;
  capture?: Capture;
  /** What a judge should score, one criterion per entry. */
  rubric?: string[];
  /** Files the judge should read from each workspace (globs relative to workspace). */
  artifacts?: string[];
  timeoutMinutes?: number;
}

export interface LoadedExperiment extends Experiment {
  file: string;
  projectDir: string;
  promptText: string;
}

export function loadExperiment(file: string): LoadedExperiment {
  const abs = path.resolve(file);
  const data = JSON.parse(fs.readFileSync(abs, "utf8")) as Experiment;
  const base = path.dirname(abs);
  if (!data.name || !/^[\w.-]+$/.test(data.name))
    throw new Error("experiment.name must be a slug");
  if (!data.variants?.length) throw new Error("experiment needs variants");
  const names = new Set<string>();
  for (const v of data.variants) {
    if (!/^[\w.+-]+$/.test(v.name ?? ""))
      throw new Error(
        `variant name "${v.name}" must use letters, digits, ".", "+", "-" or "_"`,
      );
    if (names.has(v.name)) throw new Error(`duplicate variant ${v.name}`);
    names.add(v.name);
  }
  const promptText =
    data.prompt ??
    (data.promptFile
      ? fs.readFileSync(path.resolve(base, data.promptFile), "utf8")
      : undefined);
  if (!promptText?.trim())
    throw new Error("experiment needs prompt or promptFile");
  const projectDir = path.resolve(base, data.project);
  if (!fs.existsSync(projectDir))
    throw new Error(`project ${data.project} not found`);
  return { ...data, file: abs, projectDir, promptText: promptText.trim() };
}

/** Bank skills an arm loads, one per logical skill. Throws on unknown refs. */
export function resolveVariant(variant: Variant, bank: string): BankSkill[] {
  const all = listBank(bank);
  const picked = new Map<string, BankSkill>();
  for (const ref of variant.skills ?? []) {
    const slash = ref.lastIndexOf("/");
    const matches = all.filter((s) =>
      slash < 0
        ? s.name === ref
        : s.category === ref.slice(0, slash) && s.name === ref.slice(slash + 1),
    );
    const first = matches[0];
    if (!first)
      throw new Error(`variant ${variant.name}: unknown skill ${ref}`);
    picked.set(first.meta.logicalId, first);
  }
  for (const category of variant.categories ?? []) {
    const matches = all.filter(
      (s) => s.category === category || s.category.startsWith(`${category}/`),
    );
    if (!matches.length)
      throw new Error(`variant ${variant.name}: empty category ${category}`);
    for (const s of matches)
      if (!picked.has(s.meta.logicalId)) picked.set(s.meta.logicalId, s);
  }
  return [...picked.values()];
}

/**
 * Copy skills into the workspace's native skill folders so every harness sees the
 * same set without routing: .claude/skills for Claude Code, .agents/skills for Codex
 * and other agents that read the shared folder.
 */
export function materializeSkills(workspace: string, skills: BankSkill[]) {
  for (const root of [".claude/skills", ".agents/skills"]) {
    for (const skill of skills) {
      const target = path.join(workspace, root, skill.name);
      fs.cpSync(skill.dir, target, {
        recursive: true,
        filter: (p) => path.basename(p) !== ".otherskill.json",
      });
    }
  }
}

export interface AgentResult {
  exitCode: number;
  durationMs: number;
  costUsd?: number;
  turns?: number;
  /** Skills the agent actually opened: Skill tool calls or reads of a SKILL.md. */
  skillsUsed: string[];
  finalText?: string;
  error?: string;
}

/** Summarize a Claude Code `--output-format stream-json` transcript. */
export function parseClaudeStream(jsonl: string): Omit<
  AgentResult,
  "exitCode" | "durationMs"
> & {
  durationMs?: number;
} {
  const used = new Set<string>();
  let costUsd: number | undefined;
  let turns: number | undefined;
  let finalText: string | undefined;
  let durationMs: number | undefined;
  let error: string | undefined;
  for (const line of jsonl.split("\n")) {
    if (!line.trim()) continue;
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }
    if (event.type === "assistant") {
      const message = event.message as { content?: unknown[] } | undefined;
      for (const block of message?.content ?? []) {
        const b = block as {
          type?: string;
          name?: string;
          input?: Record<string, unknown>;
        };
        if (b.type !== "tool_use") continue;
        if (b.name === "Skill" && typeof b.input?.skill === "string")
          used.add(b.input.skill);
        const file = b.input?.file_path ?? b.input?.path;
        if (typeof file === "string") {
          const m = file.match(/skills\/([^/]+)\/SKILL\.md$/);
          if (m?.[1]) used.add(m[1]);
        }
        const cmd = b.input?.command;
        if (typeof cmd === "string")
          for (const m of cmd.matchAll(/skills\/([\w.-]+)\/SKILL\.md/g))
            if (m[1]) used.add(m[1]);
      }
    }
    if (event.type === "result") {
      costUsd = event.total_cost_usd as number | undefined;
      turns = event.num_turns as number | undefined;
      durationMs = event.duration_ms as number | undefined;
      if (typeof event.result === "string") finalText = event.result;
      if (event.is_error) error = String(event.subtype ?? "error");
    }
  }
  return {
    costUsd,
    turns,
    durationMs,
    skillsUsed: [...used].sort(),
    finalText,
    error,
  };
}

export interface RunRecord extends AgentResult {
  variant: string;
  run: number;
  skillsLoaded: string[];
  workspace: string;
  filesChanged: number;
  linesAdded: number;
  linesRemoved: number;
  checkExitCode?: number;
  screenshot?: string;
}

const fmt = (n: number | undefined, digits = 2) =>
  n === undefined ? "-" : n.toFixed(digits);

export function renderReport(
  exp: LoadedExperiment,
  records: RunRecord[],
  meta: { harness: string; model?: string; startedAt: string; judge?: string },
): string {
  const lines = [
    `# ${exp.name}`,
    "",
    exp.description ?? "",
    "",
    `- Harness: \`${meta.harness}\`${meta.model ? ` (model \`${meta.model}\`)` : ""}`,
    `- Started: ${meta.startedAt}`,
    `- Project: \`${path.basename(exp.projectDir)}\``,
    "",
    "## Prompt",
    "",
    "```text",
    exp.promptText,
    "```",
    "",
    "## Runs",
    "",
    "| Variant | Run | Exit | Check | Time (s) | Cost ($) | Turns | Files | +/- | Skills loaded | Skills used |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ];
  for (const r of records)
    lines.push(
      `| ${r.variant} | ${r.run} | ${r.exitCode} | ${r.checkExitCode ?? "-"} | ${fmt(r.durationMs / 1000, 0)} | ${fmt(r.costUsd)} | ${r.turns ?? "-"} | ${r.filesChanged} | +${r.linesAdded}/-${r.linesRemoved} | ${r.skillsLoaded.join(", ") || "none"} | ${r.skillsUsed.join(", ") || "none"} |`,
    );
  const shots = records.filter((r) => r.screenshot);
  if (shots.length) {
    lines.push("", "## Screenshots", "");
    for (const r of shots)
      lines.push(
        `**${r.variant} #${r.run}**`,
        "",
        `![${r.variant} ${r.run}](${r.screenshot})`,
        "",
      );
  }
  if (meta.judge) lines.push("", "## Judge", "", meta.judge);
  lines.push(
    "",
    "## Workspaces",
    "",
    ...records.map((r) => `- ${r.variant} #${r.run}: \`${r.workspace}\``),
    "",
  );
  return lines.join("\n");
}
