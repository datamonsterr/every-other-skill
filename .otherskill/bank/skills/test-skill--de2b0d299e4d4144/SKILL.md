---
name: test-skill
description: A/B test agent skills and skill sets in every-other-skill. The rubric comes first, skill-up runs every variant without supervision, then skill-ab-eval judges the outputs blind in the same session. Use when asked whether a skill helps, to compare a skill with no skill or with another skill (for example frontend-design with and without design-taste-frontend), to benchmark a category, or to decide which skills stay in the bank.
---

# Test a skill

One experiment answers one question: **does this skill set change the result for this kind of task, and is the change better?** Every variant runs the same case on the same project. Only the installed skills differ.

Tools (do not reimplement them):

- [skill-up](https://github.com/alibaba/skill-up) runs the variants: a fresh workspace per run, skills installed into `.claude/skills`, Claude Code headless with hooks disabled, workspace files collected. The `skill-upper` skill has the full reference.
- [skill-ab-eval](https://github.com/cskwork/skill-ab-eval) judges the outputs. Use its agent-native protocol: fresh, blind judge subagents with neutral labels.

## 1. Write the rubric first

Before any run, create `examples/<example>/evals/rubric.md` and commit it. Never edit it after you have seen outputs; if it was wrong, write a new experiment.

- **Question**: one sentence.
- **Variants**: a table with `baseline` (no skills) and 1–4 skill sets.
- **Task**: the exact prompt. It must not name the skill or use its vocabulary.
- **Criteria (0–10 each)**: 3–6 qualities a reviewer can judge from the output alone.
- **Assertions (pass/fail)**: atomic, checkable claims, for example "`index.html` exists" or "`bun run build` exits 0".

## 2. Write the skill-up suite

In `examples/<example>/`:

- `project/`: the starting files. Keep them small, with no hints.
- `evals/cases/<case>.yaml`: `input.prompt` (the task from the rubric), `context.repo_fixture: project`, `expect` gates, and a `judge` (`rule_based` on exit code, or `script` for a build or typecheck).
- `evals/<variant>.yaml`, one per variant: `skills: []` for the baseline; otherwise one `local_path` entry per bank skill, with `target: .claude/skills/<skill-name>`. Copy an existing example and change only `skills`. Set `collect_artifacts` to the files the judge needs.

Find skill paths with `bun run list --json`. Check the suite:

```sh
bun test                                    # configs resolve against the bank
for f in examples/<example>/evals/*.yaml; do skill-up validate "$f"; done
```

## 3. Run everything without supervision

Same model for every variant, two or more iterations each. Run it in the background and do not stop between variants:

```sh
ex=examples/<example>; model=sonnet
for f in $ex/evals/*.yaml; do
  v=$(basename "$f" .yaml)
  skill-up run "$f" --model "$model" --iteration 2 --output-dir ".sandbox/$(basename $ex)/$v" || true
done
```

`|| true` keeps the loop going when a variant fails its gates; a failure is a result. Each run writes `result.json`, a transcript, and the collected files under `.sandbox/<example>/<variant>/iteration-N/`. Find the files with `find .sandbox/<example> -path '*outputs/workspace*' -type f`.

## 4. Judge blind in this session

Load the `skill-ab-eval` skill and follow its agent-native judge protocol. Use the rubric exactly as written in step 1:

1. For each iteration, collect each variant's `outputs/workspace` tree. Copy them into a scratch folder as `candidate-A`, `candidate-B`, and so on, in random order. Keep the label-to-variant map to yourself.
2. Spawn one fresh judge subagent per iteration. Give it the task, the criteria and the assertions from `rubric.md`, and the candidate folders. Nothing else: no variant names, transcripts or skill names. With more than two candidates, use independent per-output grading. For visual work, the judge may render pages with Playwright (`require('playwright')`) and look at the screenshots.
3. The judge returns strict JSON: per candidate, `assertions: [bool]`, `scores: {criterion: 0-10}` and a one-line note. For close calls, judge again with the order shuffled and average the two.
4. Unblind. Per variant: assertion pass rate, mean normalized score (sum of criteria divided by 10 × number of criteria), and the skill-up gate result from `result.json`.
5. Lift = variant − baseline. Read it with skill-ab-eval's verdict table: ≥ +0.20 clear positive, +0.05 to +0.20 marginal, ±0.05 no measurable effect, ≤ −0.05 negative.

Also check whether each skill was used: search the transcripts for the skill name, a `Skill` tool call, or a read of its `SKILL.md`. If a variant never opened its skill, its score says nothing about that skill.

## 5. Record the verdict

Append to `examples/<example>/RESULTS.md`: date, model, iterations, a table of variants with pass rate, score, lift, cost and time, and one verdict per skill:

- **keep**: clear positive lift; the skill stays in its category.
- **narrow**: helps only on some tasks; tighten its description or move it in `skillset.json`.
- **drop**: no effect or negative; remove it from `skillset.json` and run `bun run sync`.

Report raw numbers and the sample size. Two iterations show a direction, not statistical significance.
