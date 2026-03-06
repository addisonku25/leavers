import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ResultsHeaderProps {
  company: string;
  role: string;
  totalPeople: number;
  totalCompanies: number;
  totalRoles: number;
}

export function ResultsHeader({
  company,
  role,
  totalPeople,
  totalCompanies,
  totalRoles,
}: ResultsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Where {role}s at {company} ended up
        </h1>
        <p className="mt-1 text-muted-foreground">
          {totalPeople} people &middot; {totalCompanies} companies &middot;{" "}
          {totalRoles} roles
        </p>
      </div>
      <Button asChild>
        <Link href="/">New Search</Link>
      </Button>
    </div>
  );
}
