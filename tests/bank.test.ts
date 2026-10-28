import { expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import {
  bankPath,
  githubSource,
  listBank,
  loadConfig,
  loadManifest,
  repoRoot,
  validateManifest,
} from "../scripts/lib.ts";

const manifest = loadManifest();
const config = loadConfig();
const bank = listBank(bankPath());

test("manifest references only configured categories", () => {
  expect(validateManifest(manifest, config)).toEqual([]);
});

test("every manifest skill is in the bank under each of its categories", () => {
  for (const source of manifest.sources)
    for (const skill of source.skills) {
      const url = source.local
        ? `${manifest.self}/${skill.path}`
        : githubSource(source.repo as string, skill.path, source.ref);
      const copies = bank.filter((s) => s.meta.source === url);
      expect(copies.map((c) => c.category).sort()).toEqual(
        [...skill.categories].sort(),
      );
    }
});

test("bank holds nothing the manifest does not list", () => {
  const count = manifest.sources.reduce(
    (n, s) => n + s.skills.reduce((m, k) => m + k.categories.length, 0),
    0,
  );
  expect(bank.length).toBe(count);
});

test("skill names are unique so routing and sandbox refs are unambiguous", () => {
  const byName = new Map<string, Set<string>>();
  for (const s of bank)
    byName.set(s.name, (byName.get(s.name) ?? new Set()).add(s.meta.logicalId));
  const dupes = [...byName].filter(([, ids]) => ids.size > 1).map(([n]) => n);
  expect(dupes).toEqual([]);
});

test("every category the hook can route to has skills", () => {
  for (const c of config.categories)
    expect(bank.some((s) => s.category === c.id)).toBe(true);
});

test("every bank skill carries license information", () => {
  const missing = bank.filter((s) => {
    const files = fs.readdirSync(s.dir);
    if (files.some((f) => /^(LICENSE|LICENCE|COPYING)/i.test(f))) return false;
    return !/^license:/m.test(
      fs.readFileSync(path.join(s.dir, "SKILL.md"), "utf8"),
    );
  });
  expect(missing.map((s) => s.dir)).toEqual([]);
});

test("bank stays outside native skill discovery", () => {
  const rel = path.relative(repoRoot, bankPath());
  expect(rel).not.toMatch(/(^|\/)\.(claude|agents|codex|opencode)\//);
  expect(fs.existsSync(path.join(repoRoot, ".claude/skills"))).toBe(false);
});

test("skills.lock.json matches the bank", () => {
  const lock = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "skills.lock.json"), "utf8"),
  ) as Array<{ source: string }>;
  expect(lock.length).toBe(new Set(bank.map((s) => s.meta.logicalId)).size);
});
