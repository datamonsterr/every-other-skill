#!/usr/bin/env bun
/**
 * Rebuild the bank in .otherskill/bank from skillset.json.
 *
 * Each source repo is cloned once, each skill is copied with `otherskill add <dir>`
 * (so OtherSkill validates it and writes the bank layout), then its provenance is
 * rewritten to the upstream GitHub URL, exactly as `otherskill add github:...` would
 * record it. Root licenses are copied next to every SKILL.md.
 *
 *   bun scripts/sync.ts                  # full rebuild
 *   bun scripts/sync.ts --only taste     # skills whose repo or path contains "taste"
 *   bun scripts/sync.ts --dry-run        # print the plan
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  argValue,
  folderName,
  githubSource,
  listBank,
  loadConfig,
  loadManifest,
  logicalId,
  type ManifestSkill,
  type ManifestSource,
  metaFile,
  otherskillCommand,
  parseSkill,
  readJson,
  repoRoot,
  run,
  type SkillMeta,
  validateManifest,
  writeJson,
} from "./lib.ts";

const args = process.argv.slice(2);
const only = argValue(args, "--only");
const dryRun = args.includes("--dry-run");
const manifest = loadManifest();
const config = loadConfig();
const bank = path.resolve(repoRoot, config.bankPath);

const errors = validateManifest(manifest, config);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const selected = (source: ManifestSource, skill: ManifestSkill) =>
  !only || `${source.repo ?? "local"}/${skill.path}`.includes(only);
const plan = manifest.sources
  .map((source) => ({
    source,
    skills: source.skills.filter((s) => selected(source, s)),
  }))
  .filter((p) => p.skills.length);

if (dryRun) {
  for (const { source, skills } of plan)
    for (const s of skills)
      console.log(
        `${source.repo ?? "local"}  ${s.path}  ->  ${s.categories.join(", ")}`,
      );
  process.exit(0);
}

const cli = otherskillCommand();
const work = fs.mkdtempSync(path.join(os.tmpdir(), "every-other-skill-sync-"));
const home = path.join(work, "home");
fs.mkdirSync(home);

// Keep installedAt stable for unchanged revisions so re-syncs produce clean diffs.
const previous = new Map(
  listBank(bank).map((s) => [`${s.meta.logicalId}:${s.category}`, s.meta]),
);

const sourceUrl = (source: ManifestSource, skillPath: string) =>
  source.local
    ? `${manifest.self}/${skillPath}`
    : githubSource(source.repo as string, skillPath, source.ref);

function checkout(source: ManifestSource): { dir: string; revision?: string } {
  if (source.local) return { dir: repoRoot };
  const dir = path.join(work, (source.repo as string).replace("/", "__"));
  run([
    "git",
    "clone",
    "--quiet",
    "--depth",
    "1",
    ...(source.ref ? ["--branch", source.ref] : []),
    `https://github.com/${source.repo}`,
    dir,
  ]);
  return { dir, revision: run(["git", "rev-parse", "HEAD"], { cwd: dir }) };
}

function licenses(root: string, source: ManifestSource): string[] {
  const files = fs
    .readdirSync(root)
    .filter((n) => /^(LICENSE|LICENCE|COPYING|NOTICE)(\..*)?$/i.test(n))
    .map((n) => path.join(root, n));
  if (source.licenseFile) files.push(path.join(root, source.licenseFile));
  return files.filter((f) => fs.statSync(f).isFile());
}

/** Remove every bank copy whose provenance points at `source`. */
function removeFromBank(url: string) {
  for (const s of listBank(bank))
    if (s.meta.source === url) fs.rmSync(s.dir, { recursive: true });
}

