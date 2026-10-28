# Experiment: product-discovery

**Question:** Do product discovery skills produce sharper problem framing and testable assumptions than the model alone?

The rubric below was fixed before any run. Do not change it after seeing outputs; write a new experiment instead.

## Variants

One skill-up config per variant in this folder; every variant runs the same case on the same project.

| Config | Skills installed |
| --- | --- |
| `baseline` | none |
| `discovery-category` | 13 skills: `brainstorm-experiments-new`, `brainstorming`, `competitor-analysis`, `customer-journey-map`, `grill-me`, `in-your-own-words`, `lean-canvas`, `market-research`, `market-sizing`, `opportunity-solution-tree`, `product-lens`, `user-personas`, `value-proposition` |
| `pm-skills` | `brainstorm-experiments-new`, `opportunity-solution-tree`, `user-personas` |
| `product-lens` | `product-lens` |

## How to judge

Score every candidate 0-10 on each criterion and pass or fail each assertion, blind to the variant.

## Task

```text
Read BRIEF.md. Before anything gets built, do product discovery for this idea and write DISCOVERY.md covering:

- who the users are and what each is trying to get done
- the problems worth solving, ranked, with evidence from the brief or clearly marked assumptions
- the riskiest assumptions and a cheap way to test each one this week
- what a first version should and should not include

Do not write code.
```

## Criteria (0-10 each)

1. Users and their jobs are specific to this shop, not generic personas
2. Problems are ranked and separated from solutions
3. Assumptions are explicit and each has a cheap, concrete test
4. First-version scope is small and justified
5. Facts from the brief are not contradicted or invented

## Assertions (pass/fail)

- `DISCOVERY.md` exists in the workspace
- Uses only facts and packages given in the project
