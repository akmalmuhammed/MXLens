-- Incident IDs are generated per organization; enforce that same scope in the database.
DROP INDEX IF EXISTS "AnalysisLog_incidentId_key";
CREATE UNIQUE INDEX "AnalysisLog_orgId_incidentId_key"
    ON "AnalysisLog"("orgId", "incidentId");
