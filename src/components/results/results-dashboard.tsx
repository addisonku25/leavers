"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
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
import { DrillDownProvider } from "./drill-down-provider";
import { LeaverModal } from "./leaver-modal";

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
  const pathname = usePathname();

  const [modalState, setModalState] = useState<{
    migrationId: string;
    role: string;
    company: string;
    count: number;
  } | null>(null);

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

  // Build map: company -> (role -> migrationId) for click handler
  const migrationsByCompany = useMemo(() => {
    const map = new Map<string, Map<string, string>>();
    for (const m of migrations) {
      let roleMap = map.get(m.destinationCompany);
      if (!roleMap) {
        roleMap = new Map<string, string>();
        map.set(m.destinationCompany, roleMap);
      }
      roleMap.set(m.destinationRole, m.id);
    }
    return map;
  }, [migrations]);

  const handleRoleClick = (role: string, migrationId: string, company: string, count: number) => {
    setModalState({ migrationId, role, company, count });
  };

  const totalPeople = migrations.reduce((sum, m) => sum + m.count, 0);
  const totalCompanies = new Set(migrations.map((m) => m.destinationCompany))
    .size;
  const totalRoles = new Set(migrations.map((m) => m.destinationRole)).size;

  return (
    <DrillDownProvider>
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

      <CompanyGrid
        companies={companies}
        onRoleClick={handleRoleClick}
        migrationsByCompany={migrationsByCompany}
      />

      <LeaverModal
        open={modalState !== null}
        onOpenChange={(open) => { if (!open) setModalState(null); }}
        migrationId={modalState?.migrationId ?? null}
        role={modalState?.role ?? ""}
        company={modalState?.company ?? ""}
        count={modalState?.count ?? 0}
        returnTo={pathname}
      />
    </div>
    </DrillDownProvider>
  );
}
