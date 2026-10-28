#!/usr/bin/env sh
# skill-up script judge: runs in the case workspace; exit 0 = pass.
set -e
bun install --silent && bun run typecheck
