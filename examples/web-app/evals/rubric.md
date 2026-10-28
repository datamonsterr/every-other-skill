# Experiment: web-app

**Question:** Do React skills improve structure and correctness of a small React feature?

The rubric below was fixed before any run. Do not change it after seeing outputs; write a new experiment instead.

## Variants

One skill-up config per variant in this folder; every variant runs the same case on the same project.

| Config | Skills installed |
| --- | --- |
| `baseline` | none |
| `vercel` | `vercel-composition-patterns`, `vercel-react-best-practices` |
| `web-category` | 11 skills: `deploy-to-vercel`, `e2e-testing`, `nextjs-turbopack`, `react`, `react-patterns`, `react-testing`, `seo`, `vercel-composition-patterns`, `vercel-react-best-practices`, `vite`, `webapp-testing` |

## How to judge

Score every candidate 0-10 on each criterion and pass or fail each assertion, blind to the variant.

## Task

```text
In this Vite + React + TypeScript app, build the shop's checkout screen using src/products.ts: a searchable, category-filterable product grid, a cart with quantities and a running total in VND, out-of-stock handling, and a "complete sale" action that clears the cart and decrements stock in state. Keep it in this app (no new runtime dependencies). `bun run build` must pass.
```

## Criteria (0-10 each)

1. Build passes and behavior matches the prompt (search, filter, cart, stock)
2. Component structure and state management are simple and idiomatic
3. Money is formatted correctly in VND and totals are exact
4. Accessible controls (labels, buttons, keyboard)
5. No unnecessary dependencies or abstractions

## Assertions (pass/fail)

- `src/App.tsx` exists in the workspace
- `bun install --silent && bun run build` exits 0 (skill-up script judge)
- Uses only facts and packages given in the project
