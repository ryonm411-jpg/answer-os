-- CreateEnum
CREATE TYPE "PromptSource" AS ENUM ('CURATED', 'AI_SUGGESTED');

-- AlterTable
ALTER TABLE "Prompt" ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "source" "PromptSource" NOT NULL DEFAULT 'CURATED';

-- CreateIndex
CREATE INDEX "Prompt_companyId_idx" ON "Prompt"("companyId");

-- CreateIndex
CREATE INDEX "Prompt_category_idx" ON "Prompt"("category");

-- AddForeignKey
ALTER TABLE "Prompt" ADD CONSTRAINT "Prompt_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
