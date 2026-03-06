"use client";

import { useMemo } from "react";
import {
  groupMigrationsForCards,
  type MigrationRecord,
} from "@/lib/sankey-data";
import { ResultsHeader } from "./results-header";
import { CompanyGrid } from "./company-grid";

interface ResultsDashboardProps {
  search: { company: string; role: string };
  migrations: MigrationRecord[];
}

export function ResultsDashboard({
  search,
  migrations,
}: ResultsDashboardProps) {
  const companies = useMemo(
    () => groupMigrationsForCards(migrations, search.role),
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
      />

      {/* Sankey diagram will be inserted here by Plan 03 */}

      <CompanyGrid companies={companies} />
    </div>
  );
}
