# Isolated runner for sandbox experiments: Bun, Git, Claude Code, Codex and Chromium.
# Build and run through sandbox/docker.sh.
FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends git ca-certificates curl unzip \
  && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://bun.sh/install | bash -s "bun-v1.3.14"
ENV PATH=/root/.bun/bin:$PATH

RUN npm install -g @anthropic-ai/claude-code @openai/codex playwright@1.63.0 \
  && npx -y playwright@1.63.0 install --with-deps chromium
ENV NODE_PATH=/usr/local/lib/node_modules

# A fresh home per container: no user skills, hooks, memory or plugins leak into runs.
ENV HOME=/sandbox-home
RUN mkdir -p /sandbox-home && git config --global init.defaultBranch main
WORKDIR /repo
