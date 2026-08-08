import { prisma } from "../lib/db/prisma";
import { CURATED_PROMPTS } from "../lib/prompts/curated";

// Idempotent by guard: curated prompts have no unique key (text repeats across
// companies), so skip instead of upsert. Deleting + re-inserting would cascade
// into ScanResult rows — never do that.
async function main() {
  const existing = await prisma.prompt.count({ where: { source: "CURATED" } });
  if (existing > 0) {
    console.log(`Prompt library already seeded (${existing} curated prompts). Skipping.`);
    return;
  }
  const created = await prisma.prompt.createMany({
    data: CURATED_PROMPTS, // source defaults to CURATED, companyId null
  });
  console.log(`Seeded ${created.count} curated prompts.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
