import { defineConfig } from "@trigger.dev/sdk";
import { prismaExtension } from "@trigger.dev/build/extensions/prisma";

export default defineConfig({
  project: "proj_wcqhshlgjgctdeuuitnc",
  runtime: "node",
  logLevel: "log",
  maxDuration: 3600,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  // Jobs live in lib/jobs/ (architecture.md), not the CLI scaffold's src/trigger.
  dirs: ["./lib/jobs"],
  build: {
    extensions: [prismaExtension({ mode: "modern" })],
  },
});

