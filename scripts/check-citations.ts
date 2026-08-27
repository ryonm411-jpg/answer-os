import { prisma } from "@/lib/db/prisma";
import { getSourcesSummary } from "@/lib/db/sources";

async function main() {
  // Find the company
  const company = await prisma.company.findFirst({
    where: { domain: "slickwraps.com" },
    select: { id: true, name: true, domain: true },
  });
  console.log("Company:", company);

  if (!company) {
    console.log("No company found!");
    await prisma.$disconnect();
    return;
  }

  // Test getSourcesSummary directly
  console.log("\n--- Calling getSourcesSummary(companyId) ---");
  const summary = await getSourcesSummary(company.id);
  console.log("totalSourcesCount:", summary.totalSourcesCount);
  console.log("breakdown:", JSON.stringify(summary.breakdown, null, 2));
  console.log("topDomains count:", summary.topDomains.length);
  if (summary.topDomains.length > 0) {
    console.log("First 3 domains:", JSON.stringify(summary.topDomains.slice(0, 3), null, 2));
  }

  // Also check what scan getSourcesSummary finds
  const latestCompletedScan = await prisma.scan.findFirst({
    where: { companyId: company.id, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    select: { id: true, completedAt: true },
  });
  console.log("\nLatest completed scan for company:", latestCompletedScan);

  await prisma.$disconnect();
}

main().catch(console.error);
