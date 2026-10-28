#!/usr/bin/env bun
/** Print the bank grouped by category: `bun run list [--json] [--category id]`. */
import { argValue, bankPath, listBank, loadConfig } from "./lib.ts";

const args = process.argv.slice(2);
const filter = argValue(args, "--category");
const skills = listBank(bankPath()).filter(
  (s) =>
    !filter || s.category === filter || s.category.startsWith(`${filter}/`),
);
if (args.includes("--json")) {
  console.log(
    JSON.stringify(
      skills.map(({ category, name, description, meta }) => ({
        category,
        name,
        description,
        source: meta.source,
      })),
      null,
      2,
    ),
  );
} else {
  for (const c of loadConfig().categories) {
    const inCategory = skills.filter((s) => s.category === c.id);
    if (!inCategory.length) continue;
    console.log(`\n${c.id} (${inCategory.length})`);
    for (const s of inCategory)
      console.log(`  ${s.name.padEnd(34)} ${s.description.slice(0, 90)}`);
  }
}
