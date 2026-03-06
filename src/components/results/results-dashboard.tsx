"use client";

import { useMemo } from "react";
import {
  groupMigrationsForCards,
  buildSankeyData,
  type MigrationRecord,
} from "@/lib/sankey-data";
import { computeInsights } from "@/lib/insights";
import { ResultsHeader } from "./results-header";
import { InsightsCard } from "./insights-card";
import { CompanyGrid } from "./company-grid";
import { SankeyDiagram } from "./sankey-diagram";
import { SankeyErrorBoundary } from "./sankey-error-boundary";
import { SaveSearchButton } from "@/components/save-search-button";

interface ResultsDashboardProps {
  search: { company: string; role: string };
  migrations: MigrationRecord[];
  searchId: string;
  initialSaved?: boolean;
}

export function ResultsDashboard({
  search,
  migrations,
  searchId,
  initialSaved = false,
}: ResultsDashboardProps) {
  const companies = useMemo(
    () => groupMigrationsForCards(migrations, search.role),
    [migrations, search.role],
  );

  const sankeyData = useMemo(
    () => buildSankeyData(migrations, search.role),
    [migrations, search.role],
  );

  const insights = useMemo(
    () => computeInsights(migrations, search.role),
    [migrations, search.role],
  );

  const totalPeople = migrations.reduce((sum, m) => sum + m.count, 0);
  const totalCompanies = new Set(migrations.map((m) => m.destinationCompany))
    .size;
  const totalRoles = new Set(migrations.map((m) => m.destinationRole)).size;

  return (
    <div className="space-y-8">
      <ResultsHeader
        company={search.company}
        role={search.role}
        totalPeople={totalPeople}
        totalCompanies={totalCompanies}
        totalRoles={totalRoles}
        saveButton={
          <SaveSearchButton searchId={searchId} initialSaved={initialSaved} />
        }
      />

      {migrations.length > 0 && (
        <SankeyErrorBoundary>
          <SankeyDiagram data={sankeyData} sourceCompany={search.company} />
        </SankeyErrorBoundary>
      )}

      {migrations.length > 0 && <InsightsCard insights={insights} />}

      <div className="border-b" />

      <CompanyGrid companies={companies} />
    </div>
  );
}
