import { expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { parseSkill, repoRoot } from "../scripts/lib.ts";

interface EvalConfig {
  schema_version: string;
  skills: Array<{ source: string; path: string; target: string }>;
  engine: { name: string };
  cases: { files: string[] };
}

const examples = fs
  .readdirSync(path.join(repoRoot, "examples"), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => path.join(repoRoot, "examples", d.name));

const configs = (example: string) =>
  fs
    .readdirSync(path.join(example, "evals"))
    .filter((f) => f.endsWith(".yaml"))
    .map((f) => path.join(example, "evals", f));

test("there is an example per skill set", () => {
  expect(examples.map((e) => path.basename(e)).sort()).toEqual([
    "architecture",
    "landing-page",
    "mobile-app",
    "product-discovery",
    "techstack",
    "web-app",
  ]);
});

for (const example of examples) {
  const name = path.basename(example);

  test(`${name}: rubric is defined with criteria and every variant`, () => {
    const rubric = fs.readFileSync(
      path.join(example, "evals/rubric.md"),
      "utf8",
    );
    expect(rubric).toContain("## Criteria (0-10 each)");
    expect(rubric).toMatch(/\n1\. \S/);
    for (const file of configs(example))
      expect(rubric).toContain(`| \`${path.basename(file, ".yaml")}\` |`);
  });

  test(`${name}: has a baseline and at least one skill variant`, () => {
    const names = configs(example).map((f) => path.basename(f, ".yaml"));
    expect(names).toContain("baseline");
    expect(names.length).toBeGreaterThan(1);
  });

  for (const file of configs(example)) {
    test(`${name}/${path.basename(file)}: skill-up config resolves`, () => {
      const config = YAML.parse(fs.readFileSync(file, "utf8")) as EvalConfig;
      expect(config.schema_version).toBe("v1alpha1");
      expect(config.engine.name).toBe("claude_code");
      for (const skill of config.skills) {
        expect(skill.source).toBe("local_path");
        const dir = path.resolve(example, skill.path);
        expect(fs.existsSync(path.join(dir, "SKILL.md"))).toBe(true);
        // Installed under its frontmatter name, not the bank folder's hashed name.
        expect(skill.target).toBe(`.claude/skills/${parseSkill(dir).name}`);
      }
      for (const caseFile of config.cases.files) {
        const c = YAML.parse(
          fs.readFileSync(path.join(example, caseFile), "utf8"),
        );
        expect(fs.existsSync(path.join(example, c.context.repo_fixture))).toBe(
          true,
        );
        expect(c.input.prompt.trim().length).toBeGreaterThan(0);
        if (c.judge.type === "script")
          expect(fs.existsSync(path.join(example, c.judge.script_path))).toBe(
            true,
          );
      }
    });
  }
}
