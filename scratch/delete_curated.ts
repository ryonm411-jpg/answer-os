import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/prisma";
import ws from "ws";
import { neonConfig } from "@neondatabase/serverless";

neonConfig.webSocketConstructor = ws;

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is missing in .env.local");
    process.exit(1);
  }

  const adapter = new PrismaNeon({ connectionString });
  const prisma = new PrismaClient({ adapter });

  const result = await prisma.prompt.deleteMany({
    where: {
      OR: [{ source: "CURATED" }, { companyId: null }],
    },
  });
  console.log(`Successfully deleted ${result.count} curated prompts from the database.`);
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
