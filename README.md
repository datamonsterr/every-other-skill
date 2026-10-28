# every-other-skill

My skill storage for [OtherSkill](https://github.com/datamonsterr/other-skill): 110 skills in 11 categories, covering product discovery, specs, frontend design, architecture, tech stack, web and mobile. Clone it on any machine, copy or point OtherSkill at it, done.

```text
every-other-skill/
├── otherskill.config.json     # categories + routing settings
└── .otherskill/bank/          # <category>/<skill>--<id>/  full skill trees, licenses, provenance
```

The bank sits outside `.claude/skills` and `.agents/skills`, so no agent loads it natively; OtherSkill's hook picks the few skills each prompt needs. Each skill folder keeps its upstream license and an `.otherskill.json` with source URL and commit.

## Install on a machine

Needs [OtherSkill](https://github.com/datamonsterr/other-skill) and a free [OpenRouter key](https://openrouter.ai/keys):

```sh
curl -fsSL https://raw.githubusercontent.com/datamonsterr/other-skill/master/install.sh | bash
export OPENROUTER_API_KEY=sk-or-v1-...        # add to ~/.zshrc or ~/.bashrc
git clone https://github.com/datamonsterr/every-other-skill ~/every-other-skill
cd ~/every-other-skill
```

Then pick one.

**Point at the clone** (`git pull` updates your skills):

```sh
mkdir -p ~/.config/otherskill
sed -e "s|\"bankPath\": \".otherskill/bank\"|\"bankPath\": \"$PWD/.otherskill/bank\"|" \
    -e 's|"scope": "project"|"scope": "global"|' \
    otherskill.config.json > ~/.config/otherskill/otherskill.config.json
```

**Or copy into OtherSkill's default global bank** (the clone can be deleted afterwards):

```sh
mkdir -p ~/.config/otherskill ~/.local/share/otherskill/bank
cp -R .otherskill/bank/. ~/.local/share/otherskill/bank/
sed -e 's|"bankPath": ".otherskill/bank"|"bankPath": "~/.local/share/otherskill/bank"|' \
    -e 's|"scope": "project"|"scope": "global"|' \
    otherskill.config.json > ~/.config/otherskill/otherskill.config.json
```

Both replace `~/.config/otherskill/otherskill.config.json`; back it up first if you have one. Then install the hook (once per machine) and check:

```sh
otherskill setup --non-interactive --scope global --agent claude --key-env OPENROUTER_API_KEY   # or --agents claude,codex
otherskill doctor          # bank path and "instances": 115
otherskill doctor --live   # one free-model request
```

Restart your agent. Projects with their own `otherskill.config.json` also see these skills (OtherSkill merges the global bank in).

## Skills

| Category | Count | Skills |
| --- | --- | --- |
| `product/discovery` | 13 | [`brainstorm-experiments-new`](https://github.com/phuryn/pm-skills/tree/HEAD/pm-product-discovery/skills/brainstorm-experiments-new), [`brainstorming`](https://github.com/obra/superpowers/tree/HEAD/skills/brainstorming), [`competitor-analysis`](https://github.com/phuryn/pm-skills/tree/HEAD/pm-market-research/skills/competitor-analysis), [`customer-journey-map`](https://github.com/phuryn/pm-skills/tree/HEAD/pm-market-research/skills/customer-journey-map), [`grill-me`](https://github.com/mattpocock/skills/tree/HEAD/skills/productivity/grill-me), [`in-your-own-words`](https://github.com/cursor/plugins/tree/HEAD/pstack/skills/in-your-own-words), [`lean-canvas`](https://github.com/phuryn/pm-skills/tree/HEAD/pm-product-strategy/skills/lean-canvas), [`market-research`](https://github.com/affaan-m/ecc/tree/HEAD/skills/market-research), [`market-sizing`](https://github.com/phuryn/pm-skills/tree/HEAD/pm-market-research/skills/market-sizing), [`opportunity-solution-tree`](https://github.com/phuryn/pm-skills/tree/HEAD/pm-product-discovery/skills/opportunity-solution-tree), [`product-lens`](https://github.com/affaan-m/ecc/tree/HEAD/skills/product-lens), [`user-personas`](https://github.com/phuryn/pm-skills/tree/HEAD/pm-market-research/skills/user-personas), [`value-proposition`](https://github.com/phuryn/pm-skills/tree/HEAD/pm-product-strategy/skills/value-proposition) |
| `product/spec` | 9 | [`create-prd`](https://github.com/phuryn/pm-skills/tree/HEAD/pm-execution/skills/create-prd), [`grill-with-docs`](https://github.com/mattpocock/skills/tree/HEAD/skills/engineering/grill-with-docs), [`intent-driven-development`](https://github.com/affaan-m/ecc/tree/HEAD/skills/intent-driven-development), [`pre-mortem`](https://github.com/phuryn/pm-skills/tree/HEAD/pm-execution/skills/pre-mortem), [`prioritization-frameworks`](https://github.com/phuryn/pm-skills/tree/HEAD/pm-execution/skills/prioritization-frameworks), [`product-capability`](https://github.com/affaan-m/ecc/tree/HEAD/skills/product-capability), [`to-spec`](https://github.com/mattpocock/skills/tree/HEAD/skills/engineering/to-spec), [`to-tickets`](https://github.com/mattpocock/skills/tree/HEAD/skills/engineering/to-tickets), [`user-stories`](https://github.com/phuryn/pm-skills/tree/HEAD/pm-execution/skills/user-stories) |
| `design/frontend` | 7 | [`accessibility`](https://github.com/affaan-m/ecc/tree/HEAD/skills/accessibility), [`design-system`](https://github.com/affaan-m/ecc/tree/HEAD/skills/design-system), [`design-taste-frontend`](https://github.com/Leonxlnx/taste-skill/tree/HEAD/skills/taste-skill), [`frontend-design`](https://github.com/anthropics/skills/tree/HEAD/skills/frontend-design), [`make-interfaces-feel-better`](https://github.com/affaan-m/ecc/tree/HEAD/skills/make-interfaces-feel-better), [`motion-foundations`](https://github.com/affaan-m/ecc/tree/HEAD/skills/motion-foundations), [`web-design-guidelines`](https://github.com/vercel-labs/agent-skills/tree/HEAD/skills/web-design-guidelines) |
| `architecture` | 11 | [`api-design`](https://github.com/affaan-m/ecc/tree/HEAD/skills/api-design), [`architect`](https://github.com/cursor/plugins/tree/HEAD/pstack/skills/architect), [`architecture-decision-records`](https://github.com/affaan-m/ecc/tree/HEAD/skills/architecture-decision-records), [`backend-patterns`](https://github.com/affaan-m/ecc/tree/HEAD/skills/backend-patterns), [`codebase-design`](https://github.com/mattpocock/skills/tree/HEAD/skills/engineering/codebase-design), [`contract-first`](https://github.com/affaan-m/ecc/tree/HEAD/skills/contract-first), [`domain-modeling`](https://github.com/mattpocock/skills/tree/HEAD/skills/engineering/domain-modeling), [`grill-with-docs`](https://github.com/mattpocock/skills/tree/HEAD/skills/engineering/grill-with-docs), [`hexagonal-architecture`](https://github.com/affaan-m/ecc/tree/HEAD/skills/hexagonal-architecture), [`improve-codebase-architecture`](https://github.com/mattpocock/skills/tree/HEAD/skills/engineering/improve-codebase-architecture), [`principle-foundational-thinking`](https://github.com/cursor/plugins/tree/HEAD/pstack/skills/principle-foundational-thinking) |
| `techstack` | 12 | [`bun-api`](https://github.com/dmythro/agent-skills/tree/HEAD/skills/bun-api), [`bun-cli`](https://github.com/dmythro/agent-skills/tree/HEAD/skills/bun-cli), [`database-migrations`](https://github.com/affaan-m/ecc/tree/HEAD/skills/database-migrations), [`deployment-patterns`](https://github.com/affaan-m/ecc/tree/HEAD/skills/deployment-patterns), [`docker-patterns`](https://github.com/affaan-m/ecc/tree/HEAD/skills/docker-patterns), [`mcp-builder`](https://github.com/anthropics/skills/tree/HEAD/skills/mcp-builder), [`openrouter`](https://github.com/nateslabach/skills/tree/HEAD/skills/openrouter), [`postgres-patterns`](https://github.com/affaan-m/ecc/tree/HEAD/skills/postgres-patterns), [`prototype`](https://github.com/mattpocock/skills/tree/HEAD/skills/engineering/prototype), [`research`](https://github.com/mattpocock/skills/tree/HEAD/skills/engineering/research), [`search-first`](https://github.com/affaan-m/ecc/tree/HEAD/skills/search-first), [`typescript-best-practices`](https://github.com/cursor/plugins/tree/HEAD/pstack/skills/typescript-best-practices) |
| `techstack/rust` | 8 | [`axum`](https://github.com/TerminalSkills/skills/tree/HEAD/skills/axum), [`coding-guidelines`](https://github.com/actionbook/rust-skills/tree/HEAD/skills/coding-guidelines), [`domain-cli`](https://github.com/actionbook/rust-skills/tree/HEAD/skills/domain-cli), [`domain-web`](https://github.com/actionbook/rust-skills/tree/HEAD/skills/domain-web), [`m06-error-handling`](https://github.com/actionbook/rust-skills/tree/HEAD/skills/m06-error-handling), [`m07-concurrency`](https://github.com/actionbook/rust-skills/tree/HEAD/skills/m07-concurrency), [`rusqlite`](https://github.com/claude-dev-suite/claude-dev-suite/tree/HEAD/skills/databases/rusqlite), [`rust-patterns`](https://github.com/affaan-m/ecc/tree/HEAD/skills/rust-patterns) |
| `web` | 11 | [`deploy-to-vercel`](https://github.com/vercel-labs/agent-skills/tree/HEAD/skills/deploy-to-vercel), [`e2e-testing`](https://github.com/affaan-m/ecc/tree/HEAD/skills/e2e-testing), [`nextjs-turbopack`](https://github.com/affaan-m/ecc/tree/HEAD/skills/nextjs-turbopack), [`react`](https://github.com/TerminalSkills/skills/tree/HEAD/skills/react), [`react-patterns`](https://github.com/affaan-m/ecc/tree/HEAD/skills/react-patterns), [`react-testing`](https://github.com/affaan-m/ecc/tree/HEAD/skills/react-testing), [`seo`](https://github.com/affaan-m/ecc/tree/HEAD/skills/seo), [`vercel-composition-patterns`](https://github.com/vercel-labs/agent-skills/tree/HEAD/skills/composition-patterns), [`vercel-react-best-practices`](https://github.com/vercel-labs/agent-skills/tree/HEAD/skills/react-best-practices), [`vite`](https://github.com/TerminalSkills/skills/tree/HEAD/skills/vite), [`webapp-testing`](https://github.com/anthropics/skills/tree/HEAD/skills/webapp-testing) |
| `mobile` | 17 | [`accessibility`](https://github.com/affaan-m/ecc/tree/HEAD/skills/accessibility), [`android-clean-architecture`](https://github.com/affaan-m/ecc/tree/HEAD/skills/android-clean-architecture), [`dart-flutter-patterns`](https://github.com/affaan-m/ecc/tree/HEAD/skills/dart-flutter-patterns), [`eas-app-stores`](https://github.com/expo/skills/tree/HEAD/plugins/expo/skills/eas-app-stores), [`expo-animation`](https://github.com/expo/skills/tree/HEAD/plugins/expo/skills/expo-animation), [`expo-data-fetching`](https://github.com/expo/skills/tree/HEAD/plugins/expo/skills/expo-data-fetching), [`expo-design-system`](https://github.com/expo/skills/tree/HEAD/plugins/expo/skills/expo-design-system), [`expo-native-ui`](https://github.com/expo/skills/tree/HEAD/plugins/expo/skills/expo-native-ui), [`expo-overview`](https://github.com/expo/skills/tree/HEAD/plugins/expo/skills/expo-overview), [`expo-project-structure`](https://github.com/expo/skills/tree/HEAD/plugins/expo/skills/expo-project-structure), [`expo-router`](https://github.com/expo/skills/tree/HEAD/plugins/expo/skills/expo-router), [`expo-upgrade`](https://github.com/expo/skills/tree/HEAD/plugins/expo/skills/expo-upgrade), [`react-native-best-practices`](https://github.com/callstackincubator/agent-skills/tree/HEAD/skills/react-native-best-practices), [`react-native-patterns`](https://github.com/affaan-m/ecc/tree/HEAD/skills/react-native-patterns), [`react-navigation`](https://github.com/callstackincubator/agent-skills/tree/HEAD/skills/react-navigation), [`swiftui-patterns`](https://github.com/affaan-m/ecc/tree/HEAD/skills/swiftui-patterns), [`vercel-react-native-skills`](https://github.com/vercel-labs/agent-skills/tree/HEAD/skills/react-native-skills) |
| `testing` | 10 | [`code-review`](https://github.com/mattpocock/skills/tree/HEAD/skills/engineering/code-review), [`create-verification-skill`](https://github.com/cursor/plugins/tree/HEAD/pstack/skills/create-verification-skill), [`diagnosing-bugs`](https://github.com/mattpocock/skills/tree/HEAD/skills/engineering/diagnosing-bugs), [`e2e-testing`](https://github.com/affaan-m/ecc/tree/HEAD/skills/e2e-testing), [`principle-prove-it-works`](https://github.com/cursor/plugins/tree/HEAD/pstack/skills/principle-prove-it-works), [`react-testing`](https://github.com/affaan-m/ecc/tree/HEAD/skills/react-testing), [`systematic-debugging`](https://github.com/obra/superpowers/tree/HEAD/skills/systematic-debugging), [`tdd`](https://github.com/mattpocock/skills/tree/HEAD/skills/engineering/tdd), [`verification-before-completion`](https://github.com/obra/superpowers/tree/HEAD/skills/verification-before-completion), [`webapp-testing`](https://github.com/anthropics/skills/tree/HEAD/skills/webapp-testing) |
| `skills` | 8 | [`agent-eval`](https://github.com/affaan-m/ecc/tree/HEAD/skills/agent-eval), [`find-skills`](https://github.com/vercel-labs/skills/tree/HEAD/skills/find-skills), [`skill-comply`](https://github.com/affaan-m/ecc/tree/HEAD/skills/skill-comply), [`skill-creator`](https://github.com/anthropics/skills/tree/HEAD/skills/skill-creator), [`skill-scout`](https://github.com/affaan-m/ecc/tree/HEAD/skills/skill-scout), [`skill-upper`](https://github.com/alibaba/skill-up/tree/HEAD/skills/skill-upper), [`writing-for-agents`](https://github.com/mattpocock/skills/tree/HEAD/skills/productivity/writing-for-agents), [`writing-skills`](https://github.com/obra/superpowers/tree/HEAD/skills/writing-skills) |
| `workflow` | 9 | [`arena`](https://github.com/cursor/plugins/tree/HEAD/pstack/skills/arena), [`dispatching-parallel-agents`](https://github.com/obra/superpowers/tree/HEAD/skills/dispatching-parallel-agents), [`handoff`](https://github.com/mattpocock/skills/tree/HEAD/skills/productivity/handoff), [`subagent-driven-development`](https://github.com/datamonsterr/superorchestrator/tree/HEAD/.claude/skills/subagent-driven-development), [`superorchestrator-cli`](https://github.com/datamonsterr/superorchestrator/tree/HEAD/plugin/skills/superorchestrator-cli), [`superorchestrator-config`](https://github.com/datamonsterr/superorchestrator/tree/HEAD/plugin/skills/superorchestrator-config), [`use-superorchestrator-mcp`](https://github.com/datamonsterr/superorchestrator/tree/HEAD/plugin/skills/use-superorchestrator-mcp), [`using-git-worktrees`](https://github.com/obra/superpowers/tree/HEAD/skills/using-git-worktrees), [`writing-plans`](https://github.com/obra/superpowers/tree/HEAD/skills/writing-plans) |

Sources: [affaan-m/ecc](https://github.com/affaan-m/ecc), [cursor/plugins pstack](https://github.com/cursor/plugins/tree/main/pstack), [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill), [mattpocock/skills](https://github.com/mattpocock/skills), [phuryn/pm-skills](https://github.com/phuryn/pm-skills), [obra/superpowers](https://github.com/obra/superpowers), [anthropics/skills](https://github.com/anthropics/skills), [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills), [vercel-labs/skills](https://github.com/vercel-labs/skills), [expo/skills](https://github.com/expo/skills), [callstackincubator/agent-skills](https://github.com/callstackincubator/agent-skills), [alibaba/skill-up](https://github.com/alibaba/skill-up), [datamonsterr/superorchestrator](https://github.com/datamonsterr/superorchestrator), plus the Rust, React/Vite, MCP, Bun and OpenRouter skills already used in my repos. All MIT or Apache-2.0; `vercel-labs/agent-skills` and `actionbook/rust-skills` declare MIT only in their README, so their folders carry a `LICENSE-NOTE.md`.

## Add or remove a skill

Run OtherSkill against this repo's config, then commit the bank:

```sh
otherskill add github:owner/repo --path skills/name --category web --scope project --cwd ~/every-other-skill
rm -rf .otherskill/bank/<category>/<skill>--<id>      # remove
```

To find skills: the `find-skills` skill (`npx skills find <query>`) or `otherskill search '<query>'`. Skip non-commercial licenses.

## Testing skills

Use [skill-up](https://github.com/alibaba/skill-up) (the `skill-upper` skill in the `skills` category drives it): it runs eval cases with and without a skill, judges with rules, scripts or an agent rubric, and reports the difference.
