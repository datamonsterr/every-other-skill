# every-other-skill

The skill bank and sandbox for our OtherSkill setup. Read README.md for the layout.

- `skillset.json` is the source of truth for the bank. Never edit `.otherskill/bank/`, `skills.lock.json` or the README skill table by hand; change `skillset.json` (or `otherskill.config.json` for categories) and run `bun run sync`.
- Skills authored here live in `skills/<name>/` and are listed in `skillset.json` with `"local": true`.
- Check a source's license before adding it; skip non-commercial licenses.
- Never commit `.sandbox/` output or any API key.
- Before reporting: `bun test` and `bun run check`.

Default to Bun instead of Node.js: `bun <file>`, `bun test`, `bun install`, `bun run <script>`, `bunx`. Bun loads .env automatically. Prefer `Bun.file`, `Bun.spawn` and `Bun.$` where they fit.
