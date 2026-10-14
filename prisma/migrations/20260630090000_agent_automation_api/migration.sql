-- Agent and automation API support.

ALTER TYPE "IncidentSource" ADD VALUE IF NOT EXISTS 'API';
ALTER TYPE "IncidentSource" ADD VALUE IF NOT EXISTS 'GENERIC_WEBHOOK';

CREATE TYPE "AnalysisBatchStatus" AS ENUM (
    'QUEUED',
    'PROCESSING',
    'COMPLETED',
    'PARTIAL_FAILED',
    'FAILED'
);

CREATE TYPE "AnalysisBatchItemStatus" AS ENUM (
    'QUEUED',
    'PROCESSING',
    'COMPLETED',
    'FAILED'
);

ALTER TABLE "AnalysisLog"
    ADD COLUMN "apiKeyId" TEXT;

CREATE TABLE "AnalysisBatch" (
    "id" TEXT NOT NULL,
    "status" "AnalysisBatchStatus" NOT NULL DEFAULT 'QUEUED',
    "totalItems" INTEGER NOT NULL,
    "completedItems" INTEGER NOT NULL DEFAULT 0,
    "failedItems" INTEGER NOT NULL DEFAULT 0,
    "clientReferenceId" TEXT,
    "orgId" TEXT NOT NULL,
    "apiKeyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalysisBatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AnalysisBatchItem" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "status" "AnalysisBatchItemStatus" NOT NULL DEFAULT 'QUEUED',
    "sourceType" TEXT NOT NULL,
    "sourceLabel" TEXT,
    "filename" TEXT,
    "externalId" TEXT,
    "clientReferenceId" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "resultSummary" JSONB,
    "processingMs" INTEGER,
    "analysisLogId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalysisBatchItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ApiKey_keyPrefix_key" ON "ApiKey"("keyPrefix");
CREATE INDEX "AnalysisLog_apiKeyId_idx" ON "AnalysisLog"("apiKeyId");
CREATE INDEX "AnalysisBatch_orgId_createdAt_idx" ON "AnalysisBatch"("orgId", "createdAt");
CREATE INDEX "AnalysisBatch_apiKeyId_idx" ON "AnalysisBatch"("apiKeyId");
CREATE INDEX "AnalysisBatch_status_idx" ON "AnalysisBatch"("status");
CREATE UNIQUE INDEX "AnalysisBatchItem_batchId_position_key" ON "AnalysisBatchItem"("batchId", "position");
CREATE INDEX "AnalysisBatchItem_batchId_status_idx" ON "AnalysisBatchItem"("batchId", "status");
CREATE INDEX "AnalysisBatchItem_analysisLogId_idx" ON "AnalysisBatchItem"("analysisLogId");

ALTER TABLE "AnalysisLog"
    ADD CONSTRAINT "AnalysisLog_apiKeyId_fkey"
    FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AnalysisBatch"
    ADD CONSTRAINT "AnalysisBatch_orgId_fkey"
    FOREIGN KEY ("orgId") REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AnalysisBatch"
    ADD CONSTRAINT "AnalysisBatch_apiKeyId_fkey"
    FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AnalysisBatchItem"
    ADD CONSTRAINT "AnalysisBatchItem_batchId_fkey"
    FOREIGN KEY ("batchId") REFERENCES "AnalysisBatch"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AnalysisBatchItem"
    ADD CONSTRAINT "AnalysisBatchItem_analysisLogId_fkey"
    FOREIGN KEY ("analysisLogId") REFERENCES "AnalysisLog"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
