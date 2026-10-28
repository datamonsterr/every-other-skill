# Experiment: architecture

**Question:** Matt Pocock's design skills vs ECC's architecture skills vs none, on the same sync design task.

The rubric below was fixed before any run. Do not change it after seeing outputs; write a new experiment instead.

## Variants

One skill-up config per variant in this folder; every variant runs the same case on the same project.

| Config | Skills installed |
| --- | --- |
| `architecture-category` | 11 skills: `api-design`, `architect`, `architecture-decision-records`, `backend-patterns`, `codebase-design`, `contract-first`, `domain-modeling`, `grill-with-docs`, `hexagonal-architecture`, `improve-codebase-architecture`, `principle-foundational-thinking` |
| `baseline` | none |
| `ecc` | `api-design`, `architecture-decision-records`, `hexagonal-architecture` |
| `pocock` | `codebase-design`, `domain-modeling` |

## How to judge

Score every candidate 0-10 on each criterion and pass or fail each assertion, blind to the variant.

## Task

```text
Read SPEC.md and design the system architecture for this feature. Write docs/ARCHITECTURE.md (modules, their responsibilities and interfaces, data model, sync protocol, failure handling) and record each significant decision as an ADR under docs/adr/. Do not write implementation code.
```

## Criteria (0-10 each)

1. Idempotency and exactly-once counting are handled concretely (ids, dedupe, retries)
2. Module boundaries are few, deep and justified for a part-time maintainer
3. Data model records the price actually charged and handles concurrent tills
4. ADRs state context, options considered and consequences
5. No over-engineering beyond the spec

## Assertions (pass/fail)

- `docs/ARCHITECTURE.md` exists in the workspace
- Uses only facts and packages given in the project
