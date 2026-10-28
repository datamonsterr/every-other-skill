#!/usr/bin/env bun
/**
 * Route one project (not the whole machine) to this bank.
 *
 *   bun scripts/install-project.ts <project-dir> [--agents claude,codex] [--dry-run]
 *
 * Writes <project-dir>/otherskill.config.json with an absolute bankPath to this
 * checkout and this repo's categories, then runs `otherskill setup --scope project`
 * there. An existing project config is kept: only bankPath and categories change.
 */
import fs from "node:fs";
import path from "node:path";
import {
  argValue,
  bankPath,
  loadConfig,
  otherskillCommand,
  readJson,
  writeJson,
} from "./lib.ts";

const args = process.argv.slice(2);
const dir = args.find(
  (a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"),
);
if (!dir) {
  console.error(
    "Usage: bun scripts/install-project.ts <project-dir> [--agents a,b] [--dry-run]",
  );
  process.exit(1);
}
const project = path.resolve(dir);
const file = path.join(project, "otherskill.config.json");
const existing = fs.existsSync(file)
  ? readJson<Record<string, unknown>>(file)
  : {};
const { portableHooks: _portable, ...ours } = loadConfig();
const merged: Record<string, unknown> = {
  ...ours,
  ...existing,
  bankPath: bankPath(),
  scope: "project",
  categories: ours.categories,
};
// An absolute bankPath cannot be portable, and old enabled ids may not exist any more.
delete merged.portableHooks;
delete merged.enabledCategories;
const agents =
  argValue(args, "--agents") ??
  (existing.agents as string[] | undefined)?.join(",") ??
  "claude";

console.log(`project config: ${file}`);
if (args.includes("--dry-run")) {
  console.log(JSON.stringify(merged, null, 2));
  process.exit(0);
}
if (fs.existsSync(file)) fs.copyFileSync(file, `${file}.bak-${Date.now()}`);
writeJson(file, merged);
const proc = Bun.spawnSync(
  [
    ...otherskillCommand(),
    "setup",
    "--non-interactive",
    "--scope",
    "project",
    "--agents",
    agents,
    "--cwd",
    project,
  ],
  { cwd: project, stdin: "inherit", stdout: "inherit", stderr: "inherit" },
);
process.exit(proc.exitCode ?? 1);
