# Experiment: landing-page

**Question:** Does design-taste-frontend make the page less generic than frontend-design alone, and do they stack? Does the whole design/frontend category beat the best single skill?

The rubric below was fixed before any run. Do not change it after seeing outputs; write a new experiment instead.

## Variants

One skill-up config per variant in this folder; every variant runs the same case on the same project.

| Config | Skills installed |
| --- | --- |
| `baseline` | none |
| `design-category` | 7 skills: `accessibility`, `design-system`, `design-taste-frontend`, `frontend-design`, `make-interfaces-feel-better`, `motion-foundations`, `web-design-guidelines` |
| `frontend-design+taste` | `design-taste-frontend`, `frontend-design` |
| `frontend-design` | `frontend-design` |
| `taste` | `design-taste-frontend` |

## How to judge

Score every candidate 0-10 on each criterion and pass or fail each assertion, blind to the variant.

## Task

```text
Build the marketing landing page for the business in PRODUCT.md. Replace index.html with the finished page. Use plain HTML and CSS (inline or in styles.css next to it); no build step and no external JavaScript frameworks. It must work at phone and desktop widths. Use only facts from PRODUCT.md.
```

## Criteria (0-10 each)

1. Distinct visual direction that fits this business, not a template look
2. Typography, spacing and hierarchy
3. Copy is specific and uses only facts from PRODUCT.md
4. Works at phone width and is accessible (contrast, semantics, alt text)
5. Craft details: states, rhythm, imagery treatment

## Assertions (pass/fail)

- `index.html` exists in the workspace
- Uses only facts and packages given in the project
