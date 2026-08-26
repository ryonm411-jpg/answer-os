-- CreateTable
CREATE TABLE "ProviderPreference" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "enabledProviders" "AIProvider"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProviderPreference_companyId_key" ON "ProviderPreference"("companyId");

-- AddForeignKey
ALTER TABLE "ProviderPreference" ADD CONSTRAINT "ProviderPreference_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
