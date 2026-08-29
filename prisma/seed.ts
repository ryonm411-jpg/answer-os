import { prisma } from "../lib/db/prisma";
import { CURATED_PROMPTS } from "../lib/prompts/curated";
import { classifyPromptType } from "../lib/prompts/classify";

async function main() {
  const existing = await prisma.prompt.count({ where: { source: "CURATED" } });
  if (existing === 0) {
    const created = await prisma.prompt.createMany({
      data: CURATED_PROMPTS, // source defaults to CURATED, companyId null, promptType UNBRANDED
    });
    console.log(`Seeded ${created.count} curated prompts.`);
  } else {
    console.log(`Prompt library already seeded (${existing} curated prompts).`);
  }

  // One-time backfill: classify all existing company-owned prompts
  const companyPrompts = await prisma.prompt.findMany({
    where: { companyId: { not: null } },
    include: { company: { select: { name: true, domain: true } } },
  });

  let classifiedCount = 0;
  for (const prompt of companyPrompts) {
    if (prompt.company) {
      const type = classifyPromptType(prompt.text, prompt.company.name, prompt.company.domain);
      if (prompt.promptType !== type) {
        await prisma.prompt.update({
          where: { id: prompt.id },
          data: { promptType: type },
        });
        classifiedCount++;
      }
    }
  }

  if (classifiedCount > 0) {
    console.log(`Backfilled promptType for ${classifiedCount} company prompts.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
