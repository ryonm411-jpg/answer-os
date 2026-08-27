import "dotenv/config";
import { prisma } from "../lib/db/prisma";

async function main() {
  const latestScan = await prisma.scan.findFirst({
    orderBy: { createdAt: "desc" },
    include: {
      company: true,
      results: {
        select: {
          id: true,
          provider: true,
          error: true,
          rawResponse: true,
          prompt: { select: { text: true } }
        }
      }
    }
  });

  if (!latestScan) {
    console.log("No scans found.");
    return;
  }

  console.log(`Scan ID: ${latestScan.id}`);
  console.log(`Company: ${latestScan.company.name} (${latestScan.company.domain})`);
  console.log(`Status: ${latestScan.status}`);
  console.log(`Total Results: ${latestScan.results.length}`);

  const errors = latestScan.results.filter(r => r.error !== null);
  console.log(`Failed checks: ${errors.length}`);

  const errorSummary: Record<string, { count: number; sampleError: string; samplePrompt: string; rawResponseSnippet?: string }> = {};

  for (const r of errors) {
    const key = `[${r.provider}] ${r.error}`;
    if (!errorSummary[key]) {
      errorSummary[key] = {
        count: 1,
        sampleError: r.error || "",
        samplePrompt: r.prompt.text,
        rawResponseSnippet: r.rawResponse ? r.rawResponse.substring(0, 150) : undefined
      };
    } else {
      errorSummary[key].count++;
    }
  }

  console.log("\n--- ERROR SUMMARY BY PROVIDER & REASON ---");
  console.log(JSON.stringify(errorSummary, null, 2));

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
