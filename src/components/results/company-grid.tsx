import type { CompanyCardData } from "@/lib/sankey-data";
import { CompanyCard } from "./company-card";

interface CompanyGridProps {
  companies: CompanyCardData[];
}

export function CompanyGrid({ companies }: CompanyGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {companies.map((company) => (
        <CompanyCard key={company.company} data={company} />
      ))}
    </div>
  );
}
