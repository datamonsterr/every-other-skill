import { expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { bankPath, repoRoot } from "../scripts/lib.ts";
import {
  loadExperiment,
  materializeSkills,
  parseClaudeStream,
  resolveVariant,
} from "../sandbox/lib.ts";

const bank = bankPath();
const experiments = [
  ...new Bun.Glob("examples/*/experiments/*.json").scanSync({ cwd: repoRoot }),
];

test("there is an experiment for each skill set", () => {
  const projects = new Set(experiments.map((e) => e.split("/")[1]));
  for (const p of [
    "product-discovery",
    "landing-page",
    "architecture",
    "techstack",
    "web-app",
    "mobile-app",
  ])
    expect(projects.has(p)).toBe(true);
});

test("every example experiment loads and resolves its skills", () => {
  for (const file of experiments) {
    const exp = loadExperiment(path.join(repoRoot, file));
    for (const v of exp.variants) resolveVariant(v, bank);
  }
});

test("resolveVariant picks by name, category ref and category prefix", () => {
  expect(
    resolveVariant({ name: "a", skills: ["design-taste-frontend"] }, bank).map(
      (s) => s.name,
    ),
  ).toEqual(["design-taste-frontend"]);
  expect(
    resolveVariant({ name: "b", skills: ["testing/tdd"] }, bank).map(
      (s) => s.name,
    ),
  ).toEqual(["tdd"]);
  const techstack = resolveVariant(
    { name: "c", categories: ["techstack"] },
    bank,
  );
  expect(techstack.some((s) => s.category === "techstack/rust")).toBe(true);
  expect(() => resolveVariant({ name: "d", skills: ["nope"] }, bank)).toThrow(
    /unknown skill/,
  );
});

test("a skill in two categories loads once", () => {
  const skills = resolveVariant(
    { name: "x", categories: ["skills", "testing"] },
    bank,
  );
  expect(skills.filter((s) => s.name === "test-skill").length).toBe(1);
});

test("materializeSkills writes native copies without provenance", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "eos-test-"));
  materializeSkills(dir, resolveVariant({ name: "m", skills: ["tdd"] }, bank));
  for (const root of [".claude/skills", ".agents/skills"]) {
    expect(fs.existsSync(path.join(dir, root, "tdd/SKILL.md"))).toBe(true);
    expect(fs.existsSync(path.join(dir, root, "tdd/.otherskill.json"))).toBe(
      false,
    );
  }
  fs.rmSync(dir, { recursive: true });
});

test("parseClaudeStream reports skills used, cost and turns", () => {
  const lines = [
    {
      type: "assistant",
      message: {
        content: [{ type: "tool_use", name: "Skill", input: { skill: "tdd" } }],
      },
    },
    {
      type: "assistant",
      message: {
        content: [
          {
            type: "tool_use",
            name: "Read",
            input: { file_path: "/w/.claude/skills/frontend-design/SKILL.md" },
          },
        ],
      },
    },
    {
      type: "assistant",
      message: {
        content: [
          {
            type: "tool_use",
            name: "Bash",
            input: { command: "cat .agents/skills/seo/SKILL.md" },
          },
        ],
      },
    },
    {
      type: "result",
      total_cost_usd: 0.42,
      num_turns: 7,
      duration_ms: 1000,
      result: "done",
    },
  ];
  const parsed = parseClaudeStream(
    lines.map((l) => JSON.stringify(l)).join("\n"),
  );
  expect(parsed.skillsUsed).toEqual(["frontend-design", "seo", "tdd"]);
  expect(parsed.costUsd).toBe(0.42);
  expect(parsed.turns).toBe(7);
  expect(parsed.finalText).toBe("done");
});

test("sandbox runs every variant end to end with the fake harness", () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "eos-sandbox-"));
  const proc = Bun.spawnSync(
    [
      process.execPath,
      "sandbox/run.ts",
      "examples/landing-page/experiments/taste.json",
      "--harness",
      "fake",
      "--runs",
      "1",
      "--out",
      out,
    ],
    {
      cwd: repoRoot,
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: "/nonexistent" },
    },
  );
  expect(proc.exitCode).toBe(0);
  const [results] = [...new Bun.Glob("**/results.json").scanSync({ cwd: out })];
  expect(results).toBeDefined();
  const data = JSON.parse(
    fs.readFileSync(path.join(out, results as string), "utf8"),
  );
  expect(data.records.map((r: { variant: string }) => r.variant)).toEqual([
    "baseline",
    "frontend-design",
    "frontend-design+taste",
    "taste",
  ]);
  for (const r of data.records) {
    expect(r.skillsUsed).toEqual([...r.skillsLoaded].sort());
    expect(r.filesChanged).toBe(1);
  }
  expect(
    fs.existsSync(path.join(out, path.dirname(results as string), "report.md")),
  ).toBe(true);
  fs.rmSync(out, { recursive: true });
}, 60_000);