function importSkill(
  source: ManifestSource,
  skill: ManifestSkill,
  checkoutDir: string,
  revision: string | undefined,
) {
  const dir = path.join(checkoutDir, skill.path);
  const { name } = parseSkill(dir);
  const url = sourceUrl(source, skill.path);
  removeFromBank(url);
  run(
    [
      ...cli,
      "add",
      dir,
      ...skill.categories.flatMap((c) => ["--category", c]),
      "--scope",
      "project",
      "--cwd",
      repoRoot,
      "--home",
      home,
    ],
    { env: { OTHERSKILL_CONFIG: undefined, OPENROUTER_API_KEY: undefined } },
  );
  const local = `file://${fs.realpathSync(dir)}`;
  const id = logicalId(url);
  const extra = licenses(checkoutDir, source);
  for (const copy of listBank(bank).filter((s) => s.meta.source === local)) {
    const key = `${id}:${copy.category}`;
    const prior = previous.get(key);
    const meta: SkillMeta = {
      version: 1,
      logicalId: id,
      source: url,
      ref: source.local ? "main" : (source.ref ?? "HEAD"),
      revision,
      category: copy.category,
      installedAt:
        prior && prior.revision === revision
          ? prior.installedAt
          : copy.meta.installedAt,
    };
    if (!revision) delete meta.revision;
    writeJson(path.join(copy.dir, metaFile), meta);
    for (const file of extra) {
      const target = path.join(copy.dir, path.basename(file));
      if (!fs.existsSync(target)) fs.copyFileSync(file, target);
    }
    const hasLicense = fs
      .readdirSync(copy.dir)
      .some((n) => /^(LICENSE|LICENCE|COPYING)/i.test(n));
    if (!hasLicense && source.license)
      fs.writeFileSync(
        path.join(copy.dir, "LICENSE-NOTE.md"),
        `${source.repo} declares the ${source.license} license in its README but ships no license file.\nSource: ${url}\n`,
      );
    const target = path.join(path.dirname(copy.dir), folderName(name, id));
    if (target !== copy.dir) {
      fs.rmSync(target, { recursive: true, force: true });
      fs.renameSync(copy.dir, target);
    }
  }
  console.log(`  ${name}  ->  ${skill.categories.join(", ")}`);
}

const backup = `${bank}.backup-${Date.now()}`;
try {
  if (!only && fs.existsSync(bank)) fs.renameSync(bank, backup);
  fs.mkdirSync(bank, { recursive: true });
  for (const { source, skills } of plan) {
    console.log(`${source.label} (${source.repo ?? "local"})`);
    const { dir, revision } = checkout(source);
    for (const skill of skills) importSkill(source, skill, dir, revision);
  }
  fs.rmSync(backup, { recursive: true, force: true });
} catch (error) {
  if (!only && fs.existsSync(backup)) {
    fs.rmSync(bank, { recursive: true, force: true });
    fs.renameSync(backup, bank);
    console.error("sync failed; previous bank restored");
  }
  throw error;
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}

// skills.lock.json: one row per logical skill, for review and the README table.
const rows = new Map<
  string,
  {
    name: string;
    description: string;
    categories: string[];
    source: string;
    revision?: string;
  }
>();
for (const s of listBank(bank)) {
  const row = rows.get(s.meta.logicalId) ?? {
    name: s.name,
    description: s.description,
    categories: [],
    source: s.meta.source,
    revision: s.meta.revision,
  };
  row.categories.push(s.category);
  rows.set(s.meta.logicalId, row);
}
const lock = [...rows.values()].sort((a, b) => a.name.localeCompare(b.name));
writeJson(path.join(repoRoot, "skills.lock.json"), lock);

// README table between markers.
const readme = path.join(repoRoot, "README.md");
if (fs.existsSync(readme)) {
  const text = fs.readFileSync(readme, "utf8");
  const start = "<!-- skills:start -->";
  const end = "<!-- skills:end -->";
  const i = text.indexOf(start);
  const j = text.indexOf(end);
  if (i >= 0 && j > i) {
    const sections = config.categories.map((c) => {
      const skills = listBank(bank).filter((s) => s.category === c.id);
      const lines = skills.map((s) => {
        const repo = s.meta.source.match(/github\.com\/([^/]+\/[^/]+)/)?.[1];
        return `| \`${s.name}\` | [${repo}](${s.meta.source}) |`;
      });
      return `### \`${c.id}\` (${skills.length})\n\n${c.description}.\n\n| Skill | Source |\n| --- | --- |\n${lines.join("\n")}\n`;
    });
    fs.writeFileSync(
      readme,
      `${text.slice(0, i + start.length)}\n\n${sections.join("\n")}\n${text.slice(j)}`,
    );
  }
}
const total = readJson<unknown[]>(path.join(repoRoot, "skills.lock.json"));
console.log(`\n${total.length} skills in ${path.relative(repoRoot, bank)}`);
