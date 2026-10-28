# Examples

One small project per skill set, each with experiments that compare skill sets on the same prompt.

| Example | Project | Experiments |
| --- | --- | --- |
| `product-discovery` | `BRIEF.md` for a corner-shop checkout app | `discovery-skills.json`: none vs PM skills vs `product-lens` vs `product/discovery` |
| `landing-page` | `PRODUCT.md` + empty `index.html` for a coffee roastery | `taste.json`: none vs `frontend-design` vs `design-taste-frontend` vs both; `design-category.json`: taste vs whole `design/frontend` |
| `architecture` | `SPEC.md` for offline-first order sync | `architecture-skills.json`: none vs Matt Pocock vs ECC vs `architecture` |
| `techstack` | `REQUIREMENTS.md` for a shop assistant service | `techstack-skills.json`: none vs research-first vs `techstack` |
| `web-app` | Vite + React + TS app with product data | `web-skills.json`: none vs Vercel React skills vs `web` (check: build, capture: screenshot) |
| `mobile-app` | Expo Router app with product data | `mobile-skills.json`: none vs Expo vs Callstack vs `mobile` (check: typecheck) |

```sh
bun sandbox/run.ts examples/<example>/experiments/<experiment>.json --dry-run
bun sandbox/run.ts examples/<example>/experiments/<experiment>.json --runs 2 --judge
```

Each folder holds `project/` (copied fresh into every run), `prompts/` and `experiments/`. Record verdicts in `examples/<example>/RESULTS.md` (the `test-skill` skill describes the format). To add an example, keep the project tiny, give the prompt no hints about any skill, and add a rubric a reviewer can score from the output alone.
