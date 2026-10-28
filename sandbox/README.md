# Sandbox

Run one prompt against one project with several skill sets and compare the results.

```sh
bun sandbox/run.ts <experiment.json> [options]
```

| Option                          | Effect                                                                |
| ------------------------------- | --------------------------------------------------------------------- |
| `--dry-run`                     | resolve variants and print each skill set; no agent runs              |
| `--variants a,b`                | run only these variants                                               |
| `--runs N`                      | repetitions per variant (default: experiment `runs`, else 1)          |
| `--parallel N`                  | concurrent runs (default 1)                                           |
| `--harness claude\|codex\|fake` | agent CLI (default `claude`); `fake` is an offline stand-in for tests |
| `--model M`                     | model for every variant                                               |
| `--isolated-config`             | fresh `CLAUDE_CONFIG_DIR` per variant (needs `ANTHROPIC_API_KEY`)     |
| `--judge`, `--judge-model M`    | blind comparison by Claude after all runs                             |
| `--out DIR`                     | output root (default `.sandbox/`, git-ignored)                        |

## What a run does

For every variant and repetition:
1. Copies the experiment's `project` to `.sandbox/<experiment>/<timestamp>/<variant>-<n>/workspace`.
2. Copies the variant's bank skills to `workspace/.claude/skills/<name>` and `workspace/.agents/skills/<name>` (no routing, so every repetition sees exactly the same skills), then commits a git baseline.
3. Runs the agent with the prompt. Claude Code runs with `--setting-sources project`, so user-level hooks (such as a global OtherSkill router), user skills and memory stay out of the comparison; the transcript goes to `transcript.jsonl`.
4. Runs `check` (exit code in the report), saves `diff.patch` and diff stats, and captures a screenshot of `capture.file` or `capture.url` when Playwright is installed.

Then it writes `results.json` and `report.md`. "Skills used" comes from the transcript (Skill tool calls and reads of a `SKILL.md`): an arm that never opened its skill tells you nothing about that skill.

## Experiment file

```jsonc
{
  "name": "landing-taste", // output folder name
  "description": "...",
  "project": "../project", // relative to this file
  "promptFile": "../prompts/landing.md", // or "prompt": "..."
  "variants": [
    { "name": "baseline", "skills": [] },
    { "name": "taste", "skills": ["design-taste-frontend"] }, // bank skill names
    { "name": "web", "categories": ["web"] }, // whole category (prefix match)
    { "name": "tdd", "skills": ["testing/tdd"] } // category/name when ambiguous
  ],
  "runs": 2,
  "check": "bun install --silent && bun run build",
  "capture": { "file": "index.html" }, // or { "url": "http://localhost:4173", "start": "bunx vite --port 4173" }
  "artifacts": ["**/*.html", "**/*.css"], // what the judge reads
  "rubric": ["Distinct visual direction", "Accessibility"],
  "timeoutMinutes": 30
}
```

## Isolation

The default local run is fair between variants but shares your machine's Claude Code login and installed tools. For a clean room use the container, which has Bun, Git, Claude Code, Codex and Chromium and a fresh home directory:

```sh
export CLAUDE_CODE_OAUTH_TOKEN=...   # `claude setup-token`, or ANTHROPIC_API_KEY
sandbox/docker.sh examples/landing-page/experiments/taste.json --runs 2 --judge
```

Results land in `.sandbox/` of the mounted repo.

## Fair comparisons

- Same model, same project, same prompt; change only the skills.
- Never name the skill or its vocabulary in the prompt.
- Two or more runs per variant; agents vary run to run.
- Read the screenshots and diffs yourself before trusting the judge.
