import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

export const repoRoot = path.resolve(import.meta.dir, "..");
export const metaFile = ".otherskill.json";

export interface ManifestSkill {
  path: string;
  categories: string[];
}
export interface ManifestSource {
  repo?: string;
  ref?: string;
  local?: boolean;
  label: string;
  /** Copied from the repo when it is not the repo's root LICENSE. */
  licenseFile?: string;
  /** SPDX id the upstream declares (README or frontmatter) when it ships no license file. */
  license?: string;
  skills: ManifestSkill[];
}
export interface Manifest {
  version: 1;
  self: string;
  sources: ManifestSource[];
}
export interface Category {
  id: string;
  description: string;
}
export interface ProjectConfig {
  bankPath: string;
  categories: Category[];
  [key: string]: unknown;
}
export interface SkillMeta {
  version: 1;
  logicalId: string;
  source: string;
  ref?: string;
  revision?: string;
  category: string;
  installedAt: string;
}
export interface BankSkill {
  category: string;
  name: string;
  description: string;
  dir: string;
  meta: SkillMeta;
}

export function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

export function writeJson(file: string, data: unknown): void {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

export function loadManifest(root = repoRoot): Manifest {
  return readJson<Manifest>(path.join(root, "skillset.json"));
}

export function loadConfig(root = repoRoot): ProjectConfig {
  return readJson<ProjectConfig>(path.join(root, "otherskill.config.json"));
}

export function bankPath(root = repoRoot): string {
  return path.resolve(root, loadConfig(root).bankPath);
}

/** Problems in the manifest that would make a sync ambiguous or route to unknown categories. */
export function validateManifest(
  manifest: Manifest,
  config: ProjectConfig,
): string[] {
  const errors: string[] = [];
  const ids = new Set(config.categories.map((c) => c.id));
  const seen = new Set<string>();
  for (const source of manifest.sources) {
    if (!source.local && !/^[\w.-]+\/[\w.-]+$/.test(source.repo ?? ""))
      errors.push(`source "${source.label}" needs repo owner/name or local`);
    for (const skill of source.skills) {
      const key = `${source.repo ?? "local"}:${skill.path}`;
      if (seen.has(key)) errors.push(`duplicate skill ${key}`);
      seen.add(key);
      if (!skill.categories.length) errors.push(`${key} has no categories`);
      for (const id of skill.categories)
        if (!ids.has(id)) errors.push(`${key} uses unknown category ${id}`);
    }
  }
  return errors;
}

/** Frontmatter name and description of a skill directory. */
export function parseSkill(dir: string): { name: string; description: string } {
  const text = fs.readFileSync(path.join(dir, "SKILL.md"), "utf8");
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match?.[1]) throw new Error(`${dir}/SKILL.md has no frontmatter`);
  const data = YAML.parse(match[1]) as Record<string, unknown>;
  const name = String(data.name ?? "").trim();
  const description = String(data.description ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (!name || !description)
    throw new Error(`${dir}/SKILL.md needs name and description`);
  return { name, description };
}

/** Every skill instance in a bank: <bank>/<category...>/<slug>--<id>/SKILL.md. */
export function listBank(bank: string): BankSkill[] {
  const out: BankSkill[] = [];
  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
      const full = path.join(dir, entry.name);
      const meta = path.join(full, metaFile);
      if (fs.existsSync(meta) && fs.existsSync(path.join(full, "SKILL.md"))) {
        const skill = parseSkill(full);
        out.push({
          category: path.relative(bank, dir).split(path.sep).join("/"),
          ...skill,
          dir: full,
          meta: readJson<SkillMeta>(meta),
        });
      } else walk(full);
    }
  };
  walk(bank);
  return out.sort(
    (a, b) =>
      a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
  );
}

/** Source URL OtherSkill records for `add github:owner/repo --path <path>`. */
export function githubSource(repo: string, skillPath: string, ref?: string) {
  return `https://github.com/${repo}/tree/${ref ?? "HEAD"}/${skillPath}`;
}

export function logicalId(source: string): string {
  return createHash("sha256").update(source).digest("hex");
}

/** Bank folder name, matching OtherSkill's `<slug>--<first 16 hex of logicalId>`. */
export function folderName(name: string, id: string): string {
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .slice(0, 60) || "skill";
  return `${slug}--${id.slice(0, 16)}`;
}

/**
 * Command prefix for the OtherSkill CLI: $OTHERSKILL_BIN (may include args, e.g.
 * "bun ../other-skill/otherskill.ts"), then `otherskill` on PATH, then a sibling checkout.
 */
export function otherskillCommand(root = repoRoot): string[] {
  const env = process.env.OTHERSKILL_BIN?.trim();
  if (env) return env.split(/\s+/);
  const onPath = Bun.which("otherskill");
  if (onPath) return [onPath];
  const sibling = path.resolve(root, "../other-skill/otherskill.ts");
  if (fs.existsSync(sibling)) return [process.execPath, sibling];
  throw new Error(
    "OtherSkill CLI not found: install it (see README) or set OTHERSKILL_BIN",
  );
}

export function run(
  cmd: string[],
  options: { cwd?: string; env?: Record<string, string | undefined> } = {},
): string {
  const result = Bun.spawnSync(cmd, {
    cwd: options.cwd,
    env: { ...process.env, ...options.env },
    stdout: "pipe",
    stderr: "pipe",
  });
  if (result.exitCode !== 0)
    throw new Error(
      `${cmd.join(" ")} failed (${result.exitCode}): ${result.stderr.toString().trim() || result.stdout.toString().trim()}`,
    );
  return result.stdout.toString().trim();
}

export function argValue(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}
