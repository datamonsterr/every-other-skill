# Examples

One small project per skill set. Each is a [skill-up](https://github.com/alibaba/skill-up) suite that runs the same task once per skill set:

```text
examples/<name>/
├── project/             # starting files, copied fresh into every run
└── evals/
    ├── rubric.md        # written first: question, variants, task, criteria (0-10), assertions
    ├── cases/<case>.yaml
    ├── scripts/check.sh # optional script judge (build / typecheck)
    ├── baseline.yaml    # skills: []
    └── <variant>.yaml   # one skill-up config per skill set
```

| Example | Project | Variants |
| --- | --- | --- |
| `product-discovery` | `BRIEF.md` for a corner-shop checkout app | baseline, pm-skills, product-lens, discovery-category |
| `landing-page` | `PRODUCT.md` + empty `index.html` for a coffee roastery | baseline, frontend-design, taste, frontend-design+taste, design-category |
| `architecture` | `SPEC.md` for offline-first order sync | baseline, pocock, ecc, architecture-category |
| `techstack` | `REQUIREMENTS.md` for a shop assistant service | baseline, research-first, techstack-category |
| `web-app` | Vite + React + TS app with product data | baseline, vercel, web-category |
| `mobile-app` | Expo Router app with product data | baseline, expo, callstack, mobile-category |

Run one experiment, then judge it in Claude Code with `test-skill` (which uses `skill-ab-eval`):

```sh
ex=examples/web-app
for f in $ex/evals/*.yaml; do
  skill-up run "$f" --model sonnet --iteration 2 --output-dir ".sandbox/$(basename $ex)/$(basename "$f" .yaml)" || true
done
```

To add an example: write `rubric.md` first, keep the project tiny, give the prompt no hints about any skill, copy a variant config and change only `skills`, then run `bun test`. Record verdicts in `examples/<name>/RESULTS.md`.
