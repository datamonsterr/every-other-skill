#!/usr/bin/env bun
/**
 * Make this bank the global OtherSkill bank, so every repo on the machine routes to it.
 *
 *   bun scripts/install-global.ts [--agents claude,codex] [--key-env OPENROUTER_API_KEY | --key-stdin]
 *                                 [--home DIR] [--no-setup] [--dry-run]
 *
 * Harnesses default to the ones the global config already lists, else claude.
 *
 * 1. Writes ~/.config/otherskill/otherskill.config.json with bankPath pointing at this
 *    checkout and this repo's categories. Model, limits and harnesses already in the
 *    global config are kept; the old file is backed up next to it.
 * 2. Runs `otherskill setup --scope global` to install the launcher, hooks and the
 *    companion skill, and to save the OpenRouter key privately.
 *
 * `git pull` in this checkout then updates the skills every harness sees.
 */
import fs from "node:fs";
import os from "node:os";
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
const home = path.resolve(argValue(args, "--home") ?? os.homedir());
const dryRun = args.includes("--dry-run");
const file = path.join(home, ".config/otherskill/otherskill.config.json");

const ours = loadConfig();
const existing = fs.existsSync(file)
  ? readJson<Record<string, unknown>>(file)
  : {};
const bank = bankPath();
const agents =
  argValue(args, "--agents") ??
  (existing.agents as string[] | undefined)?.join(",") ??
  "claude";
const previousBank = existing.bankPath as string | undefined;
const { portableHooks: _portable, ...base } = ours;
const merged: Record<string, unknown> = {
  ...base,
  ...existing,
  bankPath: bank,
  scope: "global",
  categories: ours.categories,
};
// Enabled categories from an older taxonomy would reference ids that no longer exist.
const ids = new Set(ours.categories.map((c) => c.id));
const enabled = existing.enabledCategories as string[] | undefined;
if (enabled?.some((id) => !ids.has(id))) delete merged.enabledCategories;
const hookParams = existing.hookParams as Record<string, unknown> | undefined;
if (hookParams?.categories) {
  const { categories: _c, ...rest } = hookParams;
  merged.hookParams = rest;
}

console.log(`global config: ${file}`);
console.log(`bank:          ${bank}`);
if (previousBank && path.resolve(home, previousBank) !== bank)
  console.log(
    `note: the previous global bank (${previousBank}) is no longer routed. Move skills you still want with\n` +
      `      otherskill add <skill-dir> --category <id> --scope project --cwd ${path.resolve(bank, "../..")}`,
  );
if (dryRun) {
  console.log(JSON.stringify(merged, null, 2));
  process.exit(0);
}

fs.mkdirSync(path.dirname(file), { recursive: true });
if (fs.existsSync(file)) fs.copyFileSync(file, `${file}.bak-${Date.now()}`);
writeJson(file, merged);

if (args.includes("--no-setup")) process.exit(0);
const key = args.includes("--key-stdin")
  ? ["--key-stdin"]
  : argValue(args, "--key-env")
    ? ["--key-env", argValue(args, "--key-env") as string]
    : process.env.OPENROUTER_API_KEY
      ? ["--key-env", "OPENROUTER_API_KEY"]
      : [];
const proc = Bun.spawnSync(
  [
    ...otherskillCommand(),
    "setup",
    "--non-interactive",
    "--scope",
    "global",
    "--agents",
    agents,
    "--home",
    home,
    "--cwd",
    home,
    ...key,
  ],
  { stdin: "inherit", stdout: "inherit", stderr: "inherit" },
);
if (proc.exitCode !== 0) process.exit(proc.exitCode ?? 1);
if (!key.length)
  console.log(
    "\nNo OpenRouter key saved. Export OPENROUTER_API_KEY or rerun with --key-stdin.",
  );
console.log("\nCheck it: otherskill doctor && otherskill doctor --live");
