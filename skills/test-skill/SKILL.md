---
name: test-skill
description: A/B test agent skills and skill sets in the every-other-skill sandbox. Use when asked whether a skill helps, to compare a skill against no skill or against another skill (for example frontend-design with and without design-taste-frontend), to benchmark a category's skill set, to decide which skills to keep in the bank, or to write an experiment JSON for sandbox/run.ts.
---

# Test a skill

Answer one question per experiment: **does this skill set change the result for this kind of prompt, and is the change better?** Run the same prompt on the same project once per variant; only the visible skills differ.

## 1. Frame the question

Write it down before touching files:

- **Skill under test** and the **control** (usually `baseline`, no skills).
- **Prompt**: one realistic task where the skill should matter. Do not mention the skill or its vocabulary in the prompt; that leaks the answer to the control.
- **What better means**: 3–6 rubric criteria a reviewer can score from the output alone.

A good experiment has 2–4 variants:

| Variant | Purpose |
| --- | --- |
| `baseline` | no skills: what the model does on its own |
| `<skill>` | the skill under test alone |
| `<other>` | the closest competing skill, if one exists |
| `<skill>+<other>` or `category` | whether they stack, or what the whole category does |

## 2. Pick or create the project

Projects live in `examples/<name>/project/`. Reuse one when it fits; otherwise copy the closest and trim it. Keep projects tiny and dependency-free where possible so runs are fast and fair. Never put hints about the expected answer in the project.

## 3. Write the experiment

`examples/<name>/experiments/<question>.json`:

```json
{
  "name": "landing-taste",
  "description": "Does design-taste-frontend beat frontend-design on a landing page?",
  "project": "../project",
  "promptFile": "../prompts/landing.md",
  "variants": [
    { "name": "baseline", "skills": [] },
    { "name": "frontend-design", "skills": ["frontend-design"] },
    { "name": "taste", "skills": ["design-taste-frontend"] },
    { "name": "both", "skills": ["frontend-design", "design-taste-frontend"] }
  ],
  "runs": 2,
  "capture": { "file": "index.html" },
  "artifacts": ["**/*.html", "**/*.css", "**/*.md"],
  "rubric": ["Distinct visual direction, not a template", "Typography and hierarchy", "Copy is specific to the product", "Responsive and accessible"]
}
```

- `skills` takes bank skill names (`bun run list`), or `category/name` when a name is ambiguous.
- `categories` loads every skill in a category (prefix match).
- `check` runs a command after the agent (tests, build, lint) and records its exit code.
- `capture` screenshots `file` or a `url` served by `start` (needs Playwright).

Dry-run first; it resolves every skill and fails on typos:

```sh
bun sandbox/run.ts examples/<name>/experiments/<question>.json --dry-run
```

## 4. Run

```sh
bun sandbox/run.ts examples/<name>/experiments/<question>.json --runs 2 --judge
```

- Use `--runs 2` or more: one run per variant is an anecdote.
- `--model` pins the model for every variant; never compare across models.
- `--isolated-config` gives each variant a fresh `CLAUDE_CONFIG_DIR` (needs `ANTHROPIC_API_KEY`), so no user memory or plugins leak in. For full isolation run inside the sandbox container (`sandbox/README.md`).
- `--harness fake` checks the pipeline offline.

## 5. Read the report

Open `.sandbox/<name>/<timestamp>/report.md`:

1. **Skills used**: if the arm never opened the skill, the result says nothing about the skill. Fix the description or prompt, not the verdict.
2. **Check / exit codes**: a failing build beats any rubric score.
3. **Judge table**: blind scores from `--judge`. Spot-check by opening the screenshots and diffs yourself; judges favor longer output.
4. **Cost and time**: a skill that doubles cost for a small gain may not belong in the default category.

## 6. Record the verdict

Append to `examples/<name>/RESULTS.md`: date, model, variants, runs, median scores, and one of:

- **keep**: clear win, the skill stays in its category.
- **narrow**: wins only on some prompts; tighten its description or move it to a narrower category in `skillset.json`.
- **drop**: no difference or worse; remove it from `skillset.json` and run `bun run sync`.

Change one thing at a time and rerun the same experiment after any description or bank change.
