#!/usr/bin/env bun
/**
 * Offline stand-in for a coding agent (`--harness fake`). It "uses" every skill in
 * .claude/skills, writes OUTPUT.md and prints a Claude-style stream-json transcript,
 * so the sandbox pipeline can be tested without network or credentials.
 */
import fs from "node:fs";

const prompt = process.argv[2] ?? "";
const dir = ".claude/skills";
const skills = fs.existsSync(dir) ? fs.readdirSync(dir).sort() : [];
fs.writeFileSync(
  "OUTPUT.md",
  `# Fake agent\n\nPrompt: ${prompt}\n\nSkills: ${skills.join(", ") || "none"}\n`,
);
const emit = (event: unknown) => console.log(JSON.stringify(event));
emit({ type: "system", subtype: "init" });
emit({
  type: "assistant",
  message: {
    content: skills.map((skill) => ({
      type: "tool_use",
      name: "Skill",
      input: { skill },
    })),
  },
});
emit({
  type: "result",
  subtype: "success",
  is_error: false,
  num_turns: 1,
  duration_ms: 5,
  total_cost_usd: 0,
  result: `wrote OUTPUT.md with ${skills.length} skills`,
});
