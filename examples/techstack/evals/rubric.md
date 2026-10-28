# Experiment: techstack

**Question:** Do research-first and stack skills lead to better justified, verified stack choices?

The rubric below was fixed before any run. Do not change it after seeing outputs; write a new experiment instead.

## Variants

One skill-up config per variant in this folder; every variant runs the same case on the same project.

| Config | Skills installed |
| --- | --- |
| `baseline` | none |
| `research-first` | `prototype`, `research`, `search-first` |
| `techstack-category` | 20 skills: `axum`, `bun-api`, `bun-cli`, `coding-guidelines`, `database-migrations`, `deployment-patterns`, `docker-patterns`, `domain-cli`, `domain-web`, `m06-error-handling`, `m07-concurrency`, `mcp-builder`, `openrouter`, `postgres-patterns`, `prototype`, `research`, `rusqlite`, `rust-patterns`, `search-first`, `typescript-best-practices` |

## How to judge

Score every candidate 0-10 on each criterion and pass or fail each assertion, blind to the variant.

## Task

```text
Read REQUIREMENTS.md. Choose the tech stack (language, framework, database, LLM access, hosting, testing) and write STACK.md with each choice, the alternatives you rejected and why, and the risks. Then add the smallest runnable prototype of the HTTP API in prototype/ that proves the riskiest choice works, with instructions to run it.
```

## Criteria (0-10 each)

1. Choices fit the constraints (budget, one developer, TypeScript now, Rust later)
2. Rejected alternatives and risks are concrete
3. The prototype targets the riskiest choice and its run instructions work
4. Backup and restore are addressed
5. No invented library APIs or versions

## Assertions (pass/fail)

- `STACK.md` exists in the workspace
- Uses only facts and packages given in the project
