#!/usr/bin/env sh
# Run a sandbox experiment inside the isolated container.
#   sandbox/docker.sh examples/landing-page/experiments/taste.json --runs 2 --judge
# Auth: export ANTHROPIC_API_KEY or CLAUDE_CODE_OAUTH_TOKEN (claude setup-token); OPENAI_API_KEY for codex.
set -eu
repo=$(cd "$(dirname "$0")/.." && pwd)
image=every-other-skill-sandbox
docker build -q -t "$image" "$repo/sandbox" >/dev/null
docker run --rm -t \
  -v "$repo:/repo" \
  -e ANTHROPIC_API_KEY -e CLAUDE_CODE_OAUTH_TOKEN -e OPENAI_API_KEY \
  "$image" sh -c 'bun install --frozen-lockfile --silent && bun sandbox/run.ts "$@"' sh "$@"
